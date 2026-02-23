import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser, getServiceClient } from '../_shared/auth.ts'
import { callLangdock } from '../_shared/langdock.ts'

// ─── V3 Response-Typ von der KI (12 BSI/BBK-Kapitel) ─────────────────────
interface AIKapitelResponse {
  nummer: number
  key: string
  titel: string
  inhalt: string
  checkliste: Array<{ text: string; notiz: string }>
}

interface AIEskalationsStufeResponse {
  stufe: 1 | 2 | 3
  name: string
  beschreibung: string
  ausloeser: string[]
  eskalations_kriterien: string[]
  lage_zusammenfassung: string
  kommunikation: {
    intern: string[]
    extern: string[]
    kanaele: string[]
    sprachregelungen: string[]
  }
  ressourcen: Array<{
    kategorie: string
    menge: string
    prioritaet: string
  }>
  krisenstab_rollen: string[]
  informierte: string[]
  sofortmassnahmen: string[]
}

interface AIHandbookResponseV3 {
  kapitel: AIKapitelResponse[]
  phasen: Array<{
    name: string
    dauer: string
    aufgaben: string[]
  }>
  massnahmenplan?: {
    alarmkette: Array<{ rolle: string; kontaktgruppen: string[]; kanaele: string[]; wartezeit_min: number }>
    aufgaben_zuweisung: Array<{ task_text: string; verantwortlich: string; prioritaet: string }>
  }
  eskalationsstufen?: AIEskalationsStufeResponse[]
}

// ─── Prompt-Builder ───────────────────────────────────
function buildSystemPrompt(
  // deno-lint-ignore no-explicit-any
  district: any,
  // deno-lint-ignore no-explicit-any
  municipalities: any[],
  // deno-lint-ignore no-explicit-any
  kritisSites: any[],
  // deno-lint-ignore no-explicit-any
  scenario: any,
  // deno-lint-ignore no-explicit-any
  phases: any[],
  // deno-lint-ignore no-explicit-any
  riskProfile: any | null,
  // deno-lint-ignore no-explicit-any
  riskEntries: any[],
  // deno-lint-ignore no-explicit-any
  contacts: any[],
  // deno-lint-ignore no-explicit-any
  inventoryItems: any[],
  documentText?: string | null
): string {
  const gemeindenList = municipalities
    .slice(0, 30)
    .map(m => `- ${m.name}: ${m.population} Einw., Risiko: ${m.risk_level || 'k.A.'} (${m.risk_score || 0}/100)`)
    .join('\n')

  const kritisList = kritisSites
    .slice(0, 40)
    .map(k => `- ${k.name} (${k.category}, Sektor: ${k.sector || 'k.A.'}), Risiko: ${k.risk_exposure || 'k.A.'}`)
    .join('\n')

  const sektorCounts: Record<string, number> = {}
  kritisSites.forEach(k => {
    const s = k.sector || 'sonstige'
    sektorCounts[s] = (sektorCounts[s] || 0) + 1
  })
  const sektorSummary = Object.entries(sektorCounts)
    .map(([s, c]) => `${s}: ${c}`)
    .join(', ')

  let riskSection = 'Keine aktuelle Risikoanalyse vorhanden.'
  if (riskProfile) {
    const entriesList = riskEntries
      .map(e => `- ${e.type}: ${e.score}/100 (${e.level}), Trend: ${e.trend}`)
      .join('\n')
    riskSection = `Gesamtrisiko: ${riskProfile.risk_score}/100 (${riskProfile.risk_level})\n${entriesList}`
  }

  const phasenList = phases
    .map((p, i) => {
      const tasks = (p.tasks || []).map((t: string) => `  • ${t}`).join('\n')
      return `Phase ${i + 1}: ${p.name} (${p.duration})\n${tasks}`
    })
    .join('\n\n')

  const allGroups = new Set<string>()
  contacts.forEach(c => (c.groups || []).forEach((g: string) => allGroups.add(g)))
  const kontaktGruppen = [...allGroups].join(', ') || 'Keine Kontaktgruppen definiert'

  const inventarList = inventoryItems
    .slice(0, 30)
    .map(i => `- ${i.category}: Ist ${i.current_quantity} / Soll ${i.target_quantity} ${i.unit}${i.location ? ` (${i.location})` : ''}`)
    .join('\n')

  let documentSection = ''
  if (documentText) {
    documentSection = `
## Bestehender Handlungsplan (hochgeladenes Dokument)
Das folgende Dokument wurde vom Nutzer als bestehender Handlungsplan hochgeladen.
Nutze es als Grundlage und ergänze/strukturiere die vorhandenen Informationen:

${documentText}

---
WICHTIG: Ergänze und strukturiere den bestehenden Handlungsplan. Übernimm relevante Inhalte und füge fehlende Abschnitte hinzu.
`
  }

  const aufgabenAnweisung = documentText
    ? 'Ergänze und strukturiere den bestehenden Handlungsplan des Landkreises zu einem vollständigen Krisenmanagement-Handbuch.'
    : 'Erstelle ein vollständiges Krisenmanagement-Handbuch für das folgende Szenario.'

  return `Du bist ein KI-Experte für Katastrophenschutz und Krisenmanagement in Deutschland, spezialisiert auf BBK-konforme Krisenhandbücher.
Du arbeitest für den Alarmplaner – ein Krisenmanagement-System für deutsche Landkreise.

Deine Aufgabe: ${aufgabenAnweisung}

## Landkreis-Daten
- Name: ${district.name}
- Bundesland: ${district.state}
- Einwohner: ${district.population?.toLocaleString('de-DE') || 'k.A.'}
- Fläche: ${district.area_km2 || 'k.A.'} km²

## Gemeinden (${municipalities.length})
${gemeindenList || '- Keine Gemeinden vorhanden'}

## Kritische Infrastruktur (${kritisSites.length} Objekte)
Sektoren: ${sektorSummary || 'Keine'}
${kritisList || '- Keine KRITIS-Objekte vorhanden'}

## Aktuelle Risikobewertung
${riskSection}

## Szenario
- Titel: ${scenario.title}
- Typ: ${scenario.type}
- Schweregrad: ${scenario.severity}/100
- Beschreibung: ${scenario.description || 'Keine Beschreibung'}
- Betroffene Bevölkerung: ${scenario.affected_population ? scenario.affected_population.toLocaleString('de-DE') : 'k.A.'}

## Bestehender Handlungsplan
${phasenList || 'Kein Handlungsplan vorhanden.'}

## Bestehende Kontakt-Gruppen
${kontaktGruppen}

## Bestehendes Inventar (${inventoryItems.length} Positionen)
${inventarList || '- Kein Inventar vorhanden'}
${documentSection}
## Anweisungen

Erstelle ein vollständiges Krisenmanagement-Handbuch nach **BSI/BBK-Standard** in **12-Kapitel-Struktur**. Jedes Kapitel hat:
- **key**: Semantischer Schlüssel (vorgegeben, NICHT ändern)
- **inhalt**: Ausführlicher Fließtext als **HTML** (NICHT Markdown!). Verwende: <h3> für Überschriften, <ul><li> für Listen, <strong> für Hervorhebungen, <p> für Absätze, <em> für Kursiv, <a href="..."> für Links. KEIN Markdown, nur reines HTML.
- **checkliste**: Konkrete abhakbare Aufgaben/Maßnahmen zu diesem Kapitel

### Kapitel 1 (key: "einleitung"): Einleitung
**Inhalt** (Fließtext):
- Zweck und Zielsetzung des Krisenhandbuchs (3-5 Sätze)
- Geltungsbereich: Räumlich (Landkreis ${district.name}), zeitlich, personell
- Rechtsgrundlagen: Relevante Gesetze (z.B. ZSKG, Katastrophenschutzgesetz des Bundeslandes, KRITIS-Verordnung)
- Abgrenzung zu anderen Plänen (z.B. Gefahrenabwehrplan, Notfallplan)
**Checkliste** (3-5 Items): Aufgaben zur Dokumentenpflege

### Kapitel 2 (key: "dokumentenmanagement"): Dokumentenmanagement
**Inhalt** (Fließtext):
- Versionierungsschema (Version, Datum, Änderungen, Freigabe)
- Verteilerliste: Wer erhält welche Version (Krisenstab, Gemeinden, BOS)
- Aktualisierungsrhythmus (mindestens jährlich + nach jedem Krisenereignis)
- Aufbewahrung: Digital + physisch an Ausweichstandorten
**Checkliste** (3-5 Items): Dokumentenmanagement-Aufgaben

### Kapitel 3 (key: "krisenorganisation"): Krisenorganisation
**Inhalt** (Fließtext):
- Pro Stabsfunktion (S1–S6) einen ### Header
- Kontaktgruppe wenn passend (aus: ${kontaktGruppen})
- 4-6 konkrete Aufgaben als - Bullets pro Funktion
- S1 Personal, S2 Lage, S3 Einsatz, S4 Versorgung, S5 Presse/Medien, S6 IT/Kommunikation
- ### Organigramm (Beschreibung der Aufbauorganisation)
- ### Stellvertreterregelung
**Checkliste** (10-18 Items): Wichtigste Aufgaben aller S1-S6 mit [S1]–[S6] Prefix

### Kapitel 4 (key: "aktivierung"): Aktivierung
**Inhalt** (Fließtext):
- ### Auslösekriterien (3-5 konkrete Schwellenwerte/Indikatoren, wann wird aktiviert)
- ### Aktivierungsstufen (Vorwarnung → Teilaktivierung → Vollaktivierung)
- ### Sofortmaßnahmen (erste 30/60 Minuten, 5-8 konkrete Schritte)
- ### Wenn-Dann-Regeln (4-6 Regeln: Trigger → Maßnahmen → Eskalation)
**Checkliste** (8-12 Items): Aktivierungs- und Sofortmaßnahmen-Tasks

### Kapitel 5 (key: "lagefuehrung"): Lageführung
**Inhalt** (Fließtext):
- ### Lagebild (Ausführliche Bedrohungsanalyse, 5-8 Sätze, spezifisch für diesen Landkreis)
- Zeile "Eintrittswahrscheinlichkeit: <Niedrig|Mittel|Hoch|Sehr hoch>"
- Zeile "Schadensausmaß: <Gering|Mittel|Erheblich|Katastrophal>"
- ### Risikobewertung (Zusammenfassende Risikoeinschätzung, 3-5 Sätze)
- Zeile "Betroffene KRITIS-Sektoren: <komma-separierte Liste>"
- ### Lageberichte (Format, Taktung, Verteiler)
- ### Prognose und Lageentwicklung
**Checkliste** (5-8 Items): Lageführungs-Aufgaben

### Kapitel 6 (key: "alarmierung_kommunikation"): Alarmierung und Kommunikation
**Inhalt** (Fließtext):
- ### Interne Kommunikation – Sofortmeldungen (3-5 Items)
- ### Interne Kommunikation – Laufend (3-5 Items)
- ### Externe Kommunikation – Bevölkerung (3-5 Items)
- ### Externe Kommunikation – Medien (2-4 Items)
- ### Externe Kommunikation – Behörden (2-4 Items)
- ### Warnmittel (NINA, Sirenen, Lautsprecherdurchsagen, Social Media, Website)
- ### Sprachregelungen (3-5 vorformulierte Kernaussagen als „Zitate")
**Checkliste** (8-12 Items): Wichtigste Kommunikationsmaßnahmen

### Kapitel 7 (key: "ressourcenmanagement"): Ressourcenmanagement
**Inhalt** (Fließtext):
- 8-15 Materialkategorien als - Bullets
- Format: - **Kategorie**: Menge Einheit – Begründung
- Basierend auf Bevölkerungszahl, Schweregrad, bestehendem Inventar
- Einheiten: Stück, kg, Liter, Paletten, Karton, Satz
- ### Personalplanung (Schichtmodell, Ablösung, Ruhezeiten)
- ### Logistik und Versorgung
**Checkliste** (8-15 Items): Pro Material "Kategorie: Menge Einheit beschaffen/prüfen"

### Kapitel 8 (key: "schutz_kritischer_funktionen"): Schutz kritischer Funktionen
**Inhalt** (Fließtext):
- ### KRITIS-Übersicht (betroffene Sektoren und Objekte aus dem Landkreis)
- Pro relevantem KRITIS-Sektor: Gefährdung und Schutzmaßnahmen (3-5 Sätze)
- ### Präventionsmaßnahmen (5-8 Maßnahmen als - Bullets)
- ### Frühwarnindikatoren (3-5 Indikatoren)
- ### Schutzkonzepte (Redundanz, Ausweichoptionen, Notversorgung)
**Checkliste** (8-12 Items): KRITIS-Schutzmaßnahmen

### Kapitel 9 (key: "notfallarbeitsplaetze"): Notfallarbeitsplätze
**Inhalt** (Fließtext):
- ### Ausweichstandorte (2-3 mögliche Standorte mit Anforderungen)
- ### IT-Notfallarbeitsplatz (minimale IT-Ausstattung, Kommunikationsmittel)
- ### Bürgertelefon / Bürgerinformation (Einrichtung, Personal, Betriebszeiten)
- ### Sammelstellen und Betreuungsplätze
**Checkliste** (5-8 Items): Aufbau-Aufgaben für Notfallarbeitsplätze

### Kapitel 10 (key: "wiederherstellung"): Wiederherstellung
**Inhalt** (Fließtext):
- ### Priorisierung (Was wird zuerst wiederhergestellt, P1-P4 Kategorien)
- ### Phasenmodell (Sofort → Kurzfristig → Mittelfristig → Langfristig)
- ### Kriterien für Rückkehr zum Normalbetrieb (3-5 konkrete Indikatoren)
- ### Übergabe an Regelbetrieb
**Checkliste** (5-8 Items): Wiederherstellungs-Maßnahmen

### Kapitel 11 (key: "dokumentation"): Dokumentation
**Inhalt** (Fließtext):
- ### Ereignis-Logbuch (Format: Datum/Uhrzeit, Ereignis, Maßnahme, Verantwortlich)
- ### Entscheidungsprotokoll (Wer hat was wann entschieden, Begründung)
- ### Kommunikationsprotokoll (Ein-/Ausgehende Nachrichten, Zeitstempel)
- ### Schadensdokumentation (Fotos, Berichte, Gutachten)
**Checkliste** (4-6 Items): Dokumentations-Aufgaben

### Kapitel 12 (key: "nachbereitung"): Nachbereitung
**Inhalt** (Fließtext):
- ### Lessons Learned (Strukturierter Auswertungsprozess)
- ### Hot Wash-up (Sofort-Nachbesprechung innerhalb 48h)
- ### Übungsplan (Jährliche Übungstypen: Stabsrahmenübung, Vollübung, Planspiel)
- ### Verbesserungsmaßnahmen (Dokumentierte Verbesserungen, Verantwortlichkeiten, Fristen)
**Checkliste** (5-8 Items): Nachbereitungs-Aufgaben

### Zusätzlich: Einsatzphasen (für separaten Handlungsplan-Tab)
- 4-6 zeitlich geordnete Einsatzphasen mit Name, Dauer und 3-6 Aufgaben
- Phasen: Sofortmaßnahmen → Erstreaktion → Krisenbewältigung → Stabilisierung → Nachsorge

### Zusätzlich: Maßnahmenplan (operativer Ablauf)
Erstelle einen operativen Maßnahmenplan mit:
1. **Alarmierungskette** (4-8 Schritte): Wer wird in welcher Reihenfolge über welchen Kanal alarmiert
   - S3 (Einsatz) typischerweise zuerst, S5 (Presse) erst bei Teilaktivierung/Vollaktivierung
   - Kontaktgruppen aus bestehenden Gruppen: ${kontaktGruppen}
   - Kanäle: telefon, email, funk, nina, sirene, messenger
2. **Aufgaben-Zuweisung**: Welche S-Funktion (S1-S6 oder "Alle") ist für welche Phase-Aufgabe verantwortlich
   - task_text muss exakt den Aufgabentexten aus den Phasen entsprechen
   - prioritaet: sofort, hoch, mittel, niedrig

### Zusätzlich: 3 Eskalationsstufen (operatives Stufenmodell)
Erstelle 3 Eskalationsstufen mit steigender Intensität:
- **Stufe 1 "Vorwarnung"**: Frühwarnung, Lage beobachten, Bereitschaft erhöhen
- **Stufe 2 "Akuter Vorfall"**: Sofortmaßnahmen, Krisenstab einberufen, Bevölkerung warnen
- **Stufe 3 "Katastrophe"**: Vollalarm, Evakuierung, externe Hilfe anfordern

Pro Stufe:
- **ausloeser**: 3 konkrete szenario-spezifische Auslösekriterien
- **eskalations_kriterien**: 2-3 Kriterien wann zur nächsten Stufe eskaliert wird (Stufe 3: leer)
- **lage_zusammenfassung**: 2-3 Sätze, die die typische Lage auf dieser Stufe beschreiben
- **kommunikation**: intern (3-4 Maßnahmen), extern (2-4 Maßnahmen), kanaele (aus: Telefon, E-Mail, Funk, NINA, Sirene, Lautsprecherdurchsage, Social Media, Presse, Website, Messenger), sprachregelungen (1-2 vorformulierte Sätze pro Stufe)
- **ressourcen**: 3-6 konkrete Ressourcen mit kategorie, menge (z.B. "500 Stück"), prioritaet (kritisch, hoch, mittel, niedrig) — passend zum Szenario und zur Stufe (Stufe 1 weniger, Stufe 3 mehr)
- **krisenstab_rollen**: Welche S-Funktionen aktiv sind (Stufe 1: wenige, Stufe 3: alle S1-S6)
- **informierte**: Wer wird informiert (3-5 Stellen/Rollen)
- **sofortmassnahmen**: 3-5 konkrete Sofortmaßnahmen

Antworte AUSSCHLIESSLICH im folgenden JSON-Format (kein Markdown, kein Text drumherum):
{
  "kapitel": [
    {
      "nummer": 1,
      "key": "einleitung",
      "titel": "Einleitung",
      "inhalt": "<h3>Überschrift</h3><p>Fließtext als HTML</p><ul><li>Listenpunkt</li></ul>",
      "checkliste": [
        { "text": "<konkrete Aufgabe>", "notiz": "" },
        ...
      ]
    },
    { "nummer": 2, "key": "dokumentenmanagement", ... },
    { "nummer": 3, "key": "krisenorganisation", ... },
    { "nummer": 4, "key": "aktivierung", ... },
    { "nummer": 5, "key": "lagefuehrung", ... },
    { "nummer": 6, "key": "alarmierung_kommunikation", ... },
    { "nummer": 7, "key": "ressourcenmanagement", ... },
    { "nummer": 8, "key": "schutz_kritischer_funktionen", ... },
    { "nummer": 9, "key": "notfallarbeitsplaetze", ... },
    { "nummer": 10, "key": "wiederherstellung", ... },
    { "nummer": 11, "key": "dokumentation", ... },
    { "nummer": 12, "key": "nachbereitung", ... }
  ],
  "phasen": [
    { "name": "<string>", "dauer": "<string>", "aufgaben": ["...", ...] }
  ],
  "massnahmenplan": {
    "alarmkette": [
      { "rolle": "S3 – Einsatz", "kontaktgruppen": ["Krisenstab"], "kanaele": ["telefon","funk"], "wartezeit_min": 0 },
      ...
    ],
    "aufgaben_zuweisung": [
      { "task_text": "<exakter Task-Text aus Phasen>", "verantwortlich": "S3", "prioritaet": "sofort" },
      ...
    ]
  },
  "eskalationsstufen": [
    {
      "stufe": 1,
      "name": "Vorwarnung",
      "beschreibung": "...",
      "ausloeser": ["...", "...", "..."],
      "eskalations_kriterien": ["...", "..."],
      "lage_zusammenfassung": "...",
      "kommunikation": { "intern": ["..."], "extern": ["..."], "kanaele": ["Telefon", "E-Mail"], "sprachregelungen": ["..."] },
      "ressourcen": [{ "kategorie": "...", "menge": "...", "prioritaet": "hoch" }],
      "krisenstab_rollen": ["S2", "S5"],
      "informierte": ["..."],
      "sofortmassnahmen": ["..."]
    },
    { "stufe": 2, "name": "Akuter Vorfall", ... },
    { "stufe": 3, "name": "Katastrophe", ... }
  ]
}`
}

// ─── Edge Function Handler ────────────────────────────
Deno.serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Auth validieren
    const user = await getAuthenticatedUser(req)

    // 2. Input parsen
    const { scenarioId, documentId } = await req.json()
    if (!scenarioId) {
      throw new Error('scenarioId ist erforderlich.')
    }

    // 3. Service-Client (für Cross-Table Reads)
    const supabase = getServiceClient()

    // 4. Szenario laden
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single()

    if (scenarioError || !scenario) {
      throw new Error('Szenario nicht gefunden.')
    }

    // 5. District laden + User-Berechtigung prüfen
    const { data: district, error: districtError } = await supabase
      .from('districts')
      .select('*')
      .eq('id', scenario.district_id)
      .eq('user_id', user.id)
      .single()

    if (districtError || !district) {
      throw new Error('Landkreis nicht gefunden oder keine Berechtigung.')
    }

    // 6. Phasen laden
    const { data: phases } = await supabase
      .from('scenario_phases')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('sort_order')

    // 7. Gemeinden laden
    const { data: municipalities } = await supabase
      .from('municipalities')
      .select('*')
      .eq('district_id', district.id)
      .order('population', { ascending: false })

    // 8. KRITIS-Objekte laden
    const { data: kritisSites } = await supabase
      .from('kritis_sites')
      .select('*')
      .eq('district_id', district.id)
      .order('name')

    // 9. Aktuelles Risikoprofil
    const { data: riskProfile } = await supabase
      .from('risk_profiles')
      .select('*')
      .eq('district_id', district.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // deno-lint-ignore no-explicit-any
    let riskEntries: any[] = []
    if (riskProfile) {
      const { data } = await supabase
        .from('risk_entries')
        .select('*')
        .eq('risk_profile_id', riskProfile.id)
        .order('score', { ascending: false })
      riskEntries = data ?? []
    }

    // 10. Kontakte laden
    const { data: contacts } = await supabase
      .from('alert_contacts')
      .select('*')
      .eq('district_id', district.id)
      .eq('is_active', true)
      .order('name')

    // 10a. Bestehendes Inventar laden
    const { data: inventoryItems } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('district_id', district.id)
      .order('category')

    // 10b. Optionales Dokument laden
    let documentText: string | null = null
    if (documentId) {
      try {
        const { data: doc } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .eq('district_id', district.id)
          .single()

        if (doc?.storage_path) {
          const { data: fileData } = await supabase.storage
            .from('documents')
            .download(doc.storage_path)

          if (fileData) {
            const text = await fileData.text()
            documentText = text.substring(0, 8000)
            console.log(`Dokument geladen: ${doc.name} (${documentText.length} Zeichen)`)

            await supabase
              .from('documents')
              .update({ is_processed: true })
              .eq('id', documentId)
          }
        }
      } catch (docErr) {
        console.warn('Dokument laden fehlgeschlagen (non-blocking):', docErr)
      }
    }

    // 11. System-Prompt bauen
    const systemPrompt = buildSystemPrompt(
      district,
      municipalities ?? [],
      kritisSites ?? [],
      scenario,
      phases ?? [],
      riskProfile,
      riskEntries,
      contacts ?? [],
      inventoryItems ?? [],
      documentText
    )

    console.log(`KI-Handbuch V3 generieren für Szenario "${scenario.title}" (District: ${district.name})${documentId ? ' [mit Dokument-Kontext]' : ''}`)

    // 12. Langdock API aufrufen
    const aiResponse = await callLangdock(
      [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: documentText
            ? `Ergänze und strukturiere den bestehenden Handlungsplan zu einem vollständigen BSI/BBK-konformen Krisenmanagement-Handbuch (V3 mit 12 Kapiteln) für das Szenario "${scenario.title}" im Landkreis ${district.name} als JSON.`
            : `Erstelle jetzt das vollständige BSI/BBK-konforme Krisenmanagement-Handbuch (V3 mit 12 Kapiteln) für das Szenario "${scenario.title}" im Landkreis ${district.name} als JSON.`,
        },
      ],
      { max_tokens: 16384 }
    )

    // 13. JSON parsen
    const aiResult: AIHandbookResponseV3 = JSON.parse(aiResponse)

    // 14. Validieren
    if (!aiResult.kapitel || !Array.isArray(aiResult.kapitel) || aiResult.kapitel.length === 0) {
      throw new Error('KI-Antwort hat ein ungültiges Format. Keine Kapitel vorhanden.')
    }

    // 15. V3-Handbook aufbauen mit IDs, Keys und Status
    const V3_KAPITEL_KEYS = [
      'einleitung', 'dokumentenmanagement', 'krisenorganisation', 'aktivierung',
      'lagefuehrung', 'alarmierung_kommunikation', 'ressourcenmanagement',
      'schutz_kritischer_funktionen', 'notfallarbeitsplaetze', 'wiederherstellung',
      'dokumentation', 'nachbereitung',
    ]

    const handbookV3 = {
      version: 3 as const,
      kapitel: aiResult.kapitel.map((kap) => ({
        id: `kap-${kap.nummer}`,
        nummer: kap.nummer,
        key: kap.key || V3_KAPITEL_KEYS[kap.nummer - 1] || `kapitel-${kap.nummer}`,
        titel: kap.titel,
        inhalt: kap.inhalt || '',
        checkliste: (kap.checkliste || []).map((item) => ({
          id: crypto.randomUUID(),
          text: item.text,
          status: 'open' as const,
          notiz: item.notiz || '',
          completed_at: null,
        })),
      })),
      generated_at: new Date().toISOString(),
    }

    // 16. Handbook speichern
    const { data: updatedScenario, error: updateError } = await supabase
      .from('scenarios')
      .update({
        handbook: handbookV3,
        is_handbook_generated: true,
      })
      .eq('id', scenarioId)
      .select()
      .single()

    if (updateError) {
      console.error('Handbook update error:', updateError)
      throw new Error('Fehler beim Speichern des Handbuchs.')
    }

    const totalChecklistItems = handbookV3.kapitel.reduce((sum, k) => sum + k.checkliste.length, 0)
    console.log(`KI-Handbuch V3 erstellt für "${scenario.title}" – ${handbookV3.kapitel.length} Kapitel, ${totalChecklistItems} Checklisten-Items`)

    // 17. Phasen: bestehende löschen + neue aus KI einfügen
    try {
      await supabase.from('scenario_phases').delete().eq('scenario_id', scenarioId)

      if (aiResult.phasen?.length > 0) {
        const phaseInserts = aiResult.phasen.map((p, i) => ({
          scenario_id: scenarioId,
          sort_order: i,
          name: p.name,
          duration: p.dauer,
          tasks: p.aufgaben || [],
        }))
        const { error: phaseError } = await supabase.from('scenario_phases').insert(phaseInserts)
        if (phaseError) {
          console.error('Phasen-Insert Fehler:', phaseError)
        } else {
          console.log(`${phaseInserts.length} KI-Phasen erstellt für "${scenario.title}"`)
        }
      }
    } catch (phaseErr) {
      console.warn('Phasen-Insert fehlgeschlagen (non-blocking):', phaseErr)
    }

    // 18. Maßnahmenplan + Eskalationsstufen in scenarios.meta speichern (non-blocking)
    try {
      const currentMeta = (updatedScenario.meta as Record<string, unknown>) || {}
      const metaUpdate: Record<string, unknown> = { ...currentMeta }

      // Maßnahmenplan
      if (aiResult.massnahmenplan) {
        const alarmkette = (aiResult.massnahmenplan.alarmkette || []).map((schritt, idx) => ({
          id: crypto.randomUUID(),
          reihenfolge: idx + 1,
          rolle: schritt.rolle,
          kontaktgruppen: schritt.kontaktgruppen || [],
          kanaele: schritt.kanaele || [],
          wartezeit_min: schritt.wartezeit_min || 0,
          bedingung: null,
        }))
        const aufgaben_zuweisung = (aiResult.massnahmenplan.aufgaben_zuweisung || []).map(z => ({
          task_text: z.task_text,
          verantwortlich: z.verantwortlich || null,
          prioritaet: z.prioritaet || 'mittel',
        }))
        metaUpdate.massnahmenplan = {
          alarmkette,
          aufgaben_zuweisung,
          generated_at: new Date().toISOString(),
          last_edited: null,
        }
        console.log(`Maßnahmenplan: ${alarmkette.length} Alarmketten-Schritte, ${aufgaben_zuweisung.length} Zuweisungen`)
      }

      // Eskalationsstufen (NEU)
      if (aiResult.eskalationsstufen?.length === 3) {
        const eskalationsstufen = aiResult.eskalationsstufen.map(es => ({
          stufe: es.stufe,
          name: es.name,
          beschreibung: es.beschreibung || '',
          checkliste: [],
          alarmkette: [],  // Wird aus massnahmenplan.alarmkette befüllt
          krisenstab_rollen: es.krisenstab_rollen || [],
          ausloeser: es.ausloeser || [],
          informierte: es.informierte || [],
          sofortmassnahmen: es.sofortmassnahmen || [],
          eskalations_kriterien: es.eskalations_kriterien || [],
          lage_zusammenfassung: es.lage_zusammenfassung || '',
          kommunikation: {
            intern: es.kommunikation?.intern || [],
            extern: es.kommunikation?.extern || [],
            kanaele: es.kommunikation?.kanaele || [],
            sprachregelungen: es.kommunikation?.sprachregelungen || [],
          },
          ressourcen: (es.ressourcen || []).map(r => ({
            id: crypto.randomUUID(),
            kategorie: r.kategorie,
            menge: r.menge,
            prioritaet: r.prioritaet || 'mittel',
            bereitgestellt: false,
          })),
        }))
        metaUpdate.eskalationsstufen = eskalationsstufen
        console.log(`Eskalationsstufen generiert: ${eskalationsstufen.map(s => `Stufe ${s.stufe}: ${s.ressourcen.length} Ressourcen, ${s.kommunikation.intern.length}+${s.kommunikation.extern.length} Kommunikation`).join(', ')}`)
      }

      await supabase
        .from('scenarios')
        .update({ meta: metaUpdate })
        .eq('id', scenarioId)
    } catch (mpErr) {
      console.warn('Meta-Save fehlgeschlagen (non-blocking):', mpErr)
    }

    // 19. Ergebnis zurückgeben (keine Auto-Checklisten mehr – leben jetzt in Kapiteln)
    return new Response(
      JSON.stringify({
        success: true,
        scenario: updatedScenario,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('ai-enrich-scenario error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error
          ? error.message
          : 'Unbekannter Fehler bei der Handbuch-Generierung.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})

import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser, getServiceClient } from '../_shared/auth.ts'
import { callLangdock } from '../_shared/langdock.ts'

// ─── V2 Response-Typ von der KI ─────────────────────
interface AIKapitelResponse {
  nummer: number
  titel: string
  inhalt: string
  checkliste: Array<{ text: string; notiz: string }>
}

interface AIHandbookResponseV2 {
  kapitel: AIKapitelResponse[]
  phasen: Array<{
    name: string
    dauer: string
    aufgaben: string[]
  }>
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

Erstelle ein vollständiges Krisenmanagement-Handbuch in **Kapitel-Struktur**. Jedes Kapitel hat:
- **inhalt**: Ausführlicher Fließtext (mehrzeilig, mit Markdown: ### für Überschriften, - für Listen, **fett** für Hervorhebungen)
- **checkliste**: Konkrete abhakbare Aufgaben/Maßnahmen zu diesem Kapitel

### Kapitel 1: Risikobewertung & Gefahrenanalyse
**Inhalt** (Fließtext):
- Ausführliche Bedrohungsanalyse (5-8 Sätze, spezifisch für diesen Landkreis)
- Zeile "Eintrittswahrscheinlichkeit: <Niedrig|Mittel|Hoch|Sehr hoch>"
- Zeile "Schadensausmaß: <Gering|Mittel|Erheblich|Katastrophal>"
- Zusammenfassende Risikoeinschätzung (3-5 Sätze)
- Zeile "Betroffene KRITIS-Sektoren: <komma-separierte Liste>"
**Checkliste** (3-5 Items): Aufgaben zur Risikobewertung

### Kapitel 2: Handlungsplan & Einsatzphasen
**Inhalt** (Fließtext):
- Pro Phase einen ### Header mit Name und Dauer
- Darunter die Aufgaben als - Bullet-Points
- 4-6 zeitlich geordnete Phasen: Sofortmaßnahmen → Erstreaktion → Krisenbewältigung → Stabilisierung → Nachsorge
**Checkliste** (8-15 Items): Die wichtigsten Aufgaben aus allen Phasen

### Kapitel 3: Krisenstab & Verantwortlichkeiten
**Inhalt** (Fließtext):
- Pro Stabsfunktion (S1–S6) einen ### Header
- Kontaktgruppe wenn passend (aus: ${kontaktGruppen})
- 4-6 konkrete Aufgaben als - Bullets pro Funktion
- S1 Personal, S2 Lage, S3 Einsatz, S4 Versorgung, S5 Presse/Medien, S6 IT/Kommunikation
**Checkliste** (10-18 Items): Wichtigste Aufgaben aller S1-S6 mit [S1]–[S6] Prefix

### Kapitel 4: Krisenkommunikation
**Inhalt** (Fließtext):
- ### Interne Kommunikation – Sofortmeldungen (3-5 Items)
- ### Interne Kommunikation – Laufend (3-5 Items)
- ### Externe Kommunikation – Bevölkerung (3-5 Items)
- ### Externe Kommunikation – Medien (2-4 Items)
- ### Externe Kommunikation – Behörden (2-4 Items)
- ### Kommunikationskanäle (z.B. NINA, Lautsprecher, Social Media, Website)
- ### Sprachregelungen (3-5 vorformulierte Kernaussagen als „Zitate")
**Checkliste** (8-12 Items): Wichtigste Kommunikationsmaßnahmen

### Kapitel 5: Eskalationsstufen & Wenn-Dann-Regeln
**Inhalt** (Fließtext):
- 4-6 Wenn-Dann-Regeln
- Pro Regel: ### Wenn: <Trigger>
- Dann: (als - Bullets, 2-4 Maßnahmen)
- Eskalation: <Was wenn Maßnahmen nicht greifen>
**Checkliste** (4-6 Items): Pro Regel "Regel prüfen: <Trigger>"

### Kapitel 6: Prävention & Vorbereitung
**Inhalt** (Fließtext):
- ### Vorbereitung (5-8 Maßnahmen als - Bullets)
- ### Frühwarnung (3-5 Maßnahmen)
- ### Schulungen (3-5 Maßnahmen)
- ### Materialvorhaltung (3-5 Maßnahmen)
**Checkliste** (10-15 Items): Alle Maßnahmen mit [Vorbereitung]/[Frühwarnung]/[Schulung]/[Material] Prefix

### Kapitel 7: Material & Ressourcen
**Inhalt** (Fließtext):
- 8-15 Materialkategorien als - Bullets
- Format: - **Kategorie**: Menge Einheit – Begründung
- Basierend auf Bevölkerungszahl, Schweregrad, bestehendem Inventar
- Einheiten: Stück, kg, Liter, Paletten, Karton, Satz
**Checkliste** (8-15 Items): Pro Material "Kategorie: Menge Einheit beschaffen/prüfen"

### Zusätzlich: Einsatzphasen (für separaten Handlungsplan-Tab)
- 4-6 Phasen mit Name, Dauer und 3-6 Aufgaben

Antworte AUSSCHLIESSLICH im folgenden JSON-Format (kein Markdown, kein Text drumherum):
{
  "kapitel": [
    {
      "nummer": 1,
      "titel": "Risikobewertung & Gefahrenanalyse",
      "inhalt": "<mehrzeiliger Fließtext mit Markdown>",
      "checkliste": [
        { "text": "<konkrete Aufgabe>", "notiz": "" },
        ...
      ]
    },
    {
      "nummer": 2,
      "titel": "Handlungsplan & Einsatzphasen",
      "inhalt": "...",
      "checkliste": [...]
    },
    ...
  ],
  "phasen": [
    { "name": "<string>", "dauer": "<string>", "aufgaben": ["...", ...] }
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

    console.log(`KI-Handbuch V2 generieren für Szenario "${scenario.title}" (District: ${district.name})${documentId ? ' [mit Dokument-Kontext]' : ''}`)

    // 12. Langdock API aufrufen
    const aiResponse = await callLangdock(
      [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: documentText
            ? `Ergänze und strukturiere den bestehenden Handlungsplan zu einem vollständigen Krisenmanagement-Handbuch (V2 Kapitel-Format) für das Szenario "${scenario.title}" im Landkreis ${district.name} als JSON.`
            : `Erstelle jetzt das vollständige Krisenmanagement-Handbuch (V2 Kapitel-Format) für das Szenario "${scenario.title}" im Landkreis ${district.name} als JSON.`,
        },
      ],
      { max_tokens: 10240 }
    )

    // 13. JSON parsen
    const aiResult: AIHandbookResponseV2 = JSON.parse(aiResponse)

    // 14. Validieren
    if (!aiResult.kapitel || !Array.isArray(aiResult.kapitel) || aiResult.kapitel.length === 0) {
      throw new Error('KI-Antwort hat ein ungültiges Format. Keine Kapitel vorhanden.')
    }

    // 15. V2-Handbook aufbauen mit IDs und Status
    const handbookV2 = {
      version: 2 as const,
      kapitel: aiResult.kapitel.map((kap) => ({
        id: `kap-${kap.nummer}`,
        nummer: kap.nummer,
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
        handbook: handbookV2,
        is_handbook_generated: true,
      })
      .eq('id', scenarioId)
      .select()
      .single()

    if (updateError) {
      console.error('Handbook update error:', updateError)
      throw new Error('Fehler beim Speichern des Handbuchs.')
    }

    const totalChecklistItems = handbookV2.kapitel.reduce((sum, k) => sum + k.checkliste.length, 0)
    console.log(`KI-Handbuch V2 erstellt für "${scenario.title}" – ${handbookV2.kapitel.length} Kapitel, ${totalChecklistItems} Checklisten-Items`)

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

    // 18. Ergebnis zurückgeben (keine Auto-Checklisten mehr – leben jetzt in Kapiteln)
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

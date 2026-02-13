import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser, getServiceClient } from '../_shared/auth.ts'
import { callLangdock } from '../_shared/langdock.ts'

// ─── Response-Typ von der KI ──────────────────────────
interface AIHandbookResponse {
  risikobewertung: {
    bedrohungsanalyse: string
    eintrittswahrscheinlichkeit: string
    schadensausmass: string
    betroffene_sektoren: string[]
    risikoeinschaetzung: string
  }
  praevention: {
    vorbereitung: string[]
    fruehwarnung: string[]
    schulungen: string[]
    materialvorhaltung: string[]
  }
  kommunikationsplan: {
    intern: { sofort: string[]; laufend: string[] }
    extern: { bevoelkerung: string[]; medien: string[]; behoerden: string[] }
    kanaele: string[]
    sprachregelungen: string[]
  }
  wennDannSzenarien: Array<{
    trigger: string
    massnahmen: string[]
    eskalation: string
  }>
  verantwortlichkeiten: Array<{
    funktion: string
    aufgaben: string[]
    kontaktgruppe?: string
  }>
  inventar: Array<{
    kategorie: string
    empfohlene_menge: number
    einheit: string
    begruendung: string
  }>
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
    .slice(0, 30) // Limit um Token zu sparen
    .map(m => `- ${m.name}: ${m.population} Einw., Risiko: ${m.risk_level || 'k.A.'} (${m.risk_score || 0}/100)`)
    .join('\n')

  const kritisList = kritisSites
    .slice(0, 40)
    .map(k => `- ${k.name} (${k.category}, Sektor: ${k.sector || 'k.A.'}), Risiko: ${k.risk_exposure || 'k.A.'}`)
    .join('\n')

  // Sektoren aggregieren
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

  // Kontakt-Gruppen extrahieren
  const allGroups = new Set<string>()
  contacts.forEach(c => (c.groups || []).forEach((g: string) => allGroups.add(g)))
  const kontaktGruppen = [...allGroups].join(', ') || 'Keine Kontaktgruppen definiert'

  // Inventar-Liste
  const inventarList = inventoryItems
    .slice(0, 30)
    .map(i => `- ${i.category}: Ist ${i.current_quantity} / Soll ${i.target_quantity} ${i.unit}${i.location ? ` (${i.location})` : ''}`)
    .join('\n')

  // Bestehender Handlungsplan (aus hochgeladenem Dokument)
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

Erstelle ein vollständiges Krisenmanagement-Handbuch mit folgenden Abschnitten:

### 1. Risikobewertung
- Detaillierte Bedrohungsanalyse (3-5 Sätze, spezifisch für diesen Landkreis)
- Eintrittswahrscheinlichkeit: genau eines von "niedrig", "mittel", "hoch", "sehr_hoch"
- Schadensausmaß: genau eines von "gering", "mittel", "erheblich", "katastrophal"
- Betroffene KRITIS-Sektoren (BBK-Sektor-Keys: energie, wasser, ernaehrung, gesundheit, transport, it_telekom, finanz, staat, medien, wasserbau, militaer)
- Zusammenfassende Risikoeinschätzung (2-3 Sätze)

### 2. Prävention
- Vorbereitungsmaßnahmen (5-8 konkrete Punkte)
- Frühwarnmaßnahmen (3-5 konkrete Punkte)
- Schulungen/Übungen (3-5 konkrete Punkte)
- Materialvorhaltung (3-5 konkrete Punkte)

### 3. Kommunikationsplan
- Interne Kommunikation: Sofort-Meldungen (3-5) + laufende Kommunikation (3-5)
- Externe Kommunikation: Bevölkerung (3-5), Medien (2-4), Behörden (2-4)
- Kommunikationskanäle (z.B. NINA, Lautsprecherdurchsagen, Social Media, Website)
- Sprachregelungen (3-5 vorformulierte Kernaussagen)

### 4. Wenn-Dann-Szenarien
- 4-6 konkrete Trigger-Aktion-Paare mit Eskalationsstufe
- Jeder Trigger: klare Bedingung
- Jede Aktion: 2-4 konkrete Maßnahmen
- Eskalation: Was passiert, wenn die Maßnahmen nicht greifen

### 5. Verantwortlichkeiten (Krisenstab nach S1–S6)
Erstelle für JEDE der folgenden Funktionen einen Eintrag:
- S1 – Personal
- S2 – Lage
- S3 – Einsatz
- S4 – Versorgung
- S5 – Presse- und Medienarbeit
- S6 – Information und Kommunikation
Jeweils mit 4-6 konkreten Aufgaben. Ordne wenn möglich eine passende Kontaktgruppe zu (aus: ${kontaktGruppen}).

### 6. Handlungsplan (Phasen)
Erstelle 4-6 zeitlich geordnete Einsatzphasen mit konkreten Aufgaben:
- Jede Phase: Name, Dauer (z.B. "0-2h", "2-6h", "6-24h"), 3-6 konkrete Aufgaben
- Zeitliche Reihenfolge: Sofortmaßnahmen → Erstreaktion → Krisenbewältigung → Stabilisierung → Nachsorge
- Phasen sollen den gesamten Krisenverlauf abdecken

### 7. Szenario-spezifisches Inventar
Erstelle eine szenario-spezifische Inventar-Empfehlung:
- 8-15 Materialkategorien, die speziell für dieses Szenario benötigt werden
- Empfohlene Mengen basierend auf Bevölkerungszahl, Schweregrad und Szenario-Typ
- Einheiten: "Stück", "kg", "Liter", "Paletten", "Karton", oder "Satz"
- Kurze Begründung (1 Satz) warum diese Menge für dieses Szenario nötig ist
- Berücksichtige das bestehende Inventar und dessen Lücken
- Orientiere dich an BBK-Richtwerten und dem konkreten Risikoprofil

Antworte AUSSCHLIESSLICH im folgenden JSON-Format (kein Markdown, kein Text drumherum):
{
  "risikobewertung": {
    "bedrohungsanalyse": "<string>",
    "eintrittswahrscheinlichkeit": "<niedrig|mittel|hoch|sehr_hoch>",
    "schadensausmass": "<gering|mittel|erheblich|katastrophal>",
    "betroffene_sektoren": ["<sektor_key>", ...],
    "risikoeinschaetzung": "<string>"
  },
  "praevention": {
    "vorbereitung": ["...", ...],
    "fruehwarnung": ["...", ...],
    "schulungen": ["...", ...],
    "materialvorhaltung": ["...", ...]
  },
  "kommunikationsplan": {
    "intern": { "sofort": ["...", ...], "laufend": ["...", ...] },
    "extern": { "bevoelkerung": ["...", ...], "medien": ["...", ...], "behoerden": ["...", ...] },
    "kanaele": ["...", ...],
    "sprachregelungen": ["...", ...]
  },
  "wennDannSzenarien": [
    { "trigger": "<string>", "massnahmen": ["...", ...], "eskalation": "<string>" }
  ],
  "verantwortlichkeiten": [
    { "funktion": "S1 – Personal", "aufgaben": ["...", ...], "kontaktgruppe": "<optional>" }
  ],
  "inventar": [
    { "kategorie": "<Name>", "empfohlene_menge": <number>, "einheit": "<Stück|kg|Liter|Paletten|Karton|Satz>", "begruendung": "<1 Satz>" }
  ],
  "phasen": [
    { "name": "<string>", "dauer": "<string>", "aufgaben": ["...", ...] }
  ]
}`
}

// ─── Auto-Checklisten generieren ──────────────────────
// deno-lint-ignore no-explicit-any
async function generateAutoChecklists(supabase: any, scenarioId: string, districtId: string, scenario: any, handbook: AIHandbookResponse) {
  try {
    // 1. Bestehende auto-generierte Checklisten für dieses Szenario löschen
    await supabase
      .from('checklists')
      .delete()
      .eq('scenario_id', scenarioId)
      .eq('district_id', districtId)
      .like('description', '%Automatisch generiert%')

    const checklistsToInsert = []

    // 2. Prävention-Checkliste
    const praeventionItems: string[] = [
      ...(handbook.praevention.vorbereitung || []),
      ...(handbook.praevention.fruehwarnung || []),
      ...(handbook.praevention.schulungen || []),
      ...(handbook.praevention.materialvorhaltung || []),
    ].filter(s => s.trim())

    if (praeventionItems.length > 0) {
      checklistsToInsert.push({
        district_id: districtId,
        scenario_id: scenarioId,
        title: `Prävention: ${scenario.title}`,
        description: 'Automatisch generierte Präventions-Checkliste aus dem KI-Krisenhandbuch.',
        category: 'sofortmassnahmen',
        is_template: false,
        items: praeventionItems.map(text => ({
          id: crypto.randomUUID(),
          text,
          status: 'open',
          completed_at: null,
          completed_by: null,
        })),
      })
    }

    // 3. Krisenstab-Aufgaben-Checkliste
    const krisenstabItems: string[] = []
    for (const rolle of (handbook.verantwortlichkeiten || [])) {
      const prefix = rolle.funktion.substring(0, 2).toUpperCase()
      for (const aufgabe of (rolle.aufgaben || [])) {
        krisenstabItems.push(`[${prefix}] ${aufgabe}`)
      }
    }

    if (krisenstabItems.length > 0) {
      checklistsToInsert.push({
        district_id: districtId,
        scenario_id: scenarioId,
        title: `Krisenstab-Aufgaben: ${scenario.title}`,
        description: 'Automatisch generierte Krisenstab-Checkliste aus dem KI-Krisenhandbuch (S1–S6).',
        category: 'krisenstab',
        is_template: false,
        items: krisenstabItems.map(text => ({
          id: crypto.randomUUID(),
          text,
          status: 'open',
          completed_at: null,
          completed_by: null,
        })),
      })
    }

    // 4. Kommunikation-Checkliste
    const kommunikationItems: string[] = []
    const k = handbook.kommunikationsplan
    if (k) {
      for (const s of (k.intern?.sofort || [])) kommunikationItems.push(`[Sofort] ${s}`)
      for (const s of (k.intern?.laufend || [])) kommunikationItems.push(`[Laufend] ${s}`)
      for (const s of (k.extern?.bevoelkerung || [])) kommunikationItems.push(`[Bevölkerung] ${s}`)
      for (const s of (k.extern?.medien || [])) kommunikationItems.push(`[Medien] ${s}`)
      for (const s of (k.extern?.behoerden || [])) kommunikationItems.push(`[Behörden] ${s}`)
    }

    if (kommunikationItems.length > 0) {
      checklistsToInsert.push({
        district_id: districtId,
        scenario_id: scenarioId,
        title: `Kommunikation: ${scenario.title}`,
        description: 'Automatisch generierte Kommunikations-Checkliste aus dem KI-Krisenhandbuch.',
        category: 'kommunikation',
        is_template: false,
        items: kommunikationItems.map(text => ({
          id: crypto.randomUUID(),
          text,
          status: 'open',
          completed_at: null,
          completed_by: null,
        })),
      })
    }

    // 5. Alle auf einmal inserieren
    if (checklistsToInsert.length > 0) {
      const { error } = await supabase.from('checklists').insert(checklistsToInsert)
      if (error) {
        console.error('Auto-Checklisten Insert-Fehler:', error)
      } else {
        console.log(`${checklistsToInsert.length} Auto-Checklisten erstellt für "${scenario.title}"`)
      }
    }
  } catch (err) {
    // Non-blocking: Fehler loggen, aber nicht die Hauptantwort beeinflussen
    console.error('Auto-Checklisten Fehler (non-blocking):', err)
  }
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
            // Text aus dem Dokument extrahieren (max 8000 Zeichen)
            const text = await fileData.text()
            documentText = text.substring(0, 8000)
            console.log(`Dokument geladen: ${doc.name} (${documentText.length} Zeichen)`)

            // Dokument als verarbeitet markieren
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

    console.log(`KI-Handbuch generieren für Szenario "${scenario.title}" (District: ${district.name})${documentId ? ' [mit Dokument-Kontext]' : ''}`)

    // 12. Langdock API aufrufen (mehr Tokens für umfangreiches Handbuch)
    const aiResponse = await callLangdock(
      [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: documentText
            ? `Ergänze und strukturiere den bestehenden Handlungsplan zu einem vollständigen Krisenmanagement-Handbuch für das Szenario "${scenario.title}" im Landkreis ${district.name} als JSON.`
            : `Erstelle jetzt das vollständige Krisenmanagement-Handbuch für das Szenario "${scenario.title}" im Landkreis ${district.name} als JSON.`,
        },
      ],
      { max_tokens: 10240 }
    )

    // 13. JSON parsen
    const handbook: AIHandbookResponse = JSON.parse(aiResponse)

    // 14. Soft-Default für optionale Sektionen
    if (!handbook.inventar) {
      handbook.inventar = []
    }

    // 14b. Validieren
    if (!handbook.risikobewertung || !handbook.praevention || !handbook.kommunikationsplan || !handbook.verantwortlichkeiten || !handbook.phasen) {
      throw new Error('KI-Antwort hat ein ungültiges Format. Nicht alle Abschnitte vorhanden.')
    }

    // 15. Handbook mit Timestamp speichern
    const handbookWithTimestamp = {
      ...handbook,
      generated_at: new Date().toISOString(),
    }

    const { data: updatedScenario, error: updateError } = await supabase
      .from('scenarios')
      .update({
        handbook: handbookWithTimestamp,
        is_handbook_generated: true,
      })
      .eq('id', scenarioId)
      .select()
      .single()

    if (updateError) {
      console.error('Handbook update error:', updateError)
      throw new Error('Fehler beim Speichern des Handbuchs.')
    }

    console.log(`KI-Handbuch erstellt für "${scenario.title}" – ${handbook.verantwortlichkeiten.length} Rollen, ${handbook.wennDannSzenarien?.length || 0} Wenn-Dann-Szenarien, ${handbook.phasen?.length || 0} Phasen`)

    // 16. Phasen: bestehende löschen + neue aus KI einfügen
    try {
      await supabase.from('scenario_phases').delete().eq('scenario_id', scenarioId)

      if (handbook.phasen?.length > 0) {
        const phaseInserts = handbook.phasen.map((p, i) => ({
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

    // 17. Auto-Checklisten generieren (non-blocking)
    await generateAutoChecklists(supabase, scenarioId, district.id, scenario, handbook)

    // 18. Ergebnis zurückgeben
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

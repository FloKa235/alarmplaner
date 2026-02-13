import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser, getServiceClient } from '../_shared/auth.ts'
import { callLangdock } from '../_shared/langdock.ts'

// ─── Response-Typ von der KI ──────────────────────────
interface AIScenarioResponse {
  szenario: {
    titel: string
    typ: string
    schweregrad: number
    beschreibung: string
    betroffeneEinwohner: number
  }
  phasen: Array<{
    name: string
    sortOrder: number
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
  riskProfile: any | null,
  // deno-lint-ignore no-explicit-any
  riskEntries: any[],
  scenarioType?: string
): string {
  const gemeindenList = municipalities
    .map(
      (m) =>
        `- ${m.name}: ${m.population} Einwohner, Risikostufe: ${m.risk_level || 'k.A.'} (${m.risk_score || 0}/100)`
    )
    .join('\n')

  const kritisList = kritisSites
    .map(
      (k) =>
        `- ${k.name} (${k.category}), Risikoexposition: ${k.risk_exposure || 'k.A.'}, Adresse: ${k.address || 'k.A.'}`
    )
    .join('\n')

  let riskSection = 'Keine aktuelle Risikoanalyse vorhanden.'
  if (riskProfile) {
    const entriesList = riskEntries
      .map(
        (e) =>
          `- ${e.type}: ${e.score}/100 (${e.level}), Trend: ${e.trend}`
      )
      .join('\n')
    riskSection = `Gesamtrisiko: ${riskProfile.risk_score}/100 (${riskProfile.risk_level})
${entriesList}`
  }

  const typeInstruction = scenarioType
    ? `Erstelle ein Szenario vom Typ: ${scenarioType}`
    : 'Wähle den Szenario-Typ basierend auf dem höchsten aktuellen Risiko.'

  return `Du bist ein KI-Experte für Katastrophenschutz und Krisenszenario-Planung in Deutschland.
Du arbeitest für den Alarmplaner – ein Krisenmanagement-System für deutsche Landkreise.

Deine Aufgabe: Erstelle ein detailliertes, realistisches Krisenszenario für den folgenden Landkreis.

## Landkreis-Daten
- Name: ${district.name}
- Bundesland: ${district.state}
- Einwohner: ${district.population}
- Fläche: ${district.area_km2} km²

## Gemeinden (${municipalities.length})
${gemeindenList || '- Keine Gemeinden vorhanden'}

## Kritische Infrastruktur (${kritisSites.length} Objekte)
${kritisList || '- Keine KRITIS-Objekte vorhanden'}

## Aktuelle Risikobewertung
${riskSection}

## Szenario-Anweisungen
${typeInstruction}

Das Szenario muss:
1. Realistisch und spezifisch für diesen Landkreis sein
2. Konkrete Gemeinden und KRITIS-Objekte namentlich benennen
3. Einen detaillierten Handlungsplan mit 3-5 Phasen enthalten
4. Jede Phase mit konkreten, umsetzbaren Aufgaben versehen (4-8 Aufgaben pro Phase)
5. Zeitliche Abfolge berücksichtigen (Vorwarnung → Akutphase → Nachsorge)
6. Betroffene Bevölkerungszahl realistisch schätzen

Antworte AUSSCHLIESSLICH im folgenden JSON-Format (kein Markdown, kein Text drumherum):
{
  "szenario": {
    "titel": "<Prägnanter Titel, z.B. 'Hochwasser Bode – Stufe 3'>",
    "typ": "<Hochwasser|Sturm|Waldbrand|Stromausfall|Extremhitze|Pandemie|CBRN|Cyberangriff>",
    "schweregrad": <number 0-100>,
    "beschreibung": "<3-5 Sätze, spezifisch für diesen Landkreis mit konkreten Orten>",
    "betroffeneEinwohner": <number>
  },
  "phasen": [
    {
      "name": "<z.B. Phase 1: Vorwarnung>",
      "sortOrder": <0, 1, 2, ...>,
      "dauer": "<z.B. 0-6 Stunden>",
      "aufgaben": ["<Aufgabe 1>", "<Aufgabe 2>", "..."]
    }
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
    const { districtId, scenarioType } = await req.json()
    if (!districtId) {
      throw new Error('districtId ist erforderlich.')
    }

    // 3. Service-Client
    const supabase = getServiceClient()

    // 4. District laden + User-Berechtigung prüfen
    const { data: district, error: districtError } = await supabase
      .from('districts')
      .select('*')
      .eq('id', districtId)
      .eq('user_id', user.id)
      .single()

    if (districtError || !district) {
      throw new Error('Landkreis nicht gefunden oder keine Berechtigung.')
    }

    // 5. Gemeinden laden
    const { data: municipalities } = await supabase
      .from('municipalities')
      .select('*')
      .eq('district_id', districtId)
      .order('name')

    // 6. KRITIS-Objekte laden
    const { data: kritisSites } = await supabase
      .from('kritis_sites')
      .select('*')
      .eq('district_id', districtId)
      .order('name')

    // 7. Aktuelles Risikoprofil laden
    const { data: riskProfile } = await supabase
      .from('risk_profiles')
      .select('*')
      .eq('district_id', districtId)
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

    // 8. System-Prompt bauen
    const systemPrompt = buildSystemPrompt(
      district,
      municipalities ?? [],
      kritisSites ?? [],
      riskProfile,
      riskEntries,
      scenarioType
    )

    // 9. Langdock API aufrufen
    const typeHint = scenarioType || 'automatisch (höchstes Risiko)'
    console.log(
      `KI-Szenario generieren für District "${district.name}" – Typ: ${typeHint}`
    )

    const userMessage = scenarioType
      ? `Erstelle jetzt ein ${scenarioType}-Szenario für den Landkreis ${district.name} als JSON.`
      : `Erstelle jetzt ein Krisenszenario für den Landkreis ${district.name} basierend auf dem höchsten Risiko als JSON.`

    const aiResponse = await callLangdock(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      { max_tokens: 4096 }
    )

    // 10. JSON parsen
    const result: AIScenarioResponse = JSON.parse(aiResponse)

    // 11. Validieren
    if (!result.szenario || !Array.isArray(result.phasen)) {
      throw new Error('KI-Antwort hat ein ungültiges Format.')
    }

    // 12. Szenario einfügen
    const { data: newScenario, error: scenarioError } = await supabase
      .from('scenarios')
      .insert({
        district_id: districtId,
        title: result.szenario.titel,
        type: result.szenario.typ,
        severity: Math.min(100, Math.max(0, result.szenario.schweregrad)),
        description: result.szenario.beschreibung,
        affected_population: result.szenario.betroffeneEinwohner,
        is_ai_generated: true,
        is_edited: false,
      })
      .select()
      .single()

    if (scenarioError || !newScenario) {
      console.error('Scenario insert error:', scenarioError)
      throw new Error('Fehler beim Speichern des Szenarios.')
    }

    // 13. Phasen einfügen
    const phases = result.phasen.map((p) => ({
      scenario_id: newScenario.id,
      sort_order: p.sortOrder,
      name: p.name,
      duration: p.dauer,
      tasks: p.aufgaben,
    }))

    const { data: newPhases, error: phasesError } = await supabase
      .from('scenario_phases')
      .insert(phases)
      .select()

    if (phasesError) {
      console.error('Phases insert error:', phasesError)
    }

    console.log(
      `KI-Szenario erstellt: "${newScenario.title}" (Schweregrad: ${newScenario.severity}/100)`
    )

    // 14. Ergebnis zurückgeben
    return new Response(
      JSON.stringify({
        success: true,
        scenario: newScenario,
        phases: newPhases ?? [],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('ai-generate-scenario error:', error)
    // WICHTIG: Immer Status 200 zurückgeben, damit supabase.functions.invoke()
    // den Body korrekt parsed. Fehler werden über success: false kommuniziert.
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unbekannter Fehler bei der Szenario-Generierung.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})

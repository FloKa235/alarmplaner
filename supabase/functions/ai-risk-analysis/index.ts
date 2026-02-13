import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser, getServiceClient } from '../_shared/auth.ts'
import { callLangdock } from '../_shared/langdock.ts'

// ─── Response-Typ von der KI ──────────────────────────
interface AIRiskAnalysisResponse {
  gesamtrisiko: {
    score: number
    level: string
    zusammenfassung: string
  }
  risiken: Array<{
    type: string
    score: number
    level: string
    trend: string
    beschreibung: string
  }>
  gemeindeRisiken?: Array<{
    name: string
    riskScore: number
    riskLevel: string
  }>
}

// ─── Prompt-Builder ───────────────────────────────────
function buildSystemPrompt(
  // deno-lint-ignore no-explicit-any
  district: any,
  // deno-lint-ignore no-explicit-any
  municipalities: any[],
  // deno-lint-ignore no-explicit-any
  kritisSites: any[]
): string {
  const currentMonth = new Date().toLocaleString('de-DE', {
    month: 'long',
    year: 'numeric',
  })

  const gemeindenList = municipalities
    .map(
      (m) =>
        `- ${m.name}: ${m.population} Einwohner, ${m.area_km2} km², Koordinaten: ${m.latitude}, ${m.longitude}`
    )
    .join('\n')

  const kritisList = kritisSites
    .map(
      (k) =>
        `- ${k.name} (${k.category}), Adresse: ${k.address || 'k.A.'}, Risikoexposition: ${k.risk_exposure || 'k.A.'}`
    )
    .join('\n')

  return `Du bist ein KI-Experte für Katastrophenschutz und Risikoanalyse in Deutschland.
Du arbeitest für den Alarmplaner – ein Krisenmanagement-System für deutsche Landkreise.

Deine Aufgabe: Erstelle eine umfassende Risikoanalyse für den folgenden Landkreis.

## Landkreis-Daten
- Name: ${district.name}
- Bundesland: ${district.state}
- Einwohner: ${district.population}
- Fläche: ${district.area_km2} km²
- Koordinaten: ${district.latitude}, ${district.longitude}

## Gemeinden (${municipalities.length})
${gemeindenList || '- Keine Gemeinden vorhanden'}

## Kritische Infrastruktur (${kritisSites.length} Objekte)
${kritisList || '- Keine KRITIS-Objekte vorhanden'}

## Analyse-Anweisungen
Bewerte folgende Risikokategorien für diesen Landkreis:
1. Hochwasser
2. Sturm/Orkan
3. Waldbrand
4. Stromausfall
5. Extremhitze
6. Pandemie
7. CBRN (chemisch, biologisch, radiologisch, nuklear)
8. Cyberangriff

Berücksichtige dabei:
- Geographische Lage und Topographie des Landkreises
- Bevölkerungsdichte und -verteilung
- Art und Verteilung der kritischen Infrastruktur
- Typische Risiken für das Bundesland ${district.state}
- Saisonale Faktoren (aktueller Monat: ${currentMonth})

Antworte AUSSCHLIESSLICH im folgenden JSON-Format (kein Markdown, kein Text drumherum):
{
  "gesamtrisiko": {
    "score": <number 0-100>,
    "level": "<niedrig|mittel|erhöht|hoch|extrem>",
    "zusammenfassung": "<2-3 Sätze Gesamtbewertung>"
  },
  "risiken": [
    {
      "type": "<Risikokategorie>",
      "score": <number 0-100>,
      "level": "<niedrig|mittel|erhöht|hoch|extrem>",
      "trend": "<z.B. +5, -3, 0>",
      "beschreibung": "<1-2 Sätze spezifisch für diesen Landkreis>"
    }
  ],
  "gemeindeRisiken": [
    {
      "name": "<Gemeindename exakt wie oben>",
      "riskScore": <number 0-100>,
      "riskLevel": "<niedrig|mittel|erhöht|hoch|extrem>"
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
    const { districtId } = await req.json()
    if (!districtId) {
      throw new Error('districtId ist erforderlich.')
    }

    // 3. Service-Client (bypassed RLS)
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

    // 7. System-Prompt bauen
    const systemPrompt = buildSystemPrompt(
      district,
      municipalities ?? [],
      kritisSites ?? []
    )

    // 8. Langdock API aufrufen
    console.log(
      `KI-Risikoanalyse starten für District "${district.name}" (${districtId})`
    )

    const aiResponse = await callLangdock([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Erstelle jetzt die Risikoanalyse für den Landkreis ${district.name} als JSON.`,
      },
    ])

    // 9. JSON parsen
    const analysis: AIRiskAnalysisResponse = JSON.parse(aiResponse)

    // 10. Validieren
    if (!analysis.gesamtrisiko || !Array.isArray(analysis.risiken)) {
      throw new Error('KI-Antwort hat ein ungültiges Format.')
    }

    // 11. Alte Risk Profiles löschen
    const { data: oldProfiles } = await supabase
      .from('risk_profiles')
      .select('id')
      .eq('district_id', districtId)

    if (oldProfiles && oldProfiles.length > 0) {
      const oldIds = oldProfiles.map((p: { id: string }) => p.id)
      await supabase.from('risk_entries').delete().in('risk_profile_id', oldIds)
      await supabase
        .from('risk_profiles')
        .delete()
        .eq('district_id', districtId)
    }

    // 12. Neues Risk Profile einfügen
    const { data: newProfile, error: profileError } = await supabase
      .from('risk_profiles')
      .insert({
        district_id: districtId,
        risk_score: Math.min(100, Math.max(0, analysis.gesamtrisiko.score)),
        risk_level: analysis.gesamtrisiko.level,
      })
      .select()
      .single()

    if (profileError || !newProfile) {
      console.error('Profile insert error:', profileError)
      throw new Error('Fehler beim Speichern des Risikoprofils.')
    }

    // 13. Risk Entries einfügen
    const entries = analysis.risiken.map((r) => ({
      risk_profile_id: newProfile.id,
      type: r.type,
      score: Math.min(100, Math.max(0, r.score)),
      level: r.level,
      trend: r.trend,
      description: r.beschreibung,
    }))

    const { error: entriesError } = await supabase
      .from('risk_entries')
      .insert(entries)

    if (entriesError) {
      console.error('Entries insert error:', entriesError)
    }

    // 14. Gemeinde-Risiken updaten (falls vorhanden)
    if (analysis.gemeindeRisiken && municipalities) {
      for (const gr of analysis.gemeindeRisiken) {
        const match = (municipalities as { id: string; name: string }[]).find(
          (m) => m.name.toLowerCase() === gr.name.toLowerCase()
        )
        if (match) {
          await supabase
            .from('municipalities')
            .update({
              risk_score: Math.min(100, Math.max(0, gr.riskScore)),
              risk_level: gr.riskLevel,
            })
            .eq('id', match.id)
        }
      }
    }

    // 15. Ergebnis laden und zurückgeben
    const { data: riskEntries } = await supabase
      .from('risk_entries')
      .select('*')
      .eq('risk_profile_id', newProfile.id)
      .order('score', { ascending: false })

    console.log(
      `KI-Risikoanalyse abgeschlossen: Score ${newProfile.risk_score}/100 (${newProfile.risk_level})`
    )

    return new Response(
      JSON.stringify({
        success: true,
        profile: newProfile,
        entries: riskEntries,
        zusammenfassung: analysis.gesamtrisiko.zusammenfassung,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('ai-risk-analysis error:', error)
    // WICHTIG: Immer Status 200 zurückgeben, damit supabase.functions.invoke()
    // den Body korrekt parsed. Fehler werden über success: false kommuniziert.
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unbekannter Fehler bei der Risikoanalyse.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})

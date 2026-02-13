import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser, getServiceClient } from '../_shared/auth.ts'
import { callLangdock } from '../_shared/langdock.ts'

// ─── Response-Typ von der KI ──────────────────────────
interface AIInventoryResponse {
  empfehlungen: Array<{
    kategorie: string
    empfohlene_menge: number
    einheit: string
    begruendung: string
  }>
}

// ─── Prompt-Builder ───────────────────────────────────
function buildSystemPrompt(
  // deno-lint-ignore no-explicit-any
  district: any,
  // deno-lint-ignore no-explicit-any
  municipalities: any[],
  // deno-lint-ignore no-explicit-any
  inventory: any[],
  // deno-lint-ignore no-explicit-any
  riskProfile: any | null,
  // deno-lint-ignore no-explicit-any
  riskEntries: any[]
): string {
  const inventarList = inventory
    .map(
      (i) =>
        `- ${i.category}: Ist ${i.current_quantity} / Soll ${i.target_quantity} ${i.unit} (Standort: ${i.location || 'k.A.'})`
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

  return `Du bist ein KI-Experte für Katastrophenschutz-Logistik und Bedarfsplanung in Deutschland.
Du arbeitest für den Alarmplaner – ein Krisenmanagement-System für deutsche Landkreise.

Deine Aufgabe: Empfehle optimale Soll-Mengen für das Katastrophenschutz-Inventar basierend auf dem Risikoprofil und der Bevölkerung.

## Landkreis-Daten
- Name: ${district.name}
- Bundesland: ${district.state}
- Einwohner: ${district.population}
- Fläche: ${district.area_km2} km²
- Gemeinden: ${municipalities.length}
- Gesamtbevölkerung Gemeinden: ${municipalities.reduce((s: number, m: { population: number }) => s + m.population, 0)}

## Aktuelle Risikobewertung
${riskSection}

## Aktuelles Inventar (${inventory.length} Positionen)
${inventarList || '- Kein Inventar vorhanden'}

## Anweisungen
1. Überprüfe JEDE bestehende Kategorie und empfehle eine optimierte Soll-Menge
2. Füge FEHLENDE kritische Kategorien hinzu (z.B. wenn Sandsäcke fehlen bei Hochwasserrisiko)
3. Berücksichtige die spezifischen Risiken des Landkreises
4. Orientiere dich an BBK-Empfehlungen und Bevölkerungszahl
5. Begründe jede Empfehlung kurz (1 Satz)

Typische Kategorien für Katastrophenschutz-Inventar:
- Sandsäcke (Stück), Feldbetten (Stück), Trinkwasser (Liter), Decken (Stück)
- Lebensmittelrationen (Karton), Erste-Hilfe-Sets (Satz), Stromgeneratoren (Stück)
- Kraftstoff-Reserve (Liter), Pumpen (Stück), Zelte (Stück)

Antworte AUSSCHLIESSLICH im folgenden JSON-Format:
{
  "empfehlungen": [
    {
      "kategorie": "<Name der Kategorie>",
      "empfohlene_menge": <number>,
      "einheit": "<Stück|kg|Liter|Paletten|Karton|Satz>",
      "begruendung": "<1 Satz Begründung>"
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

    // 6. Aktuelles Inventar laden
    const { data: inventory } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('district_id', districtId)
      .order('category')

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
      inventory ?? [],
      riskProfile,
      riskEntries
    )

    // 9. Langdock API aufrufen
    console.log(`KI-Inventarempfehlung für District "${district.name}"`)

    const aiResponse = await callLangdock(
      [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Erstelle jetzt Inventar-Empfehlungen für den Landkreis ${district.name} als JSON.`,
        },
      ],
      { max_tokens: 4096 }
    )

    // 10. JSON parsen
    const result: AIInventoryResponse = JSON.parse(aiResponse)

    if (!Array.isArray(result.empfehlungen)) {
      throw new Error('KI-Antwort hat ein ungültiges Format.')
    }

    // 11. Inventar aktualisieren / neue Einträge hinzufügen
    let updatedCount = 0
    let createdCount = 0

    for (const emp of result.empfehlungen) {
      // Prüfen ob Kategorie schon existiert
      const existing = (inventory ?? []).find(
        (i: { category: string }) =>
          i.category.toLowerCase() === emp.kategorie.toLowerCase()
      )

      if (existing) {
        // Update target_quantity
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({ target_quantity: emp.empfohlene_menge })
          .eq('id', existing.id)

        if (!updateError) updatedCount++
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('inventory_items')
          .insert({
            district_id: districtId,
            category: emp.kategorie,
            unit: emp.einheit,
            target_quantity: emp.empfohlene_menge,
            current_quantity: 0,
          })

        if (!insertError) createdCount++
      }
    }

    console.log(
      `KI-Inventar: ${updatedCount} aktualisiert, ${createdCount} neu erstellt`
    )

    // 12. Ergebnis zurückgeben
    return new Response(
      JSON.stringify({
        success: true,
        empfehlungen: result.empfehlungen,
        updatedCount,
        createdCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('ai-inventory-recommendation error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unbekannter Fehler bei der Inventar-Empfehlung.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})

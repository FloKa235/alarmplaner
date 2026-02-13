import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser, getServiceClient } from '../_shared/auth.ts'
import { callLangdock } from '../_shared/langdock.ts'

// ─── Response-Typ von der KI ──────────────────────────
interface AIAlertMessageResponse {
  nachricht: string
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
    const { districtId, scenarioId, level, targetGroups } = await req.json()
    if (!districtId) {
      throw new Error('districtId ist erforderlich.')
    }
    if (!level) {
      throw new Error('level ist erforderlich.')
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

    // 5. Szenario laden (optional)
    let scenarioInfo = ''
    if (scenarioId) {
      const { data: scenario } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single()

      if (scenario) {
        scenarioInfo = `
## Zugehöriges Szenario
- Titel: ${scenario.title}
- Typ: ${scenario.type}
- Schweregrad: ${scenario.severity}/100
- Beschreibung: ${scenario.description || 'k.A.'}
- Betroffene Bevölkerung: ${scenario.affected_population || 'k.A.'}`
      }
    }

    // 6. Prompt bauen
    const levelLabels: Record<number, string> = {
      1: 'Stufe 1 – Vorwarnung',
      2: 'Stufe 2 – Akutphase',
      3: 'Stufe 3 – Katastrophenfall',
    }

    const systemPrompt = `Du bist ein KI-Assistent für Alarmierungsnachrichten im deutschen Katastrophenschutz (BOS-Deutsch).
Du formulierst prägnante, klare und professionelle Alarmnachrichten für Einsatzkräfte.

## Landkreis
- Name: ${district.name}
- Bundesland: ${district.state}
- Einwohner: ${district.population}

## Alarm-Parameter
- Alarmstufe: ${levelLabels[level as number] || `Stufe ${level}`}
- Zielgruppen: ${(targetGroups as string[] || []).join(', ') || 'Alle Einsatzkräfte'}
${scenarioInfo}

## Anforderungen an die Nachricht
1. Maximal 5-8 Sätze
2. BOS-Deutsch (Funksprache-Stil, klar und knapp)
3. Enthalten: Was ist passiert? Wo? Was ist zu tun? Wo sammeln?
4. Alarmstufe und Dringlichkeit klar kommunizieren
5. Wenn ein Szenario angegeben ist, darauf Bezug nehmen
6. Konkrete Handlungsanweisungen

Antworte AUSSCHLIESSLICH im folgenden JSON-Format:
{
  "nachricht": "<Die vollständige Alarmnachricht>"
}`

    // 7. Langdock API aufrufen
    console.log(`KI-Alarmnachricht für District "${district.name}" – Stufe ${level}`)

    const aiResponse = await callLangdock(
      [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Erstelle jetzt eine Alarmnachricht für Stufe ${level} im Landkreis ${district.name} als JSON.`,
        },
      ],
      { max_tokens: 1024 }
    )

    // 8. JSON parsen
    const result: AIAlertMessageResponse = JSON.parse(aiResponse)

    if (!result.nachricht) {
      throw new Error('KI-Antwort hat ein ungültiges Format.')
    }

    console.log(`KI-Alarmnachricht erstellt (${result.nachricht.length} Zeichen)`)

    // 9. Ergebnis zurückgeben
    return new Response(
      JSON.stringify({
        success: true,
        nachricht: result.nachricht,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('ai-alert-message error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unbekannter Fehler bei der Nachrichtengenerierung.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})

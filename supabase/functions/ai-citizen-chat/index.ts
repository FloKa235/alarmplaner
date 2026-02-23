import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser } from '../_shared/auth.ts'

// ─── Types ──────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  message: string
  history: ChatMessage[]
  context: {
    householdAdults?: number
    householdChildren?: number
    householdPets?: number
    locationName?: string
    bundesland?: string
    vorsorgeScore?: number
    warningsSummary?: string
    inventorySummary?: string
  }
}

// ─── Main Handler ───────────────────────────────────────

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth check — only logged-in users
    await getAuthenticatedUser(req)

    const body: ChatRequest = await req.json()
    const { message, history = [], context = {} } = body

    if (!message || typeof message !== 'string' || !message.trim()) {
      return new Response(
        JSON.stringify({ error: 'Bitte gib eine Nachricht ein.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build system prompt with user context
    const systemPrompt = buildSystemPrompt(context)

    // Build messages array
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.slice(-8).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message.trim() },
    ]

    // Call Langdock (OpenAI-compatible, EU-hosted)
    const apiKey = Deno.env.get('LANGDOCK_API_KEY')
    if (!apiKey) {
      throw new Error('LANGDOCK_API_KEY nicht konfiguriert.')
    }

    const response = await fetch(
      'https://api.langdock.com/openai/eu/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          temperature: 0.7,
          max_tokens: 1024,
          messages,
          // No JSON response_format — we want natural text
        }),
      }
    )

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Langdock API Error:', response.status, errorBody)
      throw new Error(`KI-Dienst nicht verfügbar (Status ${response.status}).`)
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content

    if (!reply) {
      throw new Error('Keine Antwort von der KI erhalten.')
    }

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    console.error('ai-citizen-chat error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ─── System Prompt Builder ──────────────────────────────

function buildSystemPrompt(context: ChatRequest['context']): string {
  const parts: string[] = []

  parts.push(`Du bist der Alarmplaner-Assistent, ein freundlicher KI-Berater für persönliche Krisenvorsorge.
Du antwortest auf Deutsch, praxisnah und motivierend.`)

  // User context
  const ctxLines: string[] = []

  if (context.householdAdults || context.householdChildren || context.householdPets) {
    const household: string[] = []
    if (context.householdAdults) household.push(`${context.householdAdults} Erwachsene`)
    if (context.householdChildren) household.push(`${context.householdChildren} Kinder`)
    if (context.householdPets) household.push(`${context.householdPets} Haustiere`)
    ctxLines.push(`Haushalt: ${household.join(', ')}`)
  }

  if (context.locationName) {
    ctxLines.push(`Standort: ${context.locationName}${context.bundesland ? ` (${context.bundesland})` : ''}`)
  }

  if (context.vorsorgeScore !== undefined) {
    ctxLines.push(`Vorsorge-Score: ${context.vorsorgeScore}/100`)
  }

  if (context.warningsSummary) {
    ctxLines.push(`Aktive Warnungen: ${context.warningsSummary}`)
  }

  if (context.inventorySummary) {
    ctxLines.push(`Inventar-Status: ${context.inventorySummary}`)
  }

  if (ctxLines.length > 0) {
    parts.push(`\nKONTEXT DES NUTZERS:\n${ctxLines.map(l => `- ${l}`).join('\n')}`)
  }

  parts.push(`
REGELN:
- Beantworte Fragen zur Krisenvorsorge basierend auf BBK-Empfehlungen (Bundesamt für Bevölkerungsschutz und Katastrophenhilfe)
- Beziehe dich auf den persönlichen Kontext des Nutzers, wenn vorhanden
- Empfehle konkrete, praktische nächste Schritte
- Bei medizinischen Notfällen: Sofort auf 112 verweisen
- Maximal 3-4 Absätze pro Antwort
- Sei ermutigend: Jeder Schritt zur Vorsorge zählt
- Verwende keine Markdown-Überschriften (#), nur Fließtext und Aufzählungen
- Nenne am Ende jeder Antwort einen konkreten Tipp als nächsten Schritt`)

  return parts.join('\n')
}

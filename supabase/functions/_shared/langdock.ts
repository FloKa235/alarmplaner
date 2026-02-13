interface LangdockMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface LangdockOptions {
  model?: string
  temperature?: number
  max_tokens?: number
}

/**
 * Ruft die Langdock API auf (OpenAI-kompatibel, EU-hosted).
 * Gibt den Content der Antwort als String zurück.
 */
export async function callLangdock(
  messages: LangdockMessage[],
  options: LangdockOptions = {}
): Promise<string> {
  const apiKey = Deno.env.get('LANGDOCK_API_KEY')
  if (!apiKey) {
    throw new Error(
      'LANGDOCK_API_KEY nicht konfiguriert. Bitte in Supabase Secrets setzen.'
    )
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
        model: options.model ?? 'gpt-4o',
        temperature: options.temperature ?? 0.3,
        max_tokens: options.max_tokens ?? 4096,
        messages,
        response_format: { type: 'json_object' },
      }),
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('Langdock API Fehler:', response.status, errorBody)
    throw new Error(
      `KI-Dienst nicht verfügbar (Status ${response.status}). Bitte später erneut versuchen.`
    )
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('Keine Antwort von der KI erhalten.')
  }

  return content
}

/**
 * NotfallAssistentPage — KI-Notfall-Assistent (Chat-Interface)
 *
 * Personalisierter Vorsorge-Berater mit Kontext:
 * - Haushalt-Infos, Standort, Vorsorge-Score
 * - Aktive Warnungen, Inventar-Status
 */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Send, Bot, User, Loader2, Sparkles, RotateCcw } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { supabase } from '@/lib/supabase'
import { useCitizenHousehold } from '@/hooks/useCitizenHousehold'
import { useCitizenLocation } from '@/hooks/useCitizenLocation'
import { useCitizenInventory } from '@/hooks/useCitizenInventory'
import { useVorsorgeScore } from '@/hooks/useVorsorgeScore'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import type { DbExternalWarning } from '@/types/database'

// ─── Types ──────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ─── Suggested Questions ────────────────────────────────

const SUGGESTED_QUESTIONS = [
  { emoji: '\u26A1', text: 'Was tun bei Stromausfall?' },
  { emoji: '\u{1F4A7}', text: 'Ist mein Wasservorrat ausreichend?' },
  { emoji: '\u{1F30A}', text: 'Wie bereite ich mich auf Hochwasser vor?' },
  { emoji: '\u{1F48A}', text: 'Was geh\u00F6rt in eine Hausapotheke?' },
]

// ─── Component ──────────────────────────────────────────

export default function NotfallAssistentPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ─── Context Data ───────────────────────────────────
  const { household } = useCitizenHousehold()
  const { location } = useCitizenLocation()
  const { stats } = useCitizenInventory()
  const { total: vorsorgeScore } = useVorsorgeScore()

  // Warnungen laden
  const { data: matchingDistricts } = useSupabaseQuery<{ id: string }>(
    (sb) => {
      if (!location?.districtAgs) return sb.from('districts').select('id').eq('id', '00000000-0000-0000-0000-000000000000')
      return sb.from('districts').select('id').eq('ags_code', location.districtAgs).limit(1)
    },
    [location?.districtAgs]
  )

  const districtId = matchingDistricts[0]?.id || null

  const { data: warnungen } = useSupabaseQuery<DbExternalWarning>(
    (sb) => {
      if (!districtId) return sb.from('external_warnings').select('*').eq('district_id', '00000000-0000-0000-0000-000000000000')
      return sb.from('external_warnings').select('*').eq('district_id', districtId).order('fetched_at', { ascending: false }).limit(5)
    },
    [districtId]
  )

  // Build context object for the edge function
  const chatContext = useMemo(() => ({
    householdAdults: household.household_persons,
    householdChildren: household.household_babies,
    householdPets: household.household_pets ? 1 : 0,
    locationName: location?.districtName,
    vorsorgeScore,
    warningsSummary: warnungen.length > 0
      ? warnungen.map(w => `${w.title} (${w.severity})`).join(', ')
      : 'Keine aktiven Warnungen',
    inventorySummary: `${stats.totalItems} Artikel, ${stats.expiredItems} abgelaufen, ${stats.progressPercent}% aufgef\u00FCllt`,
  }), [household, location, vorsorgeScore, warnungen, stats])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ─── Send Message ─────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return

    const userMessage: ChatMessage = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setError(null)
    setLoading(true)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-citizen-chat', {
        body: {
          message: text.trim(),
          history: messages.slice(-8),
          context: chatContext,
        },
      })

      if (fnError) throw fnError

      if (data?.error) {
        throw new Error(data.error)
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data?.reply || 'Entschuldigung, ich konnte keine Antwort generieren.',
      }

      setMessages([...newMessages, assistantMessage])
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Verbindungsfehler. Bitte versuche es erneut.'
      setError(errMsg)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [messages, loading, chatContext])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleReset = () => {
    setMessages([])
    setError(null)
    setInput('')
    inputRef.current?.focus()
  }

  // ─── Render ───────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        title="KI-Notfall-Assistent"
        description="Dein pers\u00F6nlicher Vorsorge-Berater \u2014 stelle Fragen rund um Krisenvorsorge."
        actions={
          messages.length > 0 ? (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-xl bg-surface-secondary px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary/80"
            >
              <RotateCcw className="h-4 w-4" />
              Neues Gespr\u00E4ch
            </button>
          ) : undefined
        }
      />

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-border bg-white">
        {messages.length === 0 ? (
          /* Empty State with Suggested Questions */
          <div className="flex h-full flex-col items-center justify-center p-6">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
              <Sparkles className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-text-primary">Wie kann ich dir helfen?</h3>
            <p className="mb-8 max-w-md text-center text-sm text-text-secondary">
              Ich kenne deinen Haushalt, Standort und Vorsorge-Status. Stelle mir Fragen zur Krisenvorsorge!
            </p>

            <div className="grid w-full max-w-lg gap-3 sm:grid-cols-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q.text}
                  onClick={() => sendMessage(q.text)}
                  className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 text-left text-sm font-medium text-text-primary transition-all hover:border-primary-300 hover:shadow-sm"
                >
                  <span className="text-xl">{q.emoji}</span>
                  {q.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message List */
          <div className="space-y-1 p-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 rounded-xl p-3 ${
                  msg.role === 'user'
                    ? 'ml-8 flex-row-reverse'
                    : 'mr-8'
                }`}
              >
                {/* Avatar */}
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary-100'
                    : 'bg-amber-100'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="h-4 w-4 text-primary-600" />
                  ) : (
                    <Bot className="h-4 w-4 text-amber-600" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`min-w-0 flex-1 rounded-xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface-secondary text-text-primary'
                }`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="mr-8 flex gap-3 rounded-xl p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <Bot className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-surface-secondary px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
                  <span className="text-sm text-text-muted">Denkt nach...</span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mx-3 rounded-xl bg-red-50 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Stelle eine Frage zur Krisenvorsorge..."
          rows={1}
          className="flex-1 resize-none rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </form>
    </div>
  )
}

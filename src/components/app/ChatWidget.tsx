/**
 * ChatWidget — KI-Notfall-Assistent als Floating Chat-Fenster
 *
 * Schwebt unten rechts, öffnet sich bei Klick.
 * Enthält die gesamte Chat-Logik aus NotfallAssistentPage.
 */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Send, Bot, User, Loader2, Sparkles, X, MessageCircle, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCitizenHousehold } from '@/hooks/useCitizenHousehold'
import { useCitizenLocation } from '@/hooks/useCitizenLocation'
import { useCitizenInventory } from '@/hooks/useCitizenInventory'
import { useVorsorgeScore } from '@/hooks/useVorsorgeScore'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import type { DbExternalWarning } from '@/types/database'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_QUESTIONS = [
  { emoji: '\u26A1', text: 'Was tun bei Stromausfall?' },
  { emoji: '\u{1F4A7}', text: 'Ist mein Wasservorrat ausreichend?' },
  { emoji: '\u{1F30A}', text: 'Wie bereite ich mich auf Hochwasser vor?' },
  { emoji: '\u{1F48A}', text: 'Was gehört in eine Hausapotheke?' },
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
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

  const chatContext = useMemo(() => ({
    householdAdults: household.household_persons,
    householdChildren: household.household_babies,
    householdPets: household.household_pets ? 1 : 0,
    locationName: location?.districtName,
    vorsorgeScore,
    warningsSummary: warnungen.length > 0
      ? warnungen.map(w => `${w.title} (${w.severity})`).join(', ')
      : 'Keine aktiven Warnungen',
    inventorySummary: `${stats.totalItems} Artikel, ${stats.expiredItems} abgelaufen, ${stats.progressPercent}% aufgefüllt`,
  }), [household, location, vorsorgeScore, warnungen, stats])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

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
      if (data?.error) throw new Error(data.error)

      setMessages([...newMessages, {
        role: 'assistant',
        content: data?.reply || 'Entschuldigung, ich konnte keine Antwort generieren.',
      }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verbindungsfehler. Bitte versuche es erneut.')
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
  }

  return (
    <>
      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[min(520px,calc(100vh-8rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-xl sm:right-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-primary-600 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">KI-Assistent</span>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleReset}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  title="Neues Gespräch"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              /* Empty State */
              <div className="flex h-full flex-col items-center justify-center p-5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
                  <Sparkles className="h-6 w-6 text-primary-600" />
                </div>
                <p className="mb-1 text-sm font-bold text-text-primary">Wie kann ich helfen?</p>
                <p className="mb-5 text-center text-xs text-text-secondary">
                  Fragen zur Krisenvorsorge, Warnungen & mehr
                </p>
                <div className="flex w-full flex-col gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q.text}
                      onClick={() => sendMessage(q.text)}
                      className="flex items-center gap-2.5 rounded-xl border border-border bg-white px-3 py-2.5 text-left text-xs font-medium text-text-primary transition-all hover:border-primary-300 hover:shadow-sm"
                    >
                      <span className="text-base">{q.emoji}</span>
                      {q.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message List */
              <div className="space-y-0.5 p-3">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2 rounded-xl p-2 ${
                      msg.role === 'user' ? 'ml-6 flex-row-reverse' : 'mr-6'
                    }`}
                  >
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                      msg.role === 'user' ? 'bg-primary-100' : 'bg-amber-100'
                    }`}>
                      {msg.role === 'user' ? (
                        <User className="h-3 w-3 text-primary-600" />
                      ) : (
                        <Bot className="h-3 w-3 text-amber-600" />
                      )}
                    </div>
                    <div className={`min-w-0 flex-1 rounded-xl px-3 py-2 ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-surface-secondary text-text-primary'
                    }`}>
                      <p className="whitespace-pre-wrap text-xs leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Loading */}
                {loading && (
                  <div className="mr-6 flex gap-2 rounded-xl p-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                      <Bot className="h-3 w-3 text-amber-600" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl bg-surface-secondary px-3 py-2">
                      <Loader2 className="h-3 w-3 animate-spin text-text-muted" />
                      <span className="text-xs text-text-muted">Denkt nach...</span>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="rounded-xl bg-red-50 px-3 py-2">
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border bg-white p-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Frage stellen..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-border bg-surface-secondary px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 sm:right-6 ${
          open
            ? 'bg-text-secondary text-white hover:bg-text-primary'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        }`}
        title="KI-Assistent"
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
      </button>
    </>
  )
}

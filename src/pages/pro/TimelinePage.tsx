/**
 * TimelinePage – Chronologisches Krisenprotokoll
 *
 * Zeigt alle crisis_events als vertikale Timeline.
 * "Neuer Eintrag" Button für manuelle Einträge.
 */
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Clock,
  Plus,
  X,
  Filter,
} from 'lucide-react'
import clsx from 'clsx'
import { useScope, useScopeCrisis } from '@/hooks/useScope'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import type { DbCrisisEvent, CrisisEventType } from '@/types/database'

// Event-Typ → Emoji + Label mapping
const eventConfig: Record<string, { emoji: string; label: string; color: string }> = {
  krise_aktiviert: { emoji: '🔴', label: 'Krise aktiviert', color: 'border-red-300 bg-red-50' },
  krise_beendet: { emoji: '✅', label: 'Krise beendet', color: 'border-green-300 bg-green-50' },
  stufe_geaendert: { emoji: '⬆️', label: 'Stufe geändert', color: 'border-orange-300 bg-orange-50' },
  alarm_gesendet: { emoji: '📡', label: 'Alarm gesendet', color: 'border-blue-300 bg-blue-50' },
  massnahme_erledigt: { emoji: '✅', label: 'Maßnahme erledigt', color: 'border-green-300 bg-green-50' },
  checkliste_aktualisiert: { emoji: '📋', label: 'Checkliste', color: 'border-purple-300 bg-purple-50' },
  warnung_eingegangen: { emoji: '⚠️', label: 'Warnung', color: 'border-amber-300 bg-amber-50' },
  manueller_eintrag: { emoji: '📝', label: 'Manuell', color: 'border-gray-300 bg-gray-50' },
  kontakt_alarmiert: { emoji: '📞', label: 'Kontakt alarmiert', color: 'border-blue-300 bg-blue-50' },
  eskalation: { emoji: '🚨', label: 'Eskalation', color: 'border-red-300 bg-red-50' },
}

const filterChips: { label: string; types: CrisisEventType[] | null }[] = [
  { label: 'Alle', types: null },
  { label: 'Alarmierung', types: ['alarm_gesendet', 'kontakt_alarmiert'] },
  { label: 'Maßnahmen', types: ['massnahme_erledigt', 'checkliste_aktualisiert'] },
  { label: 'Stufe', types: ['stufe_geaendert', 'krise_aktiviert', 'krise_beendet'] },
  { label: 'Manuell', types: ['manueller_eintrag'] },
]

export default function TimelinePage() {
  const { isActive, insertEvent } = useScopeCrisis()
  const { scopeId, scopeColumn, scopeType } = useScope()
  const [activeFilter, setActiveFilter] = useState<CrisisEventType[] | null>(null)
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [newBeschreibung, setNewBeschreibung] = useState('')
  const [saving, setSaving] = useState(false)

  // Redirect wenn keine Krise aktiv
  if (!isActive) {
    return <Navigate to={scopeType === 'organization' ? '/unternehmen' : '/pro'} replace />
  }

  // Events laden
  const { data: events, refetch } = useSupabaseQuery<DbCrisisEvent>(
    (sb) =>
      sb
        .from('crisis_events')
        .select('*')
        .eq(scopeColumn, scopeId!)
        .order('created_at', { ascending: false })
        .limit(100),
    [scopeId, scopeColumn]
  )

  // Gefilterte Events
  const filteredEvents = activeFilter
    ? events.filter(e => activeFilter.includes(e.type))
    : events

  // Neuer Eintrag speichern
  const handleSaveEntry = async () => {
    if (!newBeschreibung.trim()) return
    setSaving(true)
    try {
      await insertEvent('manueller_eintrag', newBeschreibung.trim())
      setNewBeschreibung('')
      setShowNewEntry(false)
      refetch()
    } catch (err) {
      console.error('Eintrag speichern fehlgeschlagen:', err)
    } finally {
      setSaving(false)
    }
  }

  // Gruppierung nach Datum
  const groupedEvents: Record<string, DbCrisisEvent[]> = {}
  filteredEvents.forEach(evt => {
    const date = new Date(evt.created_at).toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    if (!groupedEvents[date]) groupedEvents[date] = []
    groupedEvents[date].push(evt)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-900/30">
            <Clock className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Ereignis-Timeline</h1>
            <p className="text-sm text-text-secondary">{filteredEvents.length} Ereignisse</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewEntry(true)}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Neuer Eintrag
        </button>
      </div>

      {/* Neuer Eintrag Modal-Inline */}
      {showNewEntry && (
        <div className="rounded-2xl border-2 border-red-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Manueller Eintrag</h3>
            <button onClick={() => setShowNewEntry(false)} className="text-text-muted hover:text-text-primary">
              <X className="h-4 w-4" />
            </button>
          </div>
          <textarea
            value={newBeschreibung}
            onChange={(e) => setNewBeschreibung(e.target.value)}
            placeholder="Ereignis beschreiben..."
            className="mb-3 w-full rounded-xl border border-border px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowNewEntry(false)}
              className="rounded-xl px-3 py-2 text-sm text-text-secondary hover:bg-surface-secondary"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSaveEntry}
              disabled={!newBeschreibung.trim() || saving}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? 'Speichert...' : 'Eintragen'}
            </button>
          </div>
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-text-muted" />
        {filterChips.map(chip => (
          <button
            key={chip.label}
            onClick={() => setActiveFilter(chip.types)}
            className={clsx(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              (activeFilter === chip.types || (chip.types === null && activeFilter === null))
                ? 'bg-red-600 text-white'
                : 'border border-border bg-white text-text-secondary hover:bg-surface-secondary'
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {Object.entries(groupedEvents).length === 0 ? (
        <div className="py-16 text-center">
          <Clock className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-muted">Noch keine Ereignisse vorhanden.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([date, dayEvents]) => (
            <div key={date}>
              {/* Date header */}
              <div className="mb-4 flex items-center gap-3">
                <span className="text-sm font-semibold text-text-primary">{date}</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Events */}
              <div className="relative ml-4 space-y-0 border-l-2 border-border pl-6">
                {dayEvents.map(evt => {
                  const config = eventConfig[evt.type] || eventConfig.manueller_eintrag
                  const time = new Date(evt.created_at).toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  return (
                    <div key={evt.id} className="relative pb-5">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-border bg-white text-xs">
                        {config.emoji}
                      </div>

                      {/* Event card */}
                      <div className={clsx('rounded-xl border p-4', config.color)}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                            {config.label}
                          </span>
                          <span className="font-mono text-xs text-text-muted">{time}</span>
                        </div>
                        <p className="text-sm text-text-primary">{evt.beschreibung}</p>
                        {evt.erstellt_von && (
                          <p className="mt-1 text-xs text-text-muted">von {evt.erstellt_von}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

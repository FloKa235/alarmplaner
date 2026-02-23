/**
 * LagezentrumPage – Krisen-Dashboard mit Live-Daten
 *
 * Zeigt: StatCards (Laufzeit, Stufe, Maßnahmen, Warnungen),
 * Akut-Checkliste, letzte Events, Alarmkette-Status, Warnungen
 */
import { useMemo } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  Clock,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Radio,
  ArrowRight,
  ListChecks,
  Activity,
} from 'lucide-react'
import { useCrisis, formatElapsed, stufeLabelMap, stufeColorMap } from '@/contexts/CrisisContext'
import { useDistrict } from '@/hooks/useDistrict'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useWarnings } from '@/hooks/useWarnings'
import StatCard from '@/components/ui/StatCard'
import type { DbCrisisEvent, DbChecklist } from '@/types/database'
import clsx from 'clsx'

// Event-Typ → Emoji mapping
const eventEmoji: Record<string, string> = {
  krise_aktiviert: '🔴',
  krise_beendet: '✅',
  stufe_geaendert: '⬆️',
  alarm_gesendet: '📡',
  massnahme_erledigt: '✅',
  checkliste_aktualisiert: '📋',
  warnung_eingegangen: '⚠️',
  manueller_eintrag: '📝',
  kontakt_alarmiert: '📞',
  eskalation: '🚨',
}

export default function LagezentrumPage() {
  const { isActive, scenarioId, scenarioTitle, stufe, elapsedSeconds } = useCrisis()
  const { districtId } = useDistrict()
  const { warnings } = useWarnings(districtId)

  // Redirect wenn keine Krise aktiv
  if (!isActive) {
    return <Navigate to="/pro" replace />
  }

  // Letzte Events laden
  const { data: events } = useSupabaseQuery<DbCrisisEvent>(
    (sb) =>
      sb
        .from('crisis_events')
        .select('*')
        .eq('district_id', districtId!)
        .order('created_at', { ascending: false })
        .limit(10),
    [districtId]
  )

  // Checklisten für dieses Szenario laden
  const { data: checklists } = useSupabaseQuery<DbChecklist>(
    (sb) =>
      sb
        .from('checklists')
        .select('*')
        .eq('district_id', districtId!)
        .eq('scenario_id', scenarioId!),
    [districtId, scenarioId]
  )

  // Checklisten-Statistik
  const checklistStats = useMemo(() => {
    let total = 0
    let done = 0
    checklists.forEach(cl => {
      cl.items.forEach(item => {
        total++
        if (item.status === 'done') done++
      })
    })
    return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 }
  }, [checklists])

  // Aktive Warnungen
  const activeWarnings = warnings.filter(w => w.severity === 'severe' || w.severity === 'extreme')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-900/30">
            <Radio className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Lagezentrum</h1>
            <p className="text-sm text-text-secondary">{scenarioTitle}</p>
          </div>
        </div>
      </div>

      {/* StatCards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Laufzeit"
          value={formatElapsed(elapsedSeconds)}
        />
        <StatCard
          icon={<ShieldAlert className="h-5 w-5" />}
          label="Alarmstufe"
          value={stufe ? stufeLabelMap[stufe] : '—'}
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5" />}
          label="Maßnahmen-Fortschritt"
          value={`${checklistStats.percent}%`}
          trend={checklistStats.total > 0 ? { value: `${checklistStats.done}/${checklistStats.total}`, positive: checklistStats.percent >= 50 } : undefined}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Aktive Warnungen"
          value={activeWarnings.length}
          trend={activeWarnings.length > 0 ? { value: `${activeWarnings.length} kritisch`, positive: false } : undefined}
        />
      </div>

      {/* 2-Col Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Akut-Checkliste */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
              <ListChecks className="h-5 w-5 text-red-500" />
              Akut-Checklisten
            </h2>
            <Link
              to="/pro/checklisten"
              className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
            >
              Alle anzeigen <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {checklists.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">
              Keine Checklisten für dieses Szenario zugeordnet.
            </p>
          ) : (
            <div className="space-y-3">
              {checklists.slice(0, 3).map(cl => {
                const total = cl.items.length
                const done = cl.items.filter(i => i.status === 'done').length
                const pct = total > 0 ? Math.round((done / total) * 100) : 0
                return (
                  <div key={cl.id} className="rounded-xl border border-border p-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">{cl.title}</span>
                      <span className="text-xs text-text-muted">{done}/{total}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all',
                          pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-primary-500' : 'bg-red-500'
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Letzte Ereignisse */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
              <Activity className="h-5 w-5 text-red-500" />
              Letzte Ereignisse
            </h2>
            <Link
              to="/pro/timeline"
              className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
            >
              Timeline <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {events.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">
              Noch keine Ereignisse protokolliert.
            </p>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 5).map(evt => (
                <div key={evt.id} className="flex gap-3 rounded-xl border border-border p-3">
                  <span className="text-lg">{eventEmoji[evt.type] || '📋'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary">{evt.beschreibung}</p>
                    <p className="text-xs text-text-muted">
                      {new Date(evt.created_at).toLocaleString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2-Col Grid Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Aktive Warnungen */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-text-primary">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Echtzeit-Warnungen
          </h2>

          {activeWarnings.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">
              Keine kritischen Warnungen aktiv.
            </p>
          ) : (
            <div className="space-y-3">
              {activeWarnings.slice(0, 5).map(w => (
                <div
                  key={w.id}
                  className={clsx(
                    'rounded-xl border p-3',
                    w.severity === 'extreme'
                      ? 'border-red-200 bg-red-50'
                      : 'border-amber-200 bg-amber-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={clsx(
                      'text-sm font-medium',
                      w.severity === 'extreme' ? 'text-red-800' : 'text-amber-800'
                    )}>
                      {w.title}
                    </span>
                    <span className={clsx(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                      w.severity === 'extreme' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    )}>
                      {w.source}
                    </span>
                  </div>
                  {w.description && (
                    <p className="mt-1 text-xs text-text-secondary line-clamp-2">{w.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stufen-Info */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-text-primary">Alarmstufe</h2>
          <div className="space-y-3">
            {(['vorwarnung', 'teilaktivierung', 'vollaktivierung'] as const).map(s => (
              <div
                key={s}
                className={clsx(
                  'rounded-xl border-2 p-4 transition-all',
                  s === stufe
                    ? stufeColorMap[s] + ' ring-2 ring-offset-1 ring-current'
                    : 'border-border bg-surface-secondary opacity-40'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{stufeLabelMap[s]}</span>
                  {s === stufe && (
                    <span className="text-xs font-medium">Aktiv</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

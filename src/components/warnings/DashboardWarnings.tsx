import { useMemo } from 'react'
import {
  CloudLightning, Radio, Droplets, Clock, Filter, ShieldAlert,
  AlertTriangle, MapPin, Info,
} from 'lucide-react'
import Badge from '@/components/ui/Badge'
import type { DbExternalWarning } from '@/types/database'

// ─── Types ───────────────────────────────────────────

export type Severity = DbExternalWarning['severity']
export type Source = DbExternalWarning['source']

// ─── Config ──────────────────────────────────────────

export const severityConfig: Record<Severity, { label: string; variant: 'danger' | 'warning' | 'info' }> = {
  extreme: { label: 'Extrem', variant: 'danger' },
  severe: { label: 'Schwer', variant: 'danger' },
  moderate: { label: 'Mäßig', variant: 'warning' },
  minor: { label: 'Gering', variant: 'info' },
}

export const sourceConfig: Record<Source, { label: string; icon: typeof Radio; bg: string; color: string }> = {
  nina: { label: 'NINA', icon: Radio, bg: 'bg-orange-50', color: 'text-orange-600' },
  dwd: { label: 'DWD', icon: CloudLightning, bg: 'bg-sky-50', color: 'text-sky-600' },
  pegel: { label: 'Pegel', icon: Droplets, bg: 'bg-blue-50', color: 'text-blue-600' },
}

export const severityOrder: Record<Severity, number> = { extreme: 0, severe: 1, moderate: 2, minor: 3 }

// ─── DashboardWarnings ──────────────────────────────

export function DashboardWarnings({
  warnings,
  severityFilter,
  sourceFilter,
  onSeverityChange,
  onSourceChange,
  onSelect,
}: {
  warnings: DbExternalWarning[]
  severityFilter: Severity | null
  sourceFilter: Source | null
  onSeverityChange: (v: Severity | null) => void
  onSourceChange: (v: Source | null) => void
  onSelect: (w: DbExternalWarning) => void
}) {
  const filtered = useMemo(() => {
    let list = [...warnings]
    if (severityFilter) list = list.filter((w) => w.severity === severityFilter)
    if (sourceFilter) list = list.filter((w) => w.source === sourceFilter)
    list.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    return list
  }, [warnings, severityFilter, sourceFilter])

  if (warnings.length === 0) {
    return (
      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-border bg-white p-6">
        <CloudLightning className="h-5 w-5 shrink-0 text-text-muted" />
        <div>
          <p className="text-sm font-medium text-text-primary">Keine aktiven Warnungen</p>
          <p className="text-xs text-text-muted">NINA, DWD & Pegelonline werden automatisch aktualisiert.</p>
        </div>
      </div>
    )
  }

  const hasFilter = severityFilter !== null || sourceFilter !== null

  return (
    <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
      {/* Header + Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <CloudLightning className="h-5 w-5 text-amber-600" />
        <h2 className="text-lg font-bold text-amber-900">Aktuelle Warnungen ({warnings.length})</h2>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-amber-600" />
          {/* Severity chips */}
          {(['extreme', 'severe', 'moderate', 'minor'] as Severity[]).map((s) => {
            const count = warnings.filter((w) => w.severity === s).length
            if (count === 0) return null
            return (
              <button
                key={s}
                onClick={() => onSeverityChange(severityFilter === s ? null : s)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  severityFilter === s
                    ? 'bg-amber-700 text-white'
                    : 'bg-white/80 text-amber-800 hover:bg-white'
                }`}
              >
                {severityConfig[s].label} ({count})
              </button>
            )
          })}
          <span className="text-amber-300">|</span>
          {/* Source chips */}
          {(['nina', 'dwd', 'pegel'] as Source[]).map((s) => {
            const count = warnings.filter((w) => w.source === s).length
            if (count === 0) return null
            return (
              <button
                key={s}
                onClick={() => onSourceChange(sourceFilter === s ? null : s)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  sourceFilter === s
                    ? 'bg-amber-700 text-white'
                    : 'bg-white/80 text-amber-800 hover:bg-white'
                }`}
              >
                {sourceConfig[s].label} ({count})
              </button>
            )
          })}
          {hasFilter && (
            <button
              onClick={() => { onSeverityChange(null); onSourceChange(null) }}
              className="rounded-lg px-2 py-1 text-xs text-amber-700 underline hover:text-amber-900"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Warnings list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="py-2 text-center text-sm text-amber-700">Keine Warnungen für diesen Filter.</p>
        ) : (
          filtered.slice(0, 10).map((w) => {
            const srcConf = sourceConfig[w.source]
            const sevConf = severityConfig[w.severity]
            const SrcIcon = srcConf.icon

            return (
              <button
                key={w.id}
                onClick={() => onSelect(w)}
                className="flex w-full items-start gap-3 rounded-xl bg-white p-3 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${srcConf.bg} ${srcConf.color}`}>
                  <SrcIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-medium text-text-primary">{w.title}</p>
                    <Badge variant={sevConf.variant}>{sevConf.label}</Badge>
                  </div>
                  {w.description && (
                    <p className="line-clamp-1 text-xs text-text-muted">{w.description}</p>
                  )}
                  <div className="mt-1 flex gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(w.effective_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {w.expires_at && (
                      <span>
                        bis {new Date(w.expires_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
      {filtered.length > 10 && (
        <p className="mt-2 text-center text-xs text-amber-700">
          +{filtered.length - 10} weitere Warnungen
        </p>
      )}
    </div>
  )
}

// ─── Warning Detail (Modal Content) ──────────────────

export function WarningDetail({ warning }: { warning: DbExternalWarning }) {
  const srcConf = sourceConfig[warning.source]
  const sevConf = severityConfig[warning.severity]
  const SrcIcon = srcConf.icon

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${srcConf.bg} ${srcConf.color}`}>
          <SrcIcon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-text-primary">{warning.title}</h3>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge variant={sevConf.variant}>{sevConf.label}</Badge>
            <Badge>{srcConf.label}</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl bg-surface-secondary p-3">
          <Clock className="h-4 w-4 text-text-muted" />
          <div>
            <p className="text-xs text-text-muted">Gültig ab</p>
            <p className="text-sm font-medium text-text-primary">
              {new Date(warning.effective_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-surface-secondary p-3">
          <Clock className="h-4 w-4 text-text-muted" />
          <div>
            <p className="text-xs text-text-muted">Gültig bis</p>
            <p className="text-sm font-medium text-text-primary">
              {warning.expires_at
                ? new Date(warning.expires_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'Nicht angegeben'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-surface-secondary p-3">
          <ShieldAlert className="h-4 w-4 text-text-muted" />
          <div>
            <p className="text-xs text-text-muted">Schweregrad</p>
            <p className="text-sm font-medium text-text-primary">{sevConf.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-surface-secondary p-3">
          <Info className="h-4 w-4 text-text-muted" />
          <div>
            <p className="text-xs text-text-muted">Quelle</p>
            <p className="text-sm font-medium text-text-primary">
              {warning.source === 'nina' ? 'NINA (BBK)' : warning.source === 'dwd' ? 'Deutscher Wetterdienst' : 'Pegelonline'}
            </p>
          </div>
        </div>
      </div>

      {warning.description && (
        <div>
          <h4 className="mb-2 text-sm font-bold text-text-primary">Beschreibung</h4>
          <p className="whitespace-pre-line text-sm text-text-secondary">{warning.description}</p>
        </div>
      )}

      {warning.instruction && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            Handlungsempfehlungen
          </h4>
          <p className="whitespace-pre-line text-sm text-amber-800">{warning.instruction}</p>
        </div>
      )}

      {warning.affected_areas && warning.affected_areas.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-text-primary">
            <MapPin className="h-4 w-4" />
            Betroffene Gebiete
          </h4>
          <div className="flex flex-wrap gap-2">
            {warning.affected_areas.map((area, i) => (
              <span key={i} className="rounded-lg bg-surface-secondary px-3 py-1.5 text-xs font-medium text-text-secondary">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-text-muted">
        Abgerufen: {new Date(warning.fetched_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  )
}

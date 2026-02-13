import { useState, useMemo } from 'react'
import {
  ShieldAlert, Flame, Package, Bell, TrendingUp, AlertTriangle, Loader2,
  CloudLightning, Radio, Droplets, Clock, MapPin, Info, Filter,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import MapView, { type MapMarker } from '@/components/ui/MapView'
import { useDistrict } from '@/hooks/useDistrict'
import { useSupabaseQuery, useSupabaseSingle } from '@/hooks/useSupabaseQuery'
import { useWarnings } from '@/hooks/useWarnings'
import { SECTOR_CONFIG, categoryToSector } from '@/data/sector-config'
import type { DbMunicipality, DbScenario, DbAlert, DbInventoryItem, DbRiskProfile, DbKritisSite, DbExternalWarning } from '@/types/database'

// ─── Warning Configs ─────────────────────────────────

type Severity = DbExternalWarning['severity']
type Source = DbExternalWarning['source']

const severityConfig: Record<Severity, { label: string; variant: 'danger' | 'warning' | 'info' }> = {
  extreme: { label: 'Extrem', variant: 'danger' },
  severe: { label: 'Schwer', variant: 'danger' },
  moderate: { label: 'Mäßig', variant: 'warning' },
  minor: { label: 'Gering', variant: 'info' },
}

const sourceConfig: Record<Source, { label: string; icon: typeof Radio; bg: string; color: string }> = {
  nina: { label: 'NINA', icon: Radio, bg: 'bg-orange-50', color: 'text-orange-600' },
  dwd: { label: 'DWD', icon: CloudLightning, bg: 'bg-sky-50', color: 'text-sky-600' },
  pegel: { label: 'Pegel', icon: Droplets, bg: 'bg-blue-50', color: 'text-blue-600' },
}

const severityOrder: Record<Severity, number> = { extreme: 0, severe: 1, moderate: 2, minor: 3 }

function riskColor(score: number): string {
  if (score >= 70) return '#ef4444'
  if (score >= 40) return '#f59e0b'
  return '#22c55e'
}

export default function ProDashboard() {
  const { district, districtId, loading: districtLoading } = useDistrict()

  // Warning filter & modal state
  const [warnSeverity, setWarnSeverity] = useState<Severity | null>(null)
  const [warnSource, setWarnSource] = useState<Source | null>(null)
  const [selectedWarning, setSelectedWarning] = useState<DbExternalWarning | null>(null)

  const { data: municipalities, loading: munLoading } = useSupabaseQuery<DbMunicipality>(
    (sb) =>
      sb
        .from('municipalities')
        .select('*')
        .eq('district_id', districtId!)
        .order('name'),
    [districtId]
  )

  const { data: scenarios, loading: scenLoading } = useSupabaseQuery<DbScenario>(
    (sb) =>
      sb
        .from('scenarios')
        .select('*')
        .eq('district_id', districtId!),
    [districtId]
  )

  const { data: alerts, loading: alertLoading } = useSupabaseQuery<DbAlert>(
    (sb) =>
      sb
        .from('alerts')
        .select('*')
        .eq('district_id', districtId!)
        .order('created_at', { ascending: false })
        .limit(5),
    [districtId]
  )

  const { data: inventory, loading: invLoading } = useSupabaseQuery<DbInventoryItem>(
    (sb) =>
      sb
        .from('inventory_items')
        .select('*')
        .eq('district_id', districtId!),
    [districtId]
  )

  const { data: kritisSites, loading: kritisLoading } = useSupabaseQuery<DbKritisSite>(
    (sb) =>
      sb
        .from('kritis_sites')
        .select('id, category, sector, risk_exposure')
        .eq('district_id', districtId!),
    [districtId]
  )

  const { warnings } = useWarnings(districtId)

  const { data: riskProfile } = useSupabaseSingle<DbRiskProfile>(
    (sb) =>
      sb
        .from('risk_profiles')
        .select('*')
        .eq('district_id', districtId!)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single(),
    [districtId]
  )

  if (districtLoading || munLoading || scenLoading || alertLoading || invLoading || kritisLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // Computed stats
  const riskScore = riskProfile?.risk_score ?? 0
  const openAlerts = alerts.filter((a) => a.status === 'sent' || a.status === 'acknowledged').length
  const totalTarget = inventory.reduce((sum, i) => sum + i.target_quantity, 0)
  const totalCurrent = inventory.reduce((sum, i) => sum + i.current_quantity, 0)
  const inventoryCoverage = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0

  // KRITIS Sektor-Statistik
  const sectorCounts: Record<string, number> = {}
  for (const site of kritisSites) {
    const sec = site.sector || categoryToSector[site.category] || 'sonstiges'
    sectorCounts[sec] = (sectorCounts[sec] || 0) + 1
  }
  const activeSectors = SECTOR_CONFIG.filter((s) => (sectorCounts[s.key] || 0) > 0)

  // Map markers from municipalities
  const dashboardMarkers: MapMarker[] = municipalities
    .filter((m) => m.latitude && m.longitude)
    .map((m) => ({
      id: m.id,
      lng: m.longitude,
      lat: m.latitude,
      label: m.name,
      color: riskColor(m.risk_score),
      popup: `<strong>${m.name}</strong><br/>Risiko: ${m.risk_level || 'k.A.'} (${m.risk_score})`,
    }))

  // Alert status config
  const statusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'info' | 'success' }> = {
    draft: { label: 'Entwurf', variant: 'default' },
    sent: { label: 'Gesendet', variant: 'warning' },
    acknowledged: { label: 'Bestätigt', variant: 'info' },
    resolved: { label: 'Abgeschlossen', variant: 'success' },
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Übersicht über Risiken, Szenarien und Ressourcen Ihres Landkreises."
        badge={district?.name || 'Landkreis'}
      />

      {/* KPI Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ShieldAlert className="h-5 w-5" />}
          label="Risiko-Score"
          value={`${riskScore}/100`}
        />
        <StatCard
          icon={<Flame className="h-5 w-5" />}
          label="Aktive Szenarien"
          value={scenarios.length}
        />
        <StatCard
          icon={<Package className="h-5 w-5" />}
          label="Inventar-Abdeckung"
          value={`${inventoryCoverage}%`}
        />
        <StatCard
          icon={<Bell className="h-5 w-5" />}
          label="Offene Alarme"
          value={openAlerts}
        />
      </div>

      {/* KRITIS-Sektoren Übersicht */}
      {kritisSites.length > 0 && (
        <div className="mb-8 rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-bold text-text-primary">KRITIS-Infrastruktur</h2>
              <span className="text-sm text-text-muted">({kritisSites.length} Objekte)</span>
            </div>
            <Link
              to="/pro/kritis"
              className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
            >
              Alle anzeigen &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {activeSectors.map((sec) => {
              const Icon = sec.icon
              const count = sectorCounts[sec.key] || 0
              return (
                <Link
                  key={sec.key}
                  to="/pro/kritis"
                  className={`flex items-center gap-2.5 rounded-xl ${sec.bg} px-3 py-2.5 transition-all hover:shadow-sm`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ${sec.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold leading-none text-text-primary">{count}</p>
                    <p className="truncate text-xs text-text-muted">{sec.label}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Aktuelle Warnungen (NINA/DWD/Pegel) – mit Filter + Details */}
      <DashboardWarnings
        warnings={warnings}
        severityFilter={warnSeverity}
        sourceFilter={warnSource}
        onSeverityChange={setWarnSeverity}
        onSourceChange={setWarnSource}
        onSelect={setSelectedWarning}
      />

      {/* Warning Detail Modal */}
      <Modal open={!!selectedWarning} onClose={() => setSelectedWarning(null)} title="Warnungsdetails" size="lg">
        {selectedWarning && <WarningDetail warning={selectedWarning} />}
      </Modal>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Karte */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-bold text-text-primary">Risiko-Karte</h2>
              <Badge variant="info">Live</Badge>
            </div>
            <MapView
              height="420px"
              markers={dashboardMarkers}
              center={district?.longitude && district?.latitude ? [district.longitude, district.latitude] : undefined}
              zoom={10}
              fallbackTitle="Mapbox wird geladen..."
              fallbackDescription="Interaktive Risiko-Heatmap mit KRITIS-Infrastruktur."
              showControls
            />
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-lg font-bold text-text-primary">Letzte Warnungen</h2>
            <TrendingUp className="h-4 w-4 text-text-muted" />
          </div>
          {alerts.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto mb-2 h-6 w-6 text-text-muted" />
              <p className="text-sm text-text-muted">Keine Alarme</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {alerts.map((alert) => {
                const status = statusConfig[alert.status] || statusConfig.draft
                return (
                  <div key={alert.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium text-text-primary">{alert.title}</p>
                      <p className="text-xs text-text-muted">
                        {alert.sent_at
                          ? new Date(alert.sent_at).toLocaleDateString('de-DE')
                          : new Date(alert.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <Badge variant={status.variant}>
                      {status.label}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
          <div className="border-t border-border px-5 py-3">
            <button className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700">
              Alle anzeigen &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Warnings Section ──────────────────────

function DashboardWarnings({
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

function WarningDetail({ warning }: { warning: DbExternalWarning }) {
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

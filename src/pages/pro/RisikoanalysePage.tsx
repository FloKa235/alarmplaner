import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldAlert, Loader2, Clock, Cloud,
  Droplets, Radio, Database, Timer, ExternalLink,
  Mountain, Waves, TreePine, Compass, AlertTriangle,
  Zap, TrendingUp, ArrowRight,
} from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import { useDistrict } from '@/hooks/useDistrict'
import { useWarnings } from '@/hooks/useWarnings'
import { useSupabaseQuery, useSupabaseSingle } from '@/hooks/useSupabaseQuery'
import { SECTOR_CONFIG, categoryToSector } from '@/data/sector-config'
import { correlateWarningsWithRisks } from '@/utils/warning-risk-correlation'
import RiskTrendChart from '@/components/risk/RiskTrendChart'
import GemeindeRiskMap from '@/components/risk/GemeindeRiskMap'
import RiskRecommendations from '@/components/risk/RiskRecommendations'
import type { DbRiskProfile, DbRiskEntry, DbDistrict, DbExternalWarning } from '@/types/database'

// ─── Level Helpers ──────────────────────────────────────

const levelVariant = {
  niedrig: 'success' as const,
  mittel: 'warning' as const,
  erhöht: 'warning' as const,
  hoch: 'danger' as const,
  extrem: 'danger' as const,
}

const levelLabel: Record<string, string> = {
  niedrig: 'Niedrig',
  mittel: 'Mittel',
  erhöht: 'Erhöht',
  hoch: 'Hoch',
  extrem: 'Extrem',
}

const levelColor: Record<string, string> = {
  niedrig: 'bg-green-500',
  mittel: 'bg-amber-500',
  erhöht: 'bg-orange-500',
  hoch: 'bg-red-500',
  extrem: 'bg-red-700',
}

// Score → Farbklasse für den Kreis
function scoreCircleColor(score: number): string {
  if (score <= 30) return 'text-green-600 bg-green-50 ring-green-200'
  if (score <= 50) return 'text-amber-600 bg-amber-50 ring-amber-200'
  if (score <= 70) return 'text-orange-600 bg-orange-50 ring-orange-200'
  return 'text-red-600 bg-red-50 ring-red-200'
}

// Naturgefahren-Typen identifizieren
const NATURE_HAZARD_TYPES = [
  'Überschwemmung', 'Hochwasser', 'Waldbrand', 'Erdbebenzone', 'Erdbeben',
  'Gewässer', 'Staudamm', 'Waldbedeckung', 'Überschwemmungsgebiet',
  'Starkregen', 'Sturmflut', 'Hagel', 'Dürre', 'Lawine', 'Erdrutsch',
]

function isNatureHazard(type: string): boolean {
  return NATURE_HAZARD_TYPES.some(h => type.toLowerCase().includes(h.toLowerCase()))
}

// Naturgefahren-Icons
function getNatureIcon(type: string) {
  const lower = type.toLowerCase()
  if (lower.includes('überschwemmung') || lower.includes('hochwasser') || lower.includes('sturmflut')) return Waves
  if (lower.includes('staudamm') || lower.includes('gewässer')) return Droplets
  if (lower.includes('wald') || lower.includes('brand')) return TreePine
  if (lower.includes('erdbeben')) return Compass
  if (lower.includes('erdrutsch') || lower.includes('lawine')) return Mountain
  return AlertTriangle
}

// Relative Zeitangabe
function timeAgo(dateStr: string): string {
  const now = new Date()
  const then = new Date(dateStr)
  const diffMs = now.getTime() - then.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'gerade eben'
  if (diffMin < 60) return `vor ${diffMin} Minuten`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `vor ${diffHours} ${diffHours === 1 ? 'Stunde' : 'Stunden'}`
  const diffDays = Math.floor(diffHours / 24)
  return `vor ${diffDays} ${diffDays === 1 ? 'Tag' : 'Tagen'}`
}

// Nächste Analyse berechnen
function nextAnalysis(lastRefresh: string | null): string {
  if (!lastRefresh) return 'ausstehend'
  const slots = [6, 14]
  const now = new Date()
  for (const hour of slots) {
    const next = new Date(now)
    next.setHours(hour, 0, 0, 0)
    if (next > now) {
      const diffH = Math.round((next.getTime() - now.getTime()) / 3600000)
      return diffH <= 1 ? 'in ~1 Std.' : `in ~${diffH} Std.`
    }
  }
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(6, 0, 0, 0)
  const diffH = Math.round((tomorrow.getTime() - now.getTime()) / 3600000)
  return `in ~${diffH} Std.`
}

// ─── Hauptkomponente ────────────────────────────────────

export default function RisikoanalysePage() {
  const navigate = useNavigate()
  const { district, districtId, loading: districtLoading } = useDistrict()
  const { warnings } = useWarnings(districtId)

  // Risk Profile (latest)
  const { data: profile, loading: profileLoading } = useSupabaseSingle<DbRiskProfile>(
    (sb) =>
      sb.from('risk_profiles').select('*').eq('district_id', districtId!)
        .order('generated_at', { ascending: false }).limit(1).single(),
    [districtId]
  )

  // Risk Profile History (für Trend-Chart, letzte 90 Tage)
  const { data: profileHistory } = useSupabaseQuery<DbRiskProfile>(
    (sb) =>
      sb.from('risk_profiles').select('*').eq('district_id', districtId!)
        .order('generated_at', { ascending: false }).limit(180),
    [districtId]
  )

  // Risk Entries
  const { data: riskEntries, loading: entriesLoading } = useSupabaseQuery<DbRiskEntry>(
    (sb) => {
      if (!profile?.id) return sb.from('risk_entries').select('*').eq('risk_profile_id', '00000000-0000-0000-0000-000000000000')
      return sb.from('risk_entries').select('*').eq('risk_profile_id', profile.id).order('score', { ascending: false })
    },
    [profile?.id]
  )

  // KRITIS Sites (for sector counts)
  const { data: kritisSites } = useSupabaseQuery<{ category: string; sector: string | null }>(
    (sb) => sb.from('kritis_sites').select('category, sector').eq('district_id', districtId!),
    [districtId]
  )

  // Warning counts by source
  const warnCounts = useMemo(() => {
    const counts = { dwd: 0, nina: 0, pegelonline: 0, total: 0 }
    warnings.forEach((w: DbExternalWarning) => {
      const src = (w.source || '').toLowerCase()
      if (src.includes('dwd')) counts.dwd++
      else if (src.includes('nina') || src.includes('bbk')) counts.nina++
      else if (src.includes('pegel')) counts.pegelonline++
      counts.total++
    })
    return counts
  }, [warnings])

  // KRITIS sector aggregation
  const sectorCounts = useMemo(() => {
    const map: Record<string, number> = {}
    kritisSites.forEach((site) => {
      const sector = site.sector || categoryToSector[site.category] || 'staat'
      map[sector] = (map[sector] || 0) + 1
    })
    return Object.entries(map)
      .map(([key, count]) => ({ key, count, config: SECTOR_CONFIG.find(s => s.key === key) }))
      .filter(s => s.config)
      .sort((a, b) => b.count - a.count)
  }, [kritisSites])

  // Split risk entries into nature hazards vs scenario risks
  const { natureHazards, scenarioRisks } = useMemo(() => {
    const nature: DbRiskEntry[] = []
    const scenarios: DbRiskEntry[] = []
    riskEntries.forEach(e => {
      if (isNatureHazard(e.type)) nature.push(e)
      else scenarios.push(e)
    })
    return { natureHazards: nature, scenarioRisks: scenarios }
  }, [riskEntries])

  // ─── Warnung-Risiko-Korrelation (Live) ─────────────
  const correlation = useMemo(() => {
    if (riskEntries.length === 0) return null
    return correlateWarningsWithRisks(warnings, riskEntries, profile?.risk_score ?? 0)
  }, [warnings, riskEntries, profile?.risk_score])

  // Lookup: riskEntryId → Korrelation
  const correlationMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof correlateWarningsWithRisks>['correlations'][number]>()
    if (correlation) {
      correlation.correlations.forEach(c => map.set(c.riskEntry.id, c))
    }
    return map
  }, [correlation])

  const lastRefresh = (district as DbDistrict & { last_auto_refresh?: string | null })?.last_auto_refresh

  if (districtLoading || profileLoading || entriesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const baseScore = profile?.risk_score ?? 0
  const hasBoost = correlation && correlation.totalBoost > 0
  const score = hasBoost ? correlation.adjustedTotalScore : baseScore
  const level = profile?.risk_level || 'mittel'
  const circleColors = scoreCircleColor(score)

  return (
    <div>
      <PageHeader
        title="KI-gestützte Risikoanalyse"
        description={`Intelligente Auswertung für ${district?.name || 'Ihren Landkreis'}`}

      />

      {/* ─── 1. Gesamtrisiko + Datenquellen ────────────────── */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {/* Gesamtrisiko – doppelte Breite */}
        <div className={`rounded-2xl border p-5 transition-shadow hover:shadow-md sm:col-span-2 ${hasBoost ? 'border-orange-300 bg-orange-50/30' : 'border-border bg-white'}`}>
          <div className="flex items-center gap-4">
            <div className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ring-2 ${circleColors}`}>
              <span className="text-2xl font-extrabold">{score}</span>
              {hasBoost && (
                <div className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm">
                  <Zap className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-text-primary">Gesamtrisiko</p>
                <Badge variant={levelVariant[level as keyof typeof levelVariant]}>
                  {levelLabel[level] || 'Mittel'}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-text-secondary">
                {profile?.generated_at
                  ? `Aktualisiert ${timeAgo(profile.generated_at)}`
                  : 'Noch keine Analyse vorhanden'}
              </p>
              {hasBoost && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-orange-700">
                  <Zap className="h-3 w-3" />
                  <span>
                    +{correlation.totalBoost} durch {correlation.risksWithWarnings} aktive{' '}
                    {correlation.risksWithWarnings === 1 ? 'Warnung' : 'Warnungen'}
                  </span>
                  <span className="text-orange-400">|</span>
                  <span>Basis-Score: {baseScore}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Datenquellen als StatCards */}
        <StatCard
          icon={<Cloud className="h-5 w-5" />}
          label="DWD Wetter"
          value={warnCounts.dwd}
          trend={warnCounts.dwd > 0 ? { value: 'aktiv', positive: false } : undefined}
        />
        <StatCard
          icon={<Droplets className="h-5 w-5" />}
          label="Pegelstände"
          value={warnCounts.pegelonline}
          trend={warnCounts.pegelonline > 0 ? { value: 'aktiv', positive: false } : undefined}
        />
        <StatCard
          icon={<Radio className="h-5 w-5" />}
          label="NINA/BBK"
          value={warnCounts.nina}
          trend={warnCounts.nina > 0 ? { value: 'aktiv', positive: false } : undefined}
        />
        <StatCard
          icon={<Database className="h-5 w-5" />}
          label="KRITIS-Objekte"
          value={kritisSites.length}
        />
      </div>

      {/* Auto-Refresh Info */}
      <div className="mb-6 flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-secondary">
        <Timer className="h-4 w-4 shrink-0 text-primary-600" />
        <span>
          Automatische Analyse 2× täglich (06:00 &amp; 14:00 Uhr).
          {lastRefresh && <> Nächste Analyse: <span className="font-medium text-text-primary">{nextAnalysis(lastRefresh)}</span></>}
        </span>
      </div>

      {/* ─── 1b. Risiko-Trend-Verlauf ────────────────────── */}
      <div className="mb-6">
        <RiskTrendChart profiles={profileHistory} currentScore={score} />
      </div>

      {/* ─── 2. Aktive Warnung-Risiko-Korrelation ─────────── */}
      {correlation && correlation.risksWithWarnings > 0 && (
        <div className="mb-6 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">Live-Warnlage beeinflusst Risiko-Scores</h2>
              <p className="text-xs text-text-muted">
                {correlation.risksWithWarnings} {correlation.risksWithWarnings === 1 ? 'Risikokategorie wird' : 'Risikokategorien werden'} durch aktive Warnungen beeinflusst
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {correlation.correlations
              .filter(c => c.hasActiveWarnings)
              .sort((a, b) => b.scoreBoost - a.scoreBoost)
              .map(c => (
                <div
                  key={c.riskEntry.id}
                  className="flex items-center gap-3 rounded-xl border border-orange-200 bg-white/80 px-4 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">{c.riskEntry.type}</span>
                      <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                        <TrendingUp className="h-3 w-3" />
                        +{c.scoreBoost}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {c.matchedWarnings.map(w => w.title).join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className="text-xs text-text-muted">{c.riskEntry.score}%</span>
                    <ArrowRight className="h-3 w-3 text-orange-500" />
                    <span className="text-sm font-bold text-orange-700">{c.adjustedScore}%</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ─── 2b. Gemeinde-Risiko-Heatmap ─────────────────── */}
      <div className="mb-6">
        <GemeindeRiskMap />
      </div>

      {/* ─── 2c. Handlungsempfehlungen ─────────────────────── */}
      {riskEntries.length > 0 && (
        <div className="mb-6">
          <RiskRecommendations
            riskEntries={riskEntries}
            adjustedScores={
              correlation
                ? new Map(correlation.correlations.map(c => [c.riskEntry.id, c.adjustedScore]))
                : undefined
            }
          />
        </div>
      )}

      {/* ─── 3. KRITIS-Infrastruktur ───────────────────────── */}
      {sectorCounts.length > 0 && (
        <div className="mb-6 rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">Kritische Infrastruktur (KRITIS)</h2>
            <button
              onClick={() => navigate('/pro/kritis')}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              KRITIS-Modul
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sectorCounts.slice(0, 6).map(({ key, count, config }) => {
              if (!config) return null
              const Icon = config.icon
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 transition-shadow hover:shadow-sm"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.bg}`}>
                    <Icon className={`h-4.5 w-4.5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{config.label}</p>
                    <p className="text-xs text-text-muted">{count} Objekte erfasst</p>
                  </div>
                </div>
              )
            })}
          </div>
          {sectorCounts.length > 6 && (
            <p className="mt-3 text-center text-xs text-text-muted">
              + {sectorCounts.length - 6} weitere Sektoren im{' '}
              <button onClick={() => navigate('/pro/kritis')} className="text-primary-600 hover:underline">
                KRITIS-Modul
              </button>
            </p>
          )}
        </div>
      )}

      {/* ─── 3. Naturgefahren ──────────────────────────────── */}
      {natureHazards.length > 0 && (
        <div className="mb-6 rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">Naturgefahren</h2>
            {profile?.generated_at && (
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <Clock className="h-3.5 w-3.5" />
                {new Date(profile.generated_at).toLocaleDateString('de-DE', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                })}
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {natureHazards.map((hazard) => {
              const HazardIcon = getNatureIcon(hazard.type)
              const corr = correlationMap.get(hazard.id)
              const isWarned = corr?.hasActiveWarnings
              return (
                <div
                  key={hazard.id}
                  className={`flex items-center gap-3 rounded-xl border p-4 transition-shadow hover:shadow-sm ${isWarned ? 'border-orange-200 bg-orange-50/40' : 'border-border'}`}
                >
                  <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isWarned ? 'bg-orange-100' : 'bg-surface-secondary'}`}>
                    <HazardIcon className={`h-4.5 w-4.5 ${isWarned ? 'text-orange-600' : 'text-text-muted'}`} />
                    {isWarned && (
                      <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-white">
                        <Zap className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary">{hazard.type}</p>
                      {hazard.level && (
                        <Badge variant={levelVariant[hazard.level as keyof typeof levelVariant]}>
                          {levelLabel[hazard.level] || hazard.level}
                        </Badge>
                      )}
                      {isWarned && (
                        <span className="flex items-center gap-0.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
                          <Zap className="h-2.5 w-2.5" />
                          +{corr.scoreBoost}
                        </span>
                      )}
                    </div>
                    {isWarned && corr.matchedWarnings.length > 0 ? (
                      <p className="mt-0.5 text-xs font-medium text-orange-600 line-clamp-1">
                        {corr.matchedWarnings.map(w => w.title).join(' · ')}
                      </p>
                    ) : hazard.description ? (
                      <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{hazard.description}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    {isWarned ? (
                      <div>
                        <span className="text-lg font-bold text-orange-700">{corr.adjustedScore}%</span>
                        <p className="text-[10px] text-text-muted line-through">{hazard.score}%</p>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-text-primary">{hazard.score}%</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── 4. Risiko nach Szenario ───────────────────────── */}
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-bold text-text-primary">Risiko nach Szenario</h2>

        {scenarioRisks.length === 0 && natureHazards.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-12 text-center">
            <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-secondary">
              Noch keine Risikoanalyse vorhanden. Klicken Sie auf &quot;Neu analysieren&quot; oder warten Sie auf die nächste automatische Analyse.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scenarioRisks.map((risk) => {
              const corr = correlationMap.get(risk.id)
              const isWarned = corr?.hasActiveWarnings
              const displayScore = isWarned ? corr.adjustedScore : risk.score
              const barColor = isWarned
                ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                : (levelColor[(risk.level || 'mittel') as keyof typeof levelColor] || 'bg-amber-500')
              return (
                <div key={risk.id} className={`rounded-2xl border p-5 transition-shadow hover:shadow-md ${isWarned ? 'border-orange-200 bg-orange-50/30' : 'border-border bg-white'}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isWarned ? (
                        <Zap className="h-4 w-4 text-orange-500" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-text-muted" />
                      )}
                      <h3 className="text-sm font-bold text-text-primary">{risk.type}</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isWarned && (
                        <span className="flex items-center gap-0.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
                          +{corr.scoreBoost}
                        </span>
                      )}
                      {risk.level && (
                        <Badge variant={levelVariant[risk.level as keyof typeof levelVariant]}>
                          {levelLabel[risk.level] || risk.level}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isWarned && corr.matchedWarnings.length > 0 ? (
                    <p className="mb-3 text-xs font-medium text-orange-600 line-clamp-2">
                      {corr.matchedWarnings.map(w => w.title).join(' · ')}
                    </p>
                  ) : risk.description ? (
                    <p className="mb-3 text-xs text-text-muted line-clamp-2">{risk.description}</p>
                  ) : null}
                  <div className="mb-1 h-2 overflow-hidden rounded-full bg-surface-secondary">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-500`}
                      style={{ width: `${displayScore}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    {isWarned && (
                      <span className="text-[10px] text-text-muted line-through">{risk.score}%</span>
                    )}
                    <p className={`text-xs font-bold ${isWarned ? 'text-orange-700' : 'text-text-muted'}`}>{displayScore}%</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

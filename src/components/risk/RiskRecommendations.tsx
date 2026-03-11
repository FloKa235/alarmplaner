/**
 * RiskRecommendations — Handlungsempfehlungen pro Risiko-Level
 *
 * Zeigt für jede Risikokategorie konkrete, priorisierte Maßnahmen an.
 * Sofort-Maßnahmen werden prominent hervorgehoben.
 * Ausklappbar: Standardmäßig werden nur Top-Risiken (score ≥ 50) aufgeklappt.
 */
import { useState, useMemo } from 'react'
import {
  ClipboardCheck, ChevronDown, ChevronRight,
  AlertCircle, Clock, CalendarClock, Shield,
} from 'lucide-react'
import Badge from '@/components/ui/Badge'
import {
  getRecommendations,
  PRIORITY_CONFIG,
  type Recommendation,
  type RecommendationPriority,
} from '@/data/risk-recommendations'
import type { DbRiskEntry } from '@/types/database'

interface RiskRecommendationsProps {
  riskEntries: DbRiskEntry[]
  /** Optionale angepasste Scores (z.B. durch Warnung-Korrelation) */
  adjustedScores?: Map<string, number>
}

const PRIORITY_ICON: Record<RecommendationPriority, typeof AlertCircle> = {
  sofort: AlertCircle,
  kurzfristig: Clock,
  mittelfristig: CalendarClock,
  langfristig: Shield,
}

const levelVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  niedrig: 'success',
  mittel: 'warning',
  erhöht: 'warning',
  hoch: 'danger',
  extrem: 'danger',
}

export default function RiskRecommendations({
  riskEntries,
  adjustedScores,
}: RiskRecommendationsProps) {
  // Standardmäßig aufgeklappt: alle mit Score ≥ 50
  const defaultOpen = useMemo(() => {
    const ids = new Set<string>()
    riskEntries.forEach(e => {
      const adjScore = adjustedScores?.get(e.id) ?? e.score
      if (adjScore >= 50) ids.add(e.id)
    })
    return ids
  }, [riskEntries, adjustedScores])

  const [openIds, setOpenIds] = useState<Set<string>>(defaultOpen)

  const toggle = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Sortiert nach Score (höchstes zuerst)
  const sorted = useMemo(
    () =>
      [...riskEntries].sort((a, b) => {
        const aScore = adjustedScores?.get(a.id) ?? a.score
        const bScore = adjustedScores?.get(b.id) ?? b.score
        return bScore - aScore
      }),
    [riskEntries, adjustedScores]
  )

  if (riskEntries.length === 0) return null

  // Zähle gesamt "sofort"-Maßnahmen
  const sofortCount = sorted.reduce((acc, entry) => {
    const recs = getRecommendations(entry.type, adjustedScores?.get(entry.id) ?? entry.score)
    return acc + recs.filter(r => r.priority === 'sofort').length
  }, 0)

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-bold text-text-primary">Handlungsempfehlungen</h2>
        </div>
        {sofortCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
            <AlertCircle className="h-3 w-3" />
            {sofortCount} Sofortmaßnahme{sofortCount > 1 ? 'n' : ''}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {sorted.map(entry => {
          const effectiveScore = adjustedScores?.get(entry.id) ?? entry.score
          const recs = getRecommendations(entry.type, effectiveScore)
          const isOpen = openIds.has(entry.id)
          const sofortRecs = recs.filter(r => r.priority === 'sofort')
          const otherRecs = recs.filter(r => r.priority !== 'sofort')

          return (
            <div key={entry.id} className="rounded-xl border border-border overflow-hidden">
              {/* Header — klickbar */}
              <button
                onClick={() => toggle(entry.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-secondary/50"
              >
                {isOpen
                  ? <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
                  : <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
                }
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary truncate">
                    {entry.type}
                  </span>
                  {entry.level && (
                    <Badge variant={levelVariant[entry.level] || 'warning'}>
                      {entry.level.charAt(0).toUpperCase() + entry.level.slice(1)}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-text-muted">{recs.length} Maßnahmen</span>
                  {sofortRecs.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {sofortRecs.length}
                    </span>
                  )}
                </div>
              </button>

              {/* Inhalt — aufklappbar */}
              {isOpen && (
                <div className="border-t border-border bg-surface-secondary/20 px-4 py-3">
                  {/* Sofort-Maßnahmen prominent */}
                  {sofortRecs.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
                        Sofortmaßnahmen
                      </p>
                      <div className="space-y-1.5">
                        {sofortRecs.map((rec, idx) => (
                          <RecItem key={idx} rec={rec} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weitere Maßnahmen */}
                  {otherRecs.length > 0 && (
                    <div>
                      {sofortRecs.length > 0 && (
                        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                          Weitere Maßnahmen
                        </p>
                      )}
                      <div className="space-y-1.5">
                        {otherRecs.map((rec, idx) => (
                          <RecItem key={idx} rec={rec} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Einzelne Empfehlungs-Zeile */
function RecItem({ rec }: { rec: Recommendation }) {
  const config = PRIORITY_CONFIG[rec.priority]
  const Icon = PRIORITY_ICON[rec.priority]

  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 ${config.bg} ${config.border}`}>
      <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${config.text}`} />
      <span className="text-xs text-text-primary leading-relaxed">{rec.text}</span>
      <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    </div>
  )
}

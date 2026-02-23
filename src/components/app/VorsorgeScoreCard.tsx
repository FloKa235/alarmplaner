/**
 * VorsorgeScoreCard — Score-Ring + Breakdown + Badges
 *
 * Zeigt den Vorsorge-Score als großen Ring mit Score-Zahl,
 * nächstes Ziel, aufklappbare 4-Zeilen Breakdown, und erreichte Badges.
 */
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import CircularProgress from '@/components/app/CircularProgress'
import { useVorsorgeScore, type ScoreComponent } from '@/hooks/useVorsorgeScore'
import BadgeModal from '@/components/app/BadgeModal'

const SCORE_COLORS: Record<string, string> = {
  red: 'var(--color-red-500)',
  amber: 'var(--color-amber-500)',
  blue: 'var(--color-primary-600)',
  green: 'var(--color-green-500)',
  purple: 'var(--color-purple-500)',
}

const BAR_COLORS: Record<string, string> = {
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  blue: 'bg-primary-600',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
}

export default function VorsorgeScoreCard() {
  const {
    total, percentile, color, breakdown, badges, nextBadge,
    newBadgeUnlocked, dismissNewBadge, loading,
  } = useVorsorgeScore()

  const [showBreakdown, setShowBreakdown] = useState(false)

  if (loading) return null

  const ringColor = SCORE_COLORS[color] || SCORE_COLORS.red

  return (
    <>
      {/* Badge Celebration Modal */}
      {newBadgeUnlocked && (
        <BadgeModal badge={newBadgeUnlocked} onClose={dismissNewBadge} />
      )}

      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          {/* Score Ring */}
          <CircularProgress
            value={total}
            max={100}
            size={140}
            strokeWidth={10}
            color={ringColor}
            className="shrink-0"
          >
            <span className="text-3xl font-bold text-text-primary">{total}</span>
            <span className="text-[11px] text-text-muted">von 100</span>
          </CircularProgress>

          {/* Right side */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-bold text-text-primary">Dein Vorsorge-Score</h2>
            <p className="mt-0.5 text-sm text-text-secondary">
              {total >= 100
                ? 'Perfekt vorbereitet!'
                : total >= 75
                  ? 'Fast komplett \u2014 nur noch wenig fehlt.'
                  : total >= 50
                    ? 'Gute Fortschritte \u2014 weiter so!'
                    : total >= 25
                      ? 'Ein guter Anfang ist gemacht.'
                      : 'Starte mit deiner Vorsorge!'}
            </p>

            {/* Percentile Comparison */}
            {total > 0 && (
              <p className="mt-1 text-xs text-text-muted">
                Besser vorbereitet als <span className="font-semibold text-text-secondary">{percentile}%</span> der Haushalte
              </p>
            )}

            {/* Next Badge Preview */}
            {nextBadge && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-surface-secondary px-4 py-2">
                <span className="text-lg">{nextBadge.emoji}</span>
                <div>
                  <p className="text-xs font-semibold text-text-primary">{nextBadge.name}</p>
                  <p className="text-[11px] text-text-muted">
                    Noch {nextBadge.threshold - total} Punkt{nextBadge.threshold - total !== 1 ? 'e' : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Earned Badges */}
            {badges.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-text-muted">Erreicht:</span>
                {badges.map(b => (
                  <span
                    key={b.id}
                    className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-primary"
                    title={b.description}
                  >
                    {b.emoji} {b.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Breakdown Toggle */}
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
        >
          {showBreakdown ? 'Weniger anzeigen' : 'Details anzeigen'}
          {showBreakdown ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {/* Breakdown Rows */}
        {showBreakdown && (
          <div className="mt-2 space-y-3">
            <BreakdownRow label="Inventar" component={breakdown.inventar} color={color} />
            <BreakdownRow label="Notfallplan" component={breakdown.notfallplan} color={color} />
            <BreakdownRow label="Wissen" component={breakdown.wissen} color={color} />
            <BreakdownRow label="Aktualität" component={breakdown.aktualitaet} color={color} />
          </div>
        )}
      </div>
    </>
  )
}

// ─── Breakdown Row ───────────────────────────────────────

function BreakdownRow({
  label,
  component,
  color,
}: {
  label: string
  component: ScoreComponent
  color: string
}) {
  const percent = component.max > 0 ? (component.score / component.max) * 100 : 0
  const barColor = BAR_COLORS[color] || BAR_COLORS.blue

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-text-primary">{label}</span>
        <span className="text-xs tabular-nums text-text-muted">{component.score}/{component.max}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-secondary">
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-500`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <p className="mt-0.5 text-[11px] text-text-muted">{component.detail}</p>
    </div>
  )
}

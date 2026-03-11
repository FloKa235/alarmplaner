/**
 * RiskTrendChart — Risiko-Score-Verlauf über Zeit (30/90 Tage)
 *
 * Zeigt Gesamt-Score als Linienchart mit farbcodierten Bereichen:
 * - Grün (0-30): Niedrig
 * - Amber (30-50): Mittel
 * - Orange (50-70): Erhöht
 * - Rot (70-100): Hoch/Extrem
 */
import { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'
import type { DbRiskProfile } from '@/types/database'

interface RiskTrendChartProps {
  profiles: DbRiskProfile[]
  currentScore: number
}

type TimeRange = '7d' | '30d' | '90d'

export default function RiskTrendChart({ profiles, currentScore }: RiskTrendChartProps) {
  const [range, setRange] = useState<TimeRange>('30d')

  const { chartData, trendDelta, minScore, maxScore, avgScore } = useMemo(() => {
    const now = new Date()
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    const filtered = profiles
      .filter(p => new Date(p.generated_at) >= cutoff)
      .sort((a, b) => new Date(a.generated_at).getTime() - new Date(b.generated_at).getTime())

    const data = filtered.map(p => ({
      date: new Date(p.generated_at).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
      }),
      dateTime: p.generated_at,
      score: p.risk_score,
    }))

    // Trend: Vergleich erster vs. letzter Datenpunkt
    let delta = 0
    if (data.length >= 2) {
      delta = data[data.length - 1].score - data[0].score
    }

    const scores = data.map(d => d.score)
    const min = scores.length > 0 ? Math.min(...scores) : 0
    const max = scores.length > 0 ? Math.max(...scores) : 100
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

    return {
      chartData: data,
      trendDelta: delta,
      minScore: min,
      maxScore: max,
      avgScore: avg,
    }
  }, [profiles, range])

  if (profiles.length < 2) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-3 text-lg font-bold text-text-primary">Risiko-Verlauf</h2>
        <div className="flex items-center justify-center py-8 text-sm text-text-muted">
          <Calendar className="mr-2 h-4 w-4" />
          Trend-Daten werden nach der nächsten Analyse verfügbar (2× täglich).
        </div>
      </div>
    )
  }

  const TrendIcon = trendDelta > 3 ? TrendingUp : trendDelta < -3 ? TrendingDown : Minus
  const trendColor = trendDelta > 3 ? 'text-red-600' : trendDelta < -3 ? 'text-green-600' : 'text-text-muted'
  const trendBg = trendDelta > 3 ? 'bg-red-50' : trendDelta < -3 ? 'bg-green-50' : 'bg-surface-secondary'

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-text-primary">Risiko-Verlauf</h2>
          <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${trendBg} ${trendColor}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            {trendDelta > 0 ? '+' : ''}{trendDelta}
          </div>
        </div>

        {/* Range Selector */}
        <div className="flex rounded-xl border border-border bg-surface-secondary p-0.5">
          {(['7d', '30d', '90d'] as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                range === r
                  ? 'bg-white text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {r === '7d' ? '7 Tage' : r === '30d' ? '30 Tage' : '90 Tage'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-surface-secondary px-3 py-2 text-center">
          <p className="text-lg font-bold text-text-primary">{currentScore}</p>
          <p className="text-[10px] text-text-muted">Aktuell</p>
        </div>
        <div className="rounded-xl bg-surface-secondary px-3 py-2 text-center">
          <p className="text-lg font-bold text-text-primary">{avgScore}</p>
          <p className="text-[10px] text-text-muted">Durchschnitt</p>
        </div>
        <div className="rounded-xl bg-surface-secondary px-3 py-2 text-center">
          <p className="text-lg font-bold text-text-primary">{minScore}–{maxScore}</p>
          <p className="text-[10px] text-text-muted">Min–Max</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />

            {/* Farbige Referenzbereiche */}
            <ReferenceArea y1={0} y2={30} fill="#22c55e" fillOpacity={0.05} />
            <ReferenceArea y1={30} y2={50} fill="#f59e0b" fillOpacity={0.05} />
            <ReferenceArea y1={50} y2={70} fill="#f97316" fillOpacity={0.05} />
            <ReferenceArea y1={70} y2={100} fill="#ef4444" fillOpacity={0.08} />

            {/* Schwellenwert-Linien */}
            <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.4} />
            <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.4} />
            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.4} />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              ticks={[0, 30, 50, 70, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: 'none',
                borderRadius: '12px',
                padding: '8px 12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
              labelStyle={{ color: '#94a3b8', fontSize: 11 }}
              itemStyle={{ color: '#fff', fontSize: 13, fontWeight: 700 }}
              formatter={(value) => [`${value}%`, 'Risiko-Score']}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#f97316"
              strokeWidth={2.5}
              fill="url(#riskGradient)"
              dot={{ r: 3, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 5, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-text-muted">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Niedrig (0–30)</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Mittel (30–50)</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" /> Erhöht (50–70)</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Hoch (70+)</span>
      </div>
    </div>
  )
}

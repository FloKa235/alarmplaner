/**
 * GemeindeRiskMap — Gemeinde-Risiko-Heatmap mit Top-5-Ranking
 *
 * Zeigt Gemeinden als farbcodierte Marker auf der Karte.
 * Farbe basiert auf risk_score (grün → amber → orange → rot).
 * Marker-Größe skaliert mit Bevölkerung.
 * Rechts daneben: Top-5 gefährdete Gemeinden als Ranking-Liste.
 */
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, TrendingUp, ExternalLink } from 'lucide-react'
import MapView, { type MapMarker } from '@/components/ui/MapView'
import Badge from '@/components/ui/Badge'
import { useDistrict } from '@/hooks/useDistrict'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import type { DbMunicipality } from '@/types/database'

// Risiko-Score → Farbe (5 Stufen)
function riskColor(score: number): string {
  if (score >= 70) return '#dc2626' // rot
  if (score >= 50) return '#ea580c' // orange
  if (score >= 35) return '#d97706' // amber
  if (score >= 15) return '#65a30d' // lime
  return '#16a34a' // grün
}

function riskLevel(score: number): { label: string; variant: 'success' | 'warning' | 'danger' } {
  if (score >= 70) return { label: 'Hoch', variant: 'danger' }
  if (score >= 50) return { label: 'Erhöht', variant: 'warning' }
  if (score >= 35) return { label: 'Mittel', variant: 'warning' }
  return { label: 'Niedrig', variant: 'success' }
}

export default function GemeindeRiskMap() {
  const navigate = useNavigate()
  const { district, districtId } = useDistrict()

  const { data: gemeinden, loading } = useSupabaseQuery<DbMunicipality>(
    (sb) =>
      sb.from('municipalities')
        .select('*')
        .eq('district_id', districtId!)
        .order('risk_score', { ascending: false }),
    [districtId]
  )

  // Map-Marker
  const markers: MapMarker[] = useMemo(() =>
    gemeinden
      .filter(g => g.latitude && g.longitude)
      .map(g => ({
        id: g.id,
        lng: g.longitude,
        lat: g.latitude,
        label: g.name,
        color: riskColor(g.risk_score),
        popup: `<div style="font-family:system-ui;min-width:180px">
          <strong style="font-size:13px">${g.name}</strong>
          <div style="margin-top:4px;display:flex;gap:8px;font-size:11px;color:#6b7280">
            <span>Score: <strong style="color:${riskColor(g.risk_score)}">${g.risk_score}/100</strong></span>
            <span>${g.population.toLocaleString('de-DE')} Einw.</span>
          </div>
        </div>`,
      })),
    [gemeinden]
  )

  // Top 5 gefährdete Gemeinden
  const top5 = useMemo(() =>
    gemeinden
      .filter(g => g.risk_score > 0)
      .slice(0, 5),
    [gemeinden]
  )

  // Statistiken
  const stats = useMemo(() => {
    const withScore = gemeinden.filter(g => g.risk_score > 0)
    if (withScore.length === 0) return null
    const scores = withScore.map(g => g.risk_score)
    return {
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      high: withScore.filter(g => g.risk_score >= 60).length,
      total: gemeinden.length,
      withData: withScore.length,
    }
  }, [gemeinden])

  if (loading || gemeinden.length === 0) return null

  const center: [number, number] = district?.longitude && district?.latitude
    ? [district.longitude, district.latitude]
    : [11.5, 51.75]

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-text-primary">Gemeinde-Risiko-Heatmap</h2>
          {stats && (
            <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-text-muted">
              {stats.withData} von {stats.total} bewertet
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/pro/gemeinden')}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Alle Gemeinden
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Karte — 2 Spalten */}
        <div className="lg:col-span-2">
          <MapView
            markers={markers}
            center={center}
            zoom={9}
            height="320px"
            showControls
            fallbackTitle="Gemeinde-Risikokarte"
            fallbackDescription="Mapbox-Token erforderlich für die Kartenansicht"
          />
          {/* Legende */}
          <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-text-muted">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#16a34a' }} /> Niedrig (&lt;15)</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#65a30d' }} /> Gering (15–34)</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#d97706' }} /> Mittel (35–49)</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#ea580c' }} /> Erhöht (50–69)</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#dc2626' }} /> Hoch (70+)</span>
          </div>
        </div>

        {/* Top 5 Ranking — 1 Spalte */}
        <div>
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-text-primary">
            <TrendingUp className="h-4 w-4 text-red-500" />
            Top 5 gefährdete Gemeinden
          </h3>

          {top5.length === 0 ? (
            <p className="text-xs text-text-muted">Noch keine Risiko-Daten für Gemeinden vorhanden.</p>
          ) : (
            <div className="space-y-2">
              {top5.map((g, idx) => {
                const risk = riskLevel(g.risk_score)
                return (
                  <button
                    key={g.id}
                    onClick={() => navigate(`/pro/gemeinden/${g.id}`)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-all hover:border-primary-200 hover:shadow-sm"
                  >
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: riskColor(g.risk_score) }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{g.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-text-muted">
                        <span className="flex items-center gap-0.5">
                          <Users className="h-2.5 w-2.5" />
                          {g.population > 0 ? g.population.toLocaleString('de-DE') : '–'}
                        </span>
                        <span>{g.area_km2 > 0 ? `${Number(g.area_km2).toFixed(0)} km²` : ''}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold" style={{ color: riskColor(g.risk_score) }}>
                        {g.risk_score}
                      </p>
                      <Badge variant={risk.variant}>
                        {risk.label}
                      </Badge>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Durchschnitt */}
          {stats && (
            <div className="mt-3 rounded-xl bg-surface-secondary p-3 text-center">
              <p className="text-xs text-text-muted">Durchschnittlicher Risiko-Score</p>
              <p className="text-xl font-bold" style={{ color: riskColor(stats.avg) }}>{stats.avg}</p>
              {stats.high > 0 && (
                <p className="text-[10px] text-red-600 font-medium">
                  {stats.high} Gemeinde{stats.high > 1 ? 'n' : ''} mit hohem Risiko
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

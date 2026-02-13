import { Building2, Search, MapPin, Users, ShieldAlert, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import MapView, { type MapMarker } from '@/components/ui/MapView'
import { useDistrict } from '@/hooks/useDistrict'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import type { DbMunicipality } from '@/types/database'

const levelVariant = {
  niedrig: 'success' as const,
  mittel: 'warning' as const,
  erhöht: 'warning' as const,
  hoch: 'danger' as const,
  extrem: 'danger' as const,
}

export default function GemeindenPage() {
  const { districtId, loading: districtLoading } = useDistrict()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: gemeinden, loading } = useSupabaseQuery<DbMunicipality>(
    (sb) =>
      sb
        .from('municipalities')
        .select('*')
        .eq('district_id', districtId!)
        .order('name'),
    [districtId]
  )

  if (districtLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const filtered = searchQuery
    ? gemeinden.filter((g) =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : gemeinden

  const gemeindenMarkers: MapMarker[] = gemeinden.map((g) => ({
    id: g.id,
    lng: g.longitude,
    lat: g.latitude,
    label: g.name,
    color: g.risk_score >= 60 ? '#ef4444' : g.risk_score >= 35 ? '#f59e0b' : '#22c55e',
    popup: `<strong>${g.name}</strong><br/>Risiko-Score: ${g.risk_score}/100<br/>${g.population.toLocaleString('de-DE')} Einwohner`,
  }))

  return (
    <div>
      <PageHeader
        title="Gemeinden"
        description="Übersicht aller Gemeinden im Landkreis mit Risikobewertung."
      />

      {/* Map */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-white">
        <MapView
          height="300px"
          markers={gemeindenMarkers}
          fallbackTitle="Gemeinde-Karte"
          fallbackDescription="Interaktive Karte aller Gemeinden mit Risikobewertung."
          showControls
        />
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Gemeinde suchen..."
          className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        />
      </div>

      {/* Gemeinde cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center">
          <Building2 className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">Keine Gemeinden gefunden.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => (
            <Link
              key={g.id}
              to={`/pro/gemeinden/${g.id}`}
              className="rounded-2xl border border-border bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary-600" />
                  <h3 className="font-bold text-text-primary">{g.name}</h3>
                </div>
                {g.risk_level && (
                  <Badge variant={levelVariant[g.risk_level as keyof typeof levelVariant]}>
                    {g.risk_level}
                  </Badge>
                )}
              </div>

              <div className="mb-3 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-text-muted">
                    <Users className="h-3 w-3" />
                  </div>
                  <p className="text-sm font-bold text-text-primary">{g.population.toLocaleString('de-DE')}</p>
                  <p className="text-[10px] text-text-muted">Einwohner</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-text-muted">
                    <MapPin className="h-3 w-3" />
                  </div>
                  <p className="text-sm font-bold text-text-primary">{Number(g.area_km2)} km&sup2;</p>
                  <p className="text-[10px] text-text-muted">Fläche</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-text-muted">
                    <ShieldAlert className="h-3 w-3" />
                  </div>
                  <p className="text-sm font-bold text-text-primary">{g.risk_score}</p>
                  <p className="text-[10px] text-text-muted">Risiko</p>
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
                <div
                  className={`h-full rounded-full ${
                    g.risk_score >= 60 ? 'bg-red-500' : g.risk_score >= 35 ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${g.risk_score}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

import { Users, MapPin, Landmark, Package, AlertTriangle, Clock, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import MapView, { type MapMarker } from '@/components/ui/MapView'
import Badge from '@/components/ui/Badge'
import { useMembership } from '@/hooks/useMembership'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { categoryMeta } from '@/data/sector-config'
import type { DbInventoryItem, DbKritisSite, DbIncidentReport, DbExternalWarning } from '@/types/database'

export default function GemeindeDashboard() {
  const { municipality, municipalityId, districtId } = useMembership()

  // Daten laden
  const { data: inventar } = useSupabaseQuery<DbInventoryItem>(
    (sb) => sb.from('inventory_items').select('*').eq('district_id', districtId!).eq('municipality_id', municipalityId!),
    [districtId, municipalityId]
  )

  const { data: kritisSites } = useSupabaseQuery<DbKritisSite>(
    (sb) => sb.from('kritis_sites').select('*').eq('district_id', districtId!).eq('municipality_id', municipalityId!),
    [districtId, municipalityId]
  )

  const { data: meldungen } = useSupabaseQuery<DbIncidentReport>(
    (sb) => sb.from('incident_reports').select('*').eq('municipality_id', municipalityId!).order('created_at', { ascending: false }),
    [municipalityId]
  )

  const { data: warnungen } = useSupabaseQuery<DbExternalWarning>(
    (sb) => sb.from('external_warnings').select('*').eq('district_id', districtId!).order('created_at', { ascending: false }).limit(5),
    [districtId]
  )

  // Berechnungen
  const inventarAbdeckung = useMemo(() => {
    if (inventar.length === 0) return 0
    return Math.round(
      inventar.reduce((sum, i) => sum + Math.min(100, (i.current_quantity / Math.max(1, i.target_quantity)) * 100), 0) / inventar.length
    )
  }, [inventar])

  const aktiveWarnungen = useMemo(
    () => warnungen.filter(w => !w.expires_at || new Date(w.expires_at) > new Date()),
    [warnungen]
  )

  // Karten-Marker für KRITIS
  const markers: MapMarker[] = useMemo(
    () =>
      kritisSites
        .filter(site => site.latitude && site.longitude)
        .map(site => ({
          id: site.id,
          lng: site.longitude,
          lat: site.latitude,
          label: site.name,
          color: categoryMeta[site.category]?.markerColor || '#6b7280',
          popup: `<div style="font-family:'Plus Jakarta Sans',sans-serif">
            <strong style="font-size:13px">${site.name}</strong>
            <div style="margin:4px 0;font-size:11px;color:#64748b">${categoryMeta[site.category]?.label || site.category}</div>
            <div style="font-size:11px;color:#64748b">Risiko: ${site.risk_exposure || 'k.A.'}</div>
          </div>`,
        })),
    [kritisSites]
  )

  const severityColor = (s: string) =>
    s === 'extreme' || s === 'severe' ? 'bg-red-100 text-red-700' :
    s === 'moderate' ? 'bg-amber-100 text-amber-700' :
    'bg-blue-100 text-blue-700'

  const severityLabel = (s: string) =>
    s === 'extreme' ? 'Extrem' : s === 'severe' ? 'Schwer' : s === 'moderate' ? 'Mäßig' : 'Gering'

  const sourceLabel = (s: string) =>
    s === 'nina' ? 'NINA' : s === 'dwd' ? 'DWD' : s === 'pegel' ? 'Pegel' : s

  return (
    <div>
      <PageHeader
        title={`Dashboard – ${municipality?.name || 'Gemeinde'}`}
        description="Übersicht über Ihre Gemeinde im Krisenmanagement-System."
      />

      {/* KPI-Kacheln */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Einwohner"
          value={municipality?.population ? municipality.population.toLocaleString('de-DE') : '–'}
        />
        <StatCard
          icon={<MapPin className="h-5 w-5" />}
          label="Fläche"
          value={municipality?.area_km2 ? `${Number(municipality.area_km2)} km²` : '–'}
        />
        <StatCard
          icon={<Landmark className="h-5 w-5" />}
          label="KRITIS-Standorte"
          value={kritisSites.length}
        />
        <StatCard
          icon={<Package className="h-5 w-5" />}
          label="Inventar-Abdeckung"
          value={`${inventarAbdeckung}%`}
          trend={inventarAbdeckung >= 80
            ? { value: 'Gut', positive: true }
            : inventarAbdeckung >= 50
              ? { value: 'Niedrig', positive: false }
              : inventarAbdeckung > 0
                ? { value: 'Kritisch', positive: false }
                : undefined
          }
        />
      </div>

      {/* Karte mit KRITIS-Punkten */}
      <div className="mb-6 rounded-2xl border border-border bg-white p-4">
        <h2 className="mb-3 text-lg font-bold text-text-primary">Kritische Infrastruktur</h2>
        <MapView
          markers={markers}
          center={
            municipality?.longitude && municipality?.latitude
              ? [municipality.longitude, municipality.latitude]
              : undefined
          }
          zoom={13}
          height="400px"
          className="rounded-xl"
          fallbackTitle="Karte"
          fallbackDescription="Kartenansicht der KRITIS-Infrastruktur Ihrer Gemeinde."
        />
        {kritisSites.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-text-muted">{kritisSites.length} Standorte</span>
            <span className="text-xs text-text-muted">·</span>
            <Link to="/gemeinde/kritis" className="text-xs font-medium text-primary-600 hover:text-primary-700">
              Alle anzeigen →
            </Link>
          </div>
        )}
      </div>

      {/* Unterer Bereich: Warnungen + Meldungen */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Aktuelle Warnungen */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Aktuelle Warnungen
            </h2>
            {aktiveWarnungen.length > 0 && (
              <Badge variant="warning">{aktiveWarnungen.length}</Badge>
            )}
          </div>

          {aktiveWarnungen.length === 0 ? (
            <div className="rounded-xl bg-green-50 p-4 text-center">
              <p className="text-sm font-medium text-green-700">Keine aktiven Warnungen</p>
              <p className="mt-0.5 text-xs text-green-600">Ihr Landkreis hat derzeit keine Warnmeldungen.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {aktiveWarnungen.slice(0, 4).map(w => (
                <div key={w.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary line-clamp-1">{w.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${severityColor(w.severity)}`}>
                          {severityLabel(w.severity)}
                        </span>
                        <span className="text-[10px] text-text-muted">{sourceLabel(w.source)}</span>
                        <span className="text-[10px] text-text-muted">
                          {new Date(w.effective_at).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Offene Meldungen */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
              <Clock className="h-5 w-5 text-blue-500" />
              Meldungen
            </h2>
            <Link to="/gemeinde/notfall" className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
              Alle anzeigen <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {meldungen.length === 0 ? (
            <div className="rounded-xl bg-surface-secondary p-4 text-center">
              <p className="text-sm text-text-secondary">Noch keine Meldungen abgesetzt.</p>
              <Link to="/gemeinde/notfall" className="mt-2 inline-block text-xs font-medium text-primary-600 hover:text-primary-700">
                Notfall melden →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {meldungen.slice(0, 5).map(m => (
                <div key={m.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary line-clamp-1">{m.title}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {new Date(m.created_at).toLocaleDateString('de-DE')} · {m.severity}
                    </p>
                  </div>
                  <span className={`ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    m.status === 'offen' ? 'bg-red-100 text-red-700' :
                    m.status === 'in_bearbeitung' ? 'bg-amber-100 text-amber-700' :
                    m.status === 'erledigt' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {m.status === 'offen' ? 'Offen' :
                     m.status === 'in_bearbeitung' ? 'In Bearbeitung' :
                     m.status === 'erledigt' ? 'Erledigt' : 'Abgelehnt'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

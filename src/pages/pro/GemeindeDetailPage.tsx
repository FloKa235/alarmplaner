import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Building2, Users, MapPin, ShieldAlert, Flame, Loader2,
  ChevronDown, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import MapView, { type MapMarker } from '@/components/ui/MapView'
import { useDistrict } from '@/hooks/useDistrict'
import { useSupabaseSingle, useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { SECTOR_CONFIG, categoryMeta, getSector } from '@/data/sector-config'
import type { DbMunicipality, DbKritisSite, DbScenario } from '@/types/database'

export default function GemeindeDetailPage() {
  const { id } = useParams()
  const { districtId, loading: districtLoading } = useDistrict()
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set())

  const { data: municipality, loading: municipalityLoading } = useSupabaseSingle<DbMunicipality>(
    (sb) =>
      sb
        .from('municipalities')
        .select('*')
        .eq('id', id!)
        .single(),
    [id]
  )

  const { data: kritisSites, loading: kritisLoading } = useSupabaseQuery<DbKritisSite>(
    (sb) =>
      sb
        .from('kritis_sites')
        .select('*')
        .eq('municipality_id', id!),
    [id]
  )

  const { data: scenarios } = useSupabaseQuery<DbScenario>(
    (sb) =>
      sb
        .from('scenarios')
        .select('*')
        .eq('district_id', districtId!)
        .order('severity', { ascending: false })
        .limit(3),
    [districtId]
  )

  if (districtLoading || municipalityLoading || kritisLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!municipality) {
    return (
      <div className="rounded-2xl border border-border bg-white p-12 text-center">
        <Building2 className="mx-auto mb-3 h-8 w-8 text-text-muted" />
        <p className="text-sm text-text-secondary">Gemeinde nicht gefunden.</p>
        <Link to="/pro/gemeinden" className="mt-3 inline-block text-sm text-primary-600 hover:text-primary-700">
          Zurück zu Gemeinden
        </Link>
      </div>
    )
  }

  // Sektor-Gruppierung
  const sectorGroups: Record<string, DbKritisSite[]> = {}
  for (const site of kritisSites) {
    const sec = getSector(site)
    if (!sectorGroups[sec]) sectorGroups[sec] = []
    sectorGroups[sec].push(site)
  }
  const sortedSectors = SECTOR_CONFIG.filter((s) => sectorGroups[s.key])

  const toggleSector = (key: string) => {
    setExpandedSectors((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Karten-Marker
  const markers: MapMarker[] = kritisSites.map((site) => ({
    id: site.id,
    lng: site.longitude,
    lat: site.latitude,
    label: site.name,
    color: categoryMeta[site.category]?.markerColor || '#6b7280',
    popup: `<strong>${site.name}</strong><br/>${categoryMeta[site.category]?.label || site.category}<br/>Risiko: ${site.risk_exposure || 'k.A.'}`,
  }))

  // Risiko-Zusammenfassung
  const riskCounts = { hoch: 0, mittel: 0, niedrig: 0 }
  for (const s of kritisSites) {
    const r = (s.risk_exposure || 'mittel') as keyof typeof riskCounts
    if (r in riskCounts) riskCounts[r]++
  }

  return (
    <div>
      <Link
        to="/pro/gemeinden"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Gemeinden
      </Link>

      <PageHeader
        title={municipality.name}
        description="Detailansicht der Gemeinde mit KRITIS-Infrastruktur nach BBK-Sektoren."
        badge={`Gemeinde`}
      />

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Einwohner" value={municipality.population.toLocaleString('de-DE')} />
        <StatCard icon={<MapPin className="h-5 w-5" />} label="Fläche" value={`${Number(municipality.area_km2)} km²`} />
        <StatCard
          icon={<ShieldAlert className="h-5 w-5" />}
          label="Risiko-Score"
          value={`${municipality.risk_score}/100`}
          trend={{ value: municipality.risk_level || '', positive: municipality.risk_score < 40 }}
        />
        <StatCard icon={<Building2 className="h-5 w-5" />} label="KRITIS-Objekte" value={kritisSites.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* KRITIS nach Sektoren */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
              <ShieldAlert className="h-5 w-5 text-primary-600" />
              KRITIS nach Sektoren
            </h2>
            {kritisSites.length > 0 && (
              <div className="flex gap-1.5">
                {riskCounts.hoch > 0 && <Badge variant="danger">{riskCounts.hoch} hoch</Badge>}
                {riskCounts.mittel > 0 && <Badge variant="warning">{riskCounts.mittel} mittel</Badge>}
                {riskCounts.niedrig > 0 && <Badge variant="success">{riskCounts.niedrig} niedrig</Badge>}
              </div>
            )}
          </div>

          {kritisSites.length === 0 ? (
            <p className="text-sm text-text-muted">Keine KRITIS-Objekte in dieser Gemeinde.</p>
          ) : (
            <div className="space-y-2">
              {sortedSectors.map((sec) => {
                const Icon = sec.icon
                const sites = sectorGroups[sec.key]
                const isExpanded = expandedSectors.has(sec.key)
                return (
                  <div key={sec.key} className="overflow-hidden rounded-xl border border-border">
                    <button
                      onClick={() => toggleSector(sec.key)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-secondary ${sec.bg}`}
                    >
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ${sec.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="flex-1 text-sm font-semibold text-text-primary">{sec.label}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-text-secondary shadow-sm">
                        {sites.length}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-text-muted" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-text-muted" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="divide-y divide-border bg-white">
                        {sites.map((site) => (
                          <div key={site.id} className="flex items-center justify-between px-4 py-2.5">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-text-primary">{site.name}</p>
                              <p className="text-xs text-text-muted">{categoryMeta[site.category]?.label || site.category}</p>
                            </div>
                            {site.risk_exposure && (
                              <Badge
                                variant={
                                  site.risk_exposure === 'hoch' ? 'danger' :
                                  site.risk_exposure === 'mittel' ? 'warning' : 'success'
                                }
                              >
                                {site.risk_exposure}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Szenarien + Sektor-Übersicht */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-text-primary">
              <Flame className="h-5 w-5 text-accent-500" />
              Aktive Szenarien
            </h2>
            <div className="space-y-3">
              {scenarios.length === 0 ? (
                <p className="text-sm text-text-muted">Keine Szenarien vorhanden.</p>
              ) : (
                scenarios.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl bg-surface-secondary p-3">
                    <span className="text-sm font-medium text-text-primary">{s.title}</span>
                    <Badge variant={s.severity >= 70 ? 'danger' : 'warning'}>{s.severity}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sektor-Zusammenfassung */}
          {kritisSites.length > 0 && (
            <div className="rounded-2xl border border-border bg-white p-6">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-text-primary">
                <Building2 className="h-5 w-5 text-primary-600" />
                Sektor-Übersicht
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {sortedSectors.map((sec) => {
                  const Icon = sec.icon
                  const count = sectorGroups[sec.key]?.length || 0
                  return (
                    <button
                      key={sec.key}
                      onClick={() => toggleSector(sec.key)}
                      className={`flex items-center gap-2 rounded-xl ${sec.bg} px-3 py-2.5 text-left transition-all hover:shadow-sm`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${sec.color}`} />
                      <span className="flex-1 truncate text-xs font-medium text-text-secondary">{sec.label}</span>
                      <span className="text-sm font-bold text-text-primary">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-border bg-white">
          <MapView
            height="350px"
            center={[municipality.longitude, municipality.latitude]}
            zoom={13}
            markers={markers}
            fallbackTitle="Gemeinde-Karte"
            fallbackDescription={`Interaktive Karte mit KRITIS-Infrastruktur für ${municipality.name}.`}
            showControls
          />
        </div>
      </div>
    </div>
  )
}

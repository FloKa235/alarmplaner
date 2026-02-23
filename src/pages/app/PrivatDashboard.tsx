import { AlertTriangle, Package, FileText, Bell, ArrowRight, MapPin, Radio, Droplets, BookOpen, Calendar, CheckCircle2, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMemo, useState, useCallback } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import VorsorgeScoreCard from '@/components/app/VorsorgeScoreCard'
import WeeklyChallengeCard from '@/components/app/WeeklyChallengeCard'
import MapView, { type MapMarker } from '@/components/ui/MapView'
import Badge from '@/components/ui/Badge'
import { useCitizenLocation } from '@/hooks/useCitizenLocation'
import { useCitizenInventory } from '@/hooks/useCitizenInventory'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useShelterPoints, SHELTER_CATEGORIES } from '@/hooks/useShelterPoints'
import type { DbExternalWarning } from '@/types/database'

function hasNotfallplan(): boolean {
  try {
    const raw = localStorage.getItem('alarmplaner-notfallplan')
    if (!raw) return false
    const data = JSON.parse(raw)
    return !!(data.treffpunkt || data.kontakte?.length > 0 || data.notizen)
  } catch {
    return false
  }
}

const severityColor = (s: string) =>
  s === 'extreme' || s === 'severe' ? 'bg-red-100 text-red-700 border-red-200' :
  s === 'moderate' ? 'bg-amber-100 text-amber-700 border-amber-200' :
  'bg-blue-100 text-blue-700 border-blue-200'

const severityLabel = (s: string) =>
  s === 'extreme' ? 'Extrem' : s === 'severe' ? 'Schwer' : s === 'moderate' ? 'Mäßig' : 'Gering'

const sourceIcon = (s: string) =>
  s === 'dwd' ? AlertTriangle : s === 'pegel' ? Droplets : Radio

export default function PrivatDashboard() {
  const { location } = useCitizenLocation()
  const { items, stats } = useCitizenInventory()

  // Schutzpunkte Filter-State — standardmäßig sind die "enabled: true" Kategorien aktiv
  const [shelterFilters, setShelterFilters] = useState<Record<string, boolean>>(
    () => Object.fromEntries(SHELTER_CATEGORIES.map(c => [c.id, c.enabled]))
  )
  const enabledShelterCats = useMemo(
    () => Object.entries(shelterFilters).filter(([, v]) => v).map(([k]) => k),
    [shelterFilters]
  )
  const { markers: shelterMarkers, loading: shelterLoading } = useShelterPoints(
    location?.lat ?? null,
    location?.lng ?? null,
    enabledShelterCats,
  )
  const toggleShelterFilter = useCallback((catId: string) => {
    setShelterFilters(prev => ({ ...prev, [catId]: !prev[catId] }))
  }, [])

  // District-ID über AGS-Code finden
  const { data: matchingDistricts } = useSupabaseQuery<{ id: string }>(
    (sb) => {
      if (!location?.districtAgs) return sb.from('districts').select('id').eq('id', '00000000-0000-0000-0000-000000000000')
      return sb.from('districts').select('id').eq('ags_code', location.districtAgs).limit(1)
    },
    [location?.districtAgs]
  )

  const districtId = matchingDistricts[0]?.id || null

  // Echte Warnungen laden
  const { data: warnungen } = useSupabaseQuery<DbExternalWarning>(
    (sb) => {
      if (!districtId) return sb.from('external_warnings').select('*').eq('district_id', '00000000-0000-0000-0000-000000000000')
      return sb.from('external_warnings').select('*').eq('district_id', districtId).order('fetched_at', { ascending: false }).limit(10)
    },
    [districtId]
  )

  const aktiveWarnungen = useMemo(
    () => warnungen.filter(w => !w.expires_at || new Date(w.expires_at) > new Date()),
    [warnungen]
  )

  const planExists = useMemo(() => hasNotfallplan(), [])

  // Bald ablaufende Items
  const expiringItems = useMemo(() => {
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    return items
      .filter(i => i.expiry_date && new Date(i.expiry_date) < in30)
      .sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime())
      .slice(0, 5)
  }, [items])

  // Map-Marker: Standort + Schutzpunkte kombiniert
  const allMapMarkers: MapMarker[] = useMemo(() => {
    const result: MapMarker[] = []

    if (location) {
      result.push({
        id: 'home',
        lng: location.lng,
        lat: location.lat,
        label: location.districtName,
        color: '#2563eb',
        popup: `<div style="font-family:'Plus Jakarta Sans',sans-serif">
          <div style="font-size:16px;margin-bottom:2px">📍</div>
          <strong style="font-size:13px">${location.districtName}</strong>
          <div style="margin:4px 0;font-size:11px;color:#64748b">Dein Standort</div>
          <div style="font-size:11px;color:#64748b">${aktiveWarnungen.length} aktive Warnung(en)</div>
        </div>`,
      })
    }

    // Schutzpunkte hinzufügen
    result.push(...shelterMarkers)

    return result
  }, [location, aktiveWarnungen.length, shelterMarkers])

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={location ? `Krisenvorsorge für ${location.districtName}` : 'Dein persönliches Krisenmanagement auf einen Blick.'}
      />

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Bell className="h-5 w-5" />}
          label="Aktive Warnungen"
          value={aktiveWarnungen.length}
          trend={aktiveWarnungen.length === 0
            ? { value: 'Keine', positive: true }
            : aktiveWarnungen.length >= 3
              ? { value: `${aktiveWarnungen.length} aktiv`, positive: false }
              : undefined
          }
        />
        <StatCard
          icon={<MapPin className="h-5 w-5" />}
          label="Dein Standort"
          value={location?.districtName || '–'}
        />
        <StatCard
          icon={<Package className="h-5 w-5" />}
          label="Vorsorge"
          value={`${stats.progressPercent}%`}
          trend={stats.progressPercent >= 80
            ? { value: 'Gut', positive: true }
            : stats.progressPercent >= 40
              ? { value: 'In Arbeit', positive: false }
              : stats.totalItems > 0
                ? { value: `${stats.missingItems} fehlend`, positive: false }
                : undefined
          }
        />
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Notfallplan"
          value={planExists ? 'Angelegt' : 'Offen'}
          trend={planExists ? { value: 'Aktiv', positive: true } : undefined}
        />
      </div>

      {/* Vorsorge-Score + Wochen-Challenge */}
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <VorsorgeScoreCard />
        <WeeklyChallengeCard />
      </div>

      {/* Nächste Schritte — nur wenn Vorratsliste noch leer */}
      {stats.totalItems === 0 && (
        <div className="mb-8 rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-6">
          <h2 className="mb-1 text-lg font-bold text-text-primary">Deine nächsten Schritte</h2>
          <p className="mb-5 text-sm text-text-secondary">Drei Schritte zur persönlichen Krisenvorsorge</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              to="/app/vorsorge"
              className="group flex items-center gap-3 rounded-xl border border-border bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 font-bold text-sm">
                1
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">Vorratsliste anlegen</p>
                <p className="text-xs text-text-muted">Wasser, Nahrung, Medizin & mehr</p>
              </div>
              <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/app/notfallplan"
              className={`group flex items-center gap-3 rounded-xl border border-border bg-white p-4 transition-shadow hover:shadow-md`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-sm ${
                planExists ? 'bg-green-100 text-green-600' : 'bg-surface-secondary text-text-muted'
              }`}>
                {planExists ? <CheckCircle2 className="h-5 w-5" /> : '2'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">Notfallplan erstellen</p>
                <p className="text-xs text-text-muted">Treffpunkt & Kontakte festlegen</p>
              </div>
              <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/app/wissen"
              className="group flex items-center gap-3 rounded-xl border border-border bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-text-muted font-bold text-sm">
                3
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">Wissen auffrischen</p>
                <p className="text-xs text-text-muted">10 Survival-Guides lesen</p>
              </div>
              <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      )}

      {/* Warnungen + Karte nebeneinander */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Aktuelle Warnungen */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-text-primary">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Aktuelle Warnungen
          </h2>

          {aktiveWarnungen.length === 0 ? (
            <div className="rounded-xl bg-green-50 p-4 text-center">
              <p className="text-sm font-medium text-green-700">Keine aktiven Warnungen</p>
              <p className="mt-0.5 text-xs text-green-600">
                {location ? `Für ${location.districtName} liegen keine Warnmeldungen vor.` : 'Bitte wähle deinen Standort.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {aktiveWarnungen.slice(0, 4).map(w => {
                const Icon = sourceIcon(w.source)
                return (
                  <div key={w.id} className={`rounded-xl border p-3 ${severityColor(w.severity)}`}>
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium line-clamp-1">{w.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant={w.severity === 'extreme' || w.severity === 'severe' ? 'danger' : w.severity === 'moderate' ? 'warning' : 'info'}>
                            {severityLabel(w.severity)}
                          </Badge>
                          <span className="text-[10px] opacity-70">{w.source.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Karte mit Schutzpunkten */}
        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">
              Wichtige Anlaufstellen
              {shelterLoading && <Loader2 className="ml-2 inline h-4 w-4 animate-spin text-text-muted" />}
            </h2>
            {shelterMarkers.length > 0 && (
              <span className="text-xs text-text-muted">{shelterMarkers.length} Punkte</span>
            )}
          </div>

          {/* Shelter-Kategorien Filter-Chips */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {SHELTER_CATEGORIES.map(cat => {
              const isActive = shelterFilters[cat.id]
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleShelterFilter(cat.id)}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                    isActive
                      ? 'bg-white shadow-sm ring-1 ring-border text-text-primary'
                      : 'bg-surface-secondary text-text-muted hover:text-text-secondary'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span className="hidden sm:inline">{cat.label}</span>
                  {isActive && (
                    <span
                      className="ml-0.5 inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          <MapView
            markers={allMapMarkers}
            center={location ? [location.lng, location.lat] : [10.5, 51.5]}
            zoom={location ? 12 : 5}
            height="320px"
            className="rounded-xl"
            fallbackTitle="Karte"
            fallbackDescription="Kartenansicht deines Standorts."
          />
        </div>
      </div>

      {/* Bald ablaufend */}
      {expiringItems.length > 0 && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-amber-800">
              <Calendar className="h-5 w-5" />
              Bald ablaufend
            </h2>
            <Link to="/app/vorsorge" className="text-xs font-medium text-amber-700 hover:text-amber-800">
              Alle anzeigen →
            </Link>
          </div>
          <div className="space-y-2">
            {expiringItems.map(item => {
              const days = item.expiry_date
                ? Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null
              const isExpired = days !== null && days < 0
              return (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-white p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">{item.item_name}</p>
                    {item.product_name && (
                      <p className="text-xs text-text-muted">{item.product_name}</p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    isExpired
                      ? 'bg-red-100 text-red-700'
                      : days !== null && days <= 30
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}>
                    {isExpired ? 'Abgelaufen' : `${days} Tage`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Schnellzugriff */}
      <h2 className="mb-4 text-lg font-bold text-text-primary">Schnellzugriff</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/app/vorsorge"
          className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
            <Package className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary">Vorsorge</h3>
            <p className="text-sm text-text-secondary">Vorräte & Ausrüstung</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          to="/app/wissen"
          className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary">Wissen</h3>
            <p className="text-sm text-text-secondary">Survival-Handbuch</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          to="/app/notfallplan"
          className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary">Notfallplan</h3>
            <p className="text-sm text-text-secondary">Dein persönlicher Plan</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}

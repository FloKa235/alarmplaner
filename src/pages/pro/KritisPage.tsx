import {
  Landmark, Search, Plus, Upload, MapPin, Loader2,
} from 'lucide-react'
import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import MapView, { type MapMarker } from '@/components/ui/MapView'
import Modal, { FormField, inputClass, selectClass, ModalFooter, ConfirmDialog, RowActions } from '@/components/ui/Modal'
import { useDistrict } from '@/hooks/useDistrict'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useGeocode } from '@/hooks/useGeocode'
import { supabase } from '@/lib/supabase'
import { SECTOR_CONFIG, categoryMeta } from '@/data/sector-config'
import type { DbKritisSite } from '@/types/database'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Alias for backwards compatibility in this file
const BBK_SECTORS = SECTOR_CONFIG

const riskVariant = {
  niedrig: 'success' as const,
  mittel: 'warning' as const,
  erhöht: 'warning' as const,
  hoch: 'danger' as const,
  extrem: 'danger' as const,
}

// Risiko-Exposition Badges (gruppiert)
function RiskSummary({ sites }: { sites: DbKritisSite[] }) {
  const counts = { extrem: 0, hoch: 0, mittel: 0, niedrig: 0 }
  for (const s of sites) {
    const r = (s.risk_exposure || 'mittel') as keyof typeof counts
    if (r in counts) counts[r]++
  }
  return (
    <div className="flex flex-wrap gap-2">
      {counts.extrem > 0 && <span className="rounded-lg bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">Kritisch: {counts.extrem}</span>}
      {counts.hoch > 0 && <span className="rounded-lg bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">Hoch: {counts.hoch}</span>}
      {counts.mittel > 0 && <span className="rounded-lg bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">Mittel: {counts.mittel}</span>}
      {counts.niedrig > 0 && <span className="rounded-lg bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">Niedrig: {counts.niedrig}</span>}
    </div>
  )
}

export default function KritisPage() {
  const { districtId, loading: districtLoading } = useDistrict()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSector, setActiveSector] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [osmLoading, setOsmLoading] = useState(false)
  const [osmSuccess, setOsmSuccess] = useState<string | null>(null)
  const [osmError, setOsmError] = useState<string | null>(null)
  const emptyForm = { name: '', category: 'krankenhaus', address: '', latitude: '', longitude: '', risk_exposure: 'mittel' }
  const [form, setForm] = useState(emptyForm)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<DbKritisSite | null>(null)
  const [deleting, setDeleting] = useState(false)

  const categoryOptions = Object.entries(categoryMeta)
    .map(([value, { label, sector }]) => ({ value, label: `${label} (${sector})` }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const { suggestions: geoSuggestions, search: geoSearch, clear: geoClear, loading: geoLoading } = useGeocode(5)
  const [showGeoSuggestions, setShowGeoSuggestions] = useState(false)

  const { data: kritisSites, loading, refetch } = useSupabaseQuery<DbKritisSite>(
    (sb) =>
      sb
        .from('kritis_sites')
        .select('*')
        .eq('district_id', districtId!)
        .order('name'),
    [districtId]
  )

  const openCreate = () => { setEditId(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (site: DbKritisSite) => {
    setEditId(site.id)
    setForm({
      name: site.name, category: site.category,
      address: site.address || '',
      latitude: site.latitude ? String(site.latitude) : '',
      longitude: site.longitude ? String(site.longitude) : '',
      risk_exposure: site.risk_exposure || 'mittel',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !districtId) return
    setSaving(true)
    try {
      const meta = categoryMeta[form.category]
      const payload = {
        name: form.name.trim(), category: form.category,
        sector: meta?.sector || null,
        address: form.address.trim() || null,
        latitude: form.latitude ? Number(form.latitude) : 0,
        longitude: form.longitude ? Number(form.longitude) : 0,
        risk_exposure: form.risk_exposure,
      }
      if (editId) {
        const { error } = await supabase.from('kritis_sites').update(payload).eq('id', editId).eq('district_id', districtId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('kritis_sites').insert({ ...payload, district_id: districtId })
        if (error) throw error
      }
      refetch(); setShowModal(false); setForm(emptyForm); setEditId(null)
    } catch (err) { console.error('KRITIS speichern:', err) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !districtId) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('kritis_sites').delete().eq('id', deleteTarget.id).eq('district_id', districtId)
      if (error) throw error
      refetch(); setDeleteTarget(null)
    } catch (err) { console.error('KRITIS löschen:', err) }
    finally { setDeleting(false) }
  }

  const handleOsmImport = async () => {
    if (!districtId) return
    setOsmLoading(true); setOsmError(null); setOsmSuccess(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) throw new Error('Nicht angemeldet.')
      const response = await fetch(`${SUPABASE_URL}/functions/v1/import-osm-kritis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`, apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ districtId }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Unbekannter Fehler')
      const sectorSummary = Object.entries(result.sectors || {})
        .map(([sec, count]) => `${sec}: ${count}`)
        .join(', ')
      setOsmSuccess(`${result.imported} neue KRITIS-Objekte importiert (${result.total_found} gefunden, ${result.skipped} bereits vorhanden). Sektoren: ${sectorSummary}`)
      refetch()
    } catch (err) { setOsmError(err instanceof Error ? err.message : 'Verbindungsfehler.') }
    finally { setOsmLoading(false) }
  }

  if (districtLoading || loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
  }

  // Sektor-Zählung (inkl. sector-Spalte oder Fallback über categoryMeta)
  const getSector = (site: DbKritisSite) => {
    if (site.sector) return site.sector
    return categoryMeta[site.category]?.sector || 'sonstiges'
  }

  const sectorCounts: Record<string, number> = {}
  for (const site of kritisSites) {
    const s = getSector(site)
    sectorCounts[s] = (sectorCounts[s] || 0) + 1
  }

  // Filter
  let filtered = kritisSites
  if (activeSector) filtered = filtered.filter((k) => getSector(k) === activeSector)
  if (searchQuery) {
    filtered = filtered.filter((k) =>
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.address?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const kritisMarkers: MapMarker[] = (activeSector ? filtered : kritisSites).map((site) => ({
    id: site.id,
    lng: site.longitude,
    lat: site.latitude,
    label: site.name,
    color: categoryMeta[site.category]?.markerColor || '#6b7280',
    popup: `<strong>${site.name}</strong><br/>${categoryMeta[site.category]?.label || site.category}<br/>Risiko: ${site.risk_exposure || 'k.A.'}`,
  }))

  return (
    <div>
      <PageHeader
        title="Kritische Infrastruktur (KRITIS)"
        description={`Erfassung und Verwaltung kritischer Infrastrukturen im Landkreis (${kritisSites.length} Einträge)`}
        actions={
          <div className="flex gap-2">
            <button onClick={handleOsmImport} disabled={osmLoading}
              className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed">
              {osmLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Importiere...</> : <><Upload className="h-4 w-4" /> OSM-Import</>}
            </button>
            <button onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700">
              <Plus className="h-4 w-4" /> Objekt hinzufügen
            </button>
          </div>
        }
      />

      {/* OSM Banners */}
      {osmLoading && (
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-primary-200 bg-primary-50 p-5">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
            <MapPin className="absolute h-4 w-4 text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-primary-900">OSM-Import läuft...</p>
            <p className="text-sm text-primary-700">KRITIS aus 12 BBK-Sektoren werden importiert. Dies kann 30–90 Sekunden dauern.</p>
          </div>
        </div>
      )}
      {osmSuccess && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5">
          <p className="font-semibold text-green-900">OSM-Import abgeschlossen</p>
          <p className="text-sm text-green-700">{osmSuccess}</p>
        </div>
      )}
      {osmError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-900">Fehler beim OSM-Import</p>
          <p className="text-sm text-red-700">{osmError}</p>
        </div>
      )}

      {/* BBK-Sektor Buttons (wie im BBK-Design) */}
      <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11">
        {BBK_SECTORS.map((sec) => {
          const Icon = sec.icon
          const count = sectorCounts[sec.key] || 0
          const isActive = activeSector === sec.key
          return (
            <button
              key={sec.key}
              onClick={() => setActiveSector(isActive ? null : sec.key)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-all ${
                isActive
                  ? 'border-primary-300 bg-primary-50 ring-2 ring-primary-600/20'
                  : 'border-border bg-white hover:bg-surface-secondary'
              }`}
            >
              <Icon className={`h-5 w-5 ${sec.color}`} />
              <span className="text-xs font-medium text-text-secondary leading-tight">{sec.label}</span>
              <span className={`text-lg font-bold ${count > 0 ? 'text-text-primary' : 'text-text-muted'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Risiko-Zusammenfassung */}
      <div className="mb-6">
        <RiskSummary sites={kritisSites} />
      </div>

      {/* Map */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-white">
        <MapView
          height="280px"
          markers={kritisMarkers}
          fallbackTitle="KRITIS-Karte"
          fallbackDescription="Interaktive Karte mit allen KRITIS-Objekten, farbcodiert nach Sektor."
          showControls
        />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="KRITIS-Objekte suchen..."
          className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        />
      </div>

      {/* KRITIS table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                <th className="px-5 py-3">Objekt</th>
                <th className="px-5 py-3">Kategorie</th>
                <th className="px-5 py-3">Sektor</th>
                <th className="px-5 py-3">Adresse</th>
                <th className="px-5 py-3">Risiko</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((site) => {
                const meta = categoryMeta[site.category]
                const sectorDef = BBK_SECTORS.find((s) => s.key === getSector(site))
                const SectorIcon = sectorDef?.icon || Landmark
                return (
                  <tr key={site.id} className="transition-colors hover:bg-surface-secondary/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <SectorIcon className={`h-4 w-4 shrink-0 ${sectorDef?.color || 'text-gray-400'}`} />
                        <span className="text-sm font-medium text-text-primary">{site.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge>{meta?.label || site.category}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-text-muted">{sectorDef?.label || getSector(site)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-muted">{site.address || '–'}</td>
                    <td className="px-5 py-3.5">
                      {site.risk_exposure ? (
                        <Badge variant={riskVariant[site.risk_exposure as keyof typeof riskVariant]}>{site.risk_exposure}</Badge>
                      ) : <span className="text-sm text-text-muted">–</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <RowActions onEdit={() => openEdit(site)} onDelete={() => setDeleteTarget(site)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'KRITIS-Objekt bearbeiten' : 'KRITIS-Objekt hinzufügen'}>
        <FormField label="Name" required>
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="z.B. Kreiskrankenhaus" />
        </FormField>
        <FormField label="Kategorie" required>
          <select className={selectClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categoryOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </FormField>
        <FormField label="Adresse (Geocoding-Suche)">
          <div className="relative">
            <input className={inputClass} value={form.address}
              onChange={(e) => { setForm({ ...form, address: e.target.value }); geoSearch(e.target.value); setShowGeoSuggestions(true) }}
              onFocus={() => geoSuggestions.length > 0 && setShowGeoSuggestions(true)}
              onBlur={() => setTimeout(() => setShowGeoSuggestions(false), 200)}
              placeholder="Adresse eingeben..."
            />
            {geoLoading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-muted" />}
            {showGeoSuggestions && geoSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-white shadow-lg">
                {geoSuggestions.map((s, idx) => (
                  <button key={`${s.osmType}-${s.osmId}-${idx}`} type="button"
                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-secondary"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setForm({ ...form, address: s.displayName, latitude: String(s.lat), longitude: String(s.lng) }); setShowGeoSuggestions(false); geoClear() }}>
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-500" />
                    <span className="line-clamp-2">{s.displayName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </FormField>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <FormField label="Breitengrad (Lat)">
            <input type="number" step="any" className={inputClass} value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="z.B. 51.7900" />
          </FormField>
          <FormField label="Längengrad (Lng)">
            <input type="number" step="any" className={inputClass} value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="z.B. 11.1500" />
          </FormField>
        </div>
        <FormField label="Risiko-Exposition">
          <select className={selectClass} value={form.risk_exposure} onChange={(e) => setForm({ ...form, risk_exposure: e.target.value })}>
            <option value="niedrig">Niedrig</option>
            <option value="mittel">Mittel</option>
            <option value="erhöht">Erhöht</option>
            <option value="hoch">Hoch</option>
            <option value="extrem">Extrem</option>
          </select>
        </FormField>
        <ModalFooter onCancel={() => setShowModal(false)} onSubmit={handleSave} submitLabel={editId ? 'Änderungen speichern' : 'Objekt speichern'} loading={saving} disabled={!form.name.trim()} />
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="KRITIS-Objekt löschen" message={`Möchten Sie "${deleteTarget?.name}" wirklich löschen?`} loading={deleting} />
    </div>
  )
}

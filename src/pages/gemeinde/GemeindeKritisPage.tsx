import { useState, useMemo } from 'react'
import { Landmark, Search, Plus, Loader2, MapPin } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import Modal, { FormField, inputClass, selectClass, ModalFooter, ConfirmDialog, RowActions } from '@/components/ui/Modal'
import { useMembership } from '@/hooks/useMembership'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useGeocode } from '@/hooks/useGeocode'
import { supabase } from '@/lib/supabase'
import { SECTOR_CONFIG, categoryMeta } from '@/data/sector-config'
import type { DbKritisSite } from '@/types/database'

const riskVariant = {
  niedrig: 'success' as const,
  mittel: 'warning' as const,
  'erhöht': 'warning' as const,
  hoch: 'danger' as const,
  extrem: 'danger' as const,
}

export default function GemeindeKritisPage() {
  const { municipalityId, districtId, municipality } = useMembership()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeSector, setActiveSector] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const emptyForm = { name: '', category: 'krankenhaus', address: '', latitude: '', longitude: '', risk_exposure: 'mittel' }
  const [form, setForm] = useState(emptyForm)

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
        .eq('municipality_id', municipalityId!)
        .order('name'),
    [districtId, municipalityId]
  )

  const getSector = (site: DbKritisSite) => {
    if (site.sector) return site.sector
    return categoryMeta[site.category]?.sector || 'sonstiges'
  }

  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const site of kritisSites) {
      const s = getSector(site)
      counts[s] = (counts[s] || 0) + 1
    }
    return counts
  }, [kritisSites])

  const filtered = useMemo(() => {
    let result = kritisSites
    if (activeSector) result = result.filter((k) => getSector(k) === activeSector)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((k) =>
        k.name.toLowerCase().includes(q) ||
        k.address?.toLowerCase().includes(q)
      )
    }
    return result
  }, [kritisSites, activeSector, searchQuery])

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
    if (!form.name.trim() || !districtId || !municipalityId) return
    setSaving(true)
    try {
      const meta = categoryMeta[form.category]
      const payload = {
        district_id: districtId,
        municipality_id: municipalityId,
        name: form.name.trim(),
        category: form.category,
        sector: meta?.sector || null,
        address: form.address.trim() || null,
        latitude: form.latitude ? Number(form.latitude) : 0,
        longitude: form.longitude ? Number(form.longitude) : 0,
        risk_exposure: form.risk_exposure,
      }
      if (editId) {
        const { error } = await supabase.from('kritis_sites').update(payload).eq('id', editId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('kritis_sites').insert(payload)
        if (error) throw error
      }
      refetch(); setShowModal(false); setForm(emptyForm); setEditId(null)
    } catch (err) { console.error('KRITIS speichern:', err); alert('Fehler beim Speichern.') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('kritis_sites').delete().eq('id', deleteTarget.id)
      if (error) throw error
      refetch(); setDeleteTarget(null)
    } catch (err) { console.error('KRITIS löschen:', err) }
    finally { setDeleting(false) }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
  }

  return (
    <div>
      <PageHeader
        title={`KRITIS – ${municipality?.name || 'Gemeinde'}`}
        description={`Kritische Infrastruktur Ihrer Gemeinde verwalten (${kritisSites.length} Einträge).`}
        actions={
          <button onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700">
            <Plus className="h-4 w-4" /> Objekt hinzufügen
          </button>
        }
      />

      {/* BBK-Sektor Buttons */}
      <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11">
        {SECTOR_CONFIG.map((sec) => {
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

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="KRITIS-Objekte suchen..."
          className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-white">
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-semibold text-text-primary">Objekt</th>
                <th className="px-4 py-3 font-semibold text-text-primary">Kategorie</th>
                <th className="px-4 py-3 font-semibold text-text-primary">Sektor</th>
                <th className="px-4 py-3 font-semibold text-text-primary">Adresse</th>
                <th className="px-4 py-3 font-semibold text-text-primary">Risiko</th>
                <th className="px-4 py-3 font-semibold text-text-primary w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Landmark className="mx-auto mb-2 h-8 w-8 text-text-muted" />
                    <p className="text-text-secondary">Noch keine KRITIS-Objekte. Klicken Sie auf "Objekt hinzufügen".</p>
                  </td>
                </tr>
              ) : (
                filtered.map(site => {
                  const meta = categoryMeta[site.category]
                  const sectorDef = SECTOR_CONFIG.find((s) => s.key === getSector(site))
                  const SectorIcon = sectorDef?.icon || Landmark
                  return (
                    <tr key={site.id} className="border-b border-border/50 hover:bg-surface-secondary/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <SectorIcon className={`h-4 w-4 shrink-0 ${sectorDef?.color || 'text-gray-400'}`} />
                          <span className="font-medium text-text-primary">{site.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge>{meta?.label || site.category}</Badge></td>
                      <td className="px-4 py-3 text-text-muted text-xs">{sectorDef?.label || getSector(site)}</td>
                      <td className="px-4 py-3 text-text-muted">{site.address || '–'}</td>
                      <td className="px-4 py-3">
                        {site.risk_exposure ? (
                          <Badge variant={riskVariant[site.risk_exposure as keyof typeof riskVariant]}>{site.risk_exposure}</Badge>
                        ) : <span className="text-text-muted">–</span>}
                      </td>
                      <td className="px-4 py-3">
                        <RowActions onEdit={() => openEdit(site)} onDelete={() => setDeleteTarget(site)} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'KRITIS-Objekt bearbeiten' : 'KRITIS-Objekt hinzufügen'}>
        <FormField label="Name" required>
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="z.B. Wasserwerk" />
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

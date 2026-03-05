import {
  Landmark, Search, Plus, Upload, MapPin, Loader2, Mail, Phone, Pencil, Trash2,
  ShieldCheck, ShieldX, Zap, ZapOff, ClipboardCheck, User, Building,
} from 'lucide-react'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import KritisComplianceTab from './kritis/KritisComplianceTab'
import Badge from '@/components/ui/Badge'
import MapView, { type MapMarker } from '@/components/ui/MapView'
import Modal, { FormField, inputClass, selectClass, ModalFooter, ConfirmDialog } from '@/components/ui/Modal'
import { useDistrict } from '@/hooks/useDistrict'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useGeocode } from '@/hooks/useGeocode'
import { supabase } from '@/lib/supabase'
import { SECTOR_CONFIG, categoryMeta } from '@/data/sector-config'
import type { DbKritisSite } from '@/types/database'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const BBK_SECTORS = SECTOR_CONFIG

const riskVariant = {
  niedrig: 'success' as const,
  mittel: 'warning' as const,
  erhöht: 'warning' as const,
  hoch: 'danger' as const,
  extrem: 'danger' as const,
}

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

// Notfallplan-Status Summary
function PlanSummary({ sites }: { sites: DbKritisSite[] }) {
  const withPlan = sites.filter(s => s.has_emergency_plan).length
  const withoutPlan = sites.length - withPlan
  const withBackup = sites.filter(s => s.has_backup_power).length
  const withContact = sites.filter(s => s.contact_name).length
  return (
    <div className="flex flex-wrap gap-2">
      {withPlan > 0 && <span className="inline-flex items-center gap-1 rounded-lg bg-green-100 px-3 py-1 text-sm font-semibold text-green-700"><ShieldCheck className="h-3.5 w-3.5" /> {withPlan} mit Notfallplan</span>}
      {withoutPlan > 0 && <span className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1 text-sm font-semibold text-red-700"><ShieldX className="h-3.5 w-3.5" /> {withoutPlan} ohne Notfallplan</span>}
      {withBackup > 0 && <span className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700"><Zap className="h-3.5 w-3.5" /> {withBackup} mit Notstrom</span>}
      {withContact > 0 && <span className="inline-flex items-center gap-1 rounded-lg bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700"><User className="h-3.5 w-3.5" /> {withContact} mit Ansprechpartner</span>}
    </div>
  )
}

const emptyForm = {
  name: '', category: 'krankenhaus', address: '', latitude: '', longitude: '',
  risk_exposure: 'mittel', operator: '',
  contact_name: '', contact_phone: '', contact_email: '',
  employee_count: '',
  has_emergency_plan: false, emergency_plan_updated_at: '', emergency_plan_notes: '',
  redundancy_level: '' as '' | 'keine' | 'teilweise' | 'voll',
  has_backup_power: false,
  last_inspected_at: '',
}

// ─── Tab Config ──────────────────────────────────────
type KritisTab = 'infrastruktur' | 'compliance'

export default function KritisPage() {
  const { districtId, loading: districtLoading } = useDistrict()
  const location = useLocation()
  const activeTab: KritisTab = location.pathname.endsWith('/compliance') ? 'compliance' : 'infrastruktur'
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSector, setActiveSector] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [osmLoading, setOsmLoading] = useState(false)
  const [osmSuccess, setOsmSuccess] = useState<string | null>(null)
  const [osmError, setOsmError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  // Detail-Ansicht (aufklappbare Zeile)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

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
      name: site.name,
      category: site.category,
      address: site.address || '',
      latitude: site.latitude ? String(site.latitude) : '',
      longitude: site.longitude ? String(site.longitude) : '',
      risk_exposure: site.risk_exposure || 'mittel',
      operator: site.operator || '',
      contact_name: site.contact_name || '',
      contact_phone: site.contact_phone || '',
      contact_email: site.contact_email || '',
      employee_count: site.employee_count ? String(site.employee_count) : '',
      has_emergency_plan: site.has_emergency_plan ?? false,
      emergency_plan_updated_at: site.emergency_plan_updated_at || '',
      emergency_plan_notes: site.emergency_plan_notes || '',
      redundancy_level: site.redundancy_level || '',
      has_backup_power: site.has_backup_power ?? false,
      last_inspected_at: site.last_inspected_at || '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !districtId) return
    setSaving(true)
    try {
      const meta = categoryMeta[form.category]
      const payload = {
        name: form.name.trim(),
        category: form.category,
        sector: meta?.sector || null,
        address: form.address.trim() || null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        risk_exposure: form.risk_exposure,
        operator: form.operator.trim() || null,
        contact_name: form.contact_name.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        contact_email: form.contact_email.trim() || null,
        employee_count: form.employee_count ? Number(form.employee_count) : null,
        has_emergency_plan: form.has_emergency_plan,
        emergency_plan_updated_at: form.emergency_plan_updated_at || null,
        emergency_plan_notes: form.emergency_plan_notes.trim() || null,
        redundancy_level: form.redundancy_level || null,
        has_backup_power: form.has_backup_power,
        last_inspected_at: form.last_inspected_at || null,
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
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter((k) =>
      k.name.toLowerCase().includes(q) ||
      (k.address || '').toLowerCase().includes(q) ||
      (k.operator || '').toLowerCase().includes(q) ||
      (k.contact_name || '').toLowerCase().includes(q)
    )
  }

  const kritisMarkers: MapMarker[] = filtered
    .filter((site) => site.latitude !== 0 || site.longitude !== 0)
    .map((site) => ({
      id: site.id,
      lng: site.longitude,
      lat: site.latitude,
      label: site.name,
      color: categoryMeta[site.category]?.markerColor || '#6b7280',
      popup: `<strong>${site.name}</strong><br/>${categoryMeta[site.category]?.label || site.category}<br/>Risiko: ${site.risk_exposure || 'k.A.'}${site.contact_name ? `<br/>Kontakt: ${site.contact_name}` : ''}`,
    }))

  return (
    <div>
      <PageHeader
        title="Kritische Infrastruktur (KRITIS)"
        description={`Erfassung und Verwaltung kritischer Infrastrukturen im Landkreis (${kritisSites.length} Einträge)`}
        actions={activeTab === 'infrastruktur' ? (
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
        ) : undefined}
      />

      {/* ─── Compliance Tab ──────────────────────── */}
      {activeTab === 'compliance' && districtId && (
        <div className="mt-6">
          <KritisComplianceTab districtId={districtId} />
        </div>
      )}

      {/* ─── Infrastruktur Tab ──────────────────── */}
      {activeTab === 'infrastruktur' && (<>


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

      {/* BBK-Sektor Buttons */}
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

      {/* Risiko + Plan Zusammenfassung */}
      <div className="mb-6 space-y-2">
        <RiskSummary sites={kritisSites} />
        <PlanSummary sites={kritisSites} />
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
          placeholder="KRITIS-Objekte suchen (Name, Adresse, Betreiber, Ansprechpartner)..."
          className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        />
      </div>

      {/* KRITIS table — alle Infos direkt sichtbar */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center">
          <Landmark className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">Keine KRITIS-Objekte vorhanden.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  <th className="px-4 py-3">Objekt / Betreiber</th>
                  <th className="px-4 py-3">Sektor</th>
                  <th className="px-4 py-3">Ansprechpartner</th>
                  <th className="px-4 py-3">Notfallplan</th>
                  <th className="px-4 py-3">Resilienz</th>
                  <th className="px-4 py-3">Risiko</th>
                  <th className="px-4 py-3 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((site) => {
                  const meta = categoryMeta[site.category]
                  const sectorDef = BBK_SECTORS.find((s) => s.key === getSector(site))
                  const SectorIcon = sectorDef?.icon || Landmark
                  const isExpanded = expandedRow === site.id
                  return (
                    <tr
                      key={site.id}
                      className={`transition-colors cursor-pointer ${isExpanded ? 'bg-surface-secondary/30' : 'hover:bg-surface-secondary/50'}`}
                      onClick={() => setExpandedRow(isExpanded ? null : site.id)}
                    >
                      {/* Objekt + Betreiber */}
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm border border-border ${sectorDef?.color || 'text-gray-400'}`}>
                            <SectorIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary">{site.name}</p>
                            {site.operator && (
                              <p className="flex items-center gap-1 text-xs text-text-muted">
                                <Building className="h-3 w-3" />{site.operator}
                              </p>
                            )}
                            {site.address && (
                              <p className="flex items-center gap-1 text-xs text-text-muted">
                                <MapPin className="h-3 w-3" />{site.address}
                              </p>
                            )}
                            {site.employee_count != null && site.employee_count > 0 && (
                              <p className="text-xs text-text-muted">{site.employee_count} Beschäftigte</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Sektor + Kategorie */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <Badge>{meta?.label || site.category}</Badge>
                          <p className="text-xs text-text-muted">{sectorDef?.label || getSector(site)}</p>
                        </div>
                      </td>

                      {/* Ansprechpartner — klickbar */}
                      <td className="px-4 py-3">
                        {site.contact_name ? (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-text-primary">{site.contact_name}</p>
                            {site.contact_phone && (
                              <a
                                href={`tel:${site.contact_phone}`}
                                className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-primary-600 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Phone className="h-3 w-3" />{site.contact_phone}
                              </a>
                            )}
                            {site.contact_email && (
                              <a
                                href={`mailto:${site.contact_email}`}
                                className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Mail className="h-3 w-3" />{site.contact_email}
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted italic">Kein Kontakt</span>
                        )}
                      </td>

                      {/* Notfallplan */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {site.has_emergency_plan ? (
                            <Badge variant="success">
                              <ClipboardCheck className="mr-1 h-3 w-3" />Vorhanden
                            </Badge>
                          ) : (
                            <Badge variant="danger">
                              <ShieldX className="mr-1 h-3 w-3" />Fehlt
                            </Badge>
                          )}
                          {site.emergency_plan_updated_at && (
                            <p className="text-xs text-text-muted">
                              Stand: {new Date(site.emergency_plan_updated_at).toLocaleDateString('de-DE')}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Resilienz: Notstrom + Redundanz */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${site.has_backup_power ? 'text-green-700' : 'text-text-muted'}`}>
                            {site.has_backup_power ? <Zap className="h-3 w-3" /> : <ZapOff className="h-3 w-3" />}
                            {site.has_backup_power ? 'Notstrom' : 'Kein Notstrom'}
                          </span>
                          {site.redundancy_level && (
                            <span className="text-xs text-text-muted">
                              Redundanz: {site.redundancy_level === 'voll' ? 'Voll' : site.redundancy_level === 'teilweise' ? 'Teilweise' : 'Keine'}
                            </span>
                          )}
                          {site.last_inspected_at && (
                            <span className="text-xs text-text-muted">
                              Geprüft: {new Date(site.last_inspected_at).toLocaleDateString('de-DE')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Risiko */}
                      <td className="px-4 py-3">
                        {site.risk_exposure ? (
                          <Badge variant={riskVariant[site.risk_exposure as keyof typeof riskVariant]}>{site.risk_exposure}</Badge>
                        ) : <span className="text-sm text-text-muted">–</span>}
                      </td>

                      {/* Aktionen — direkt sichtbar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(site) }}
                            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-secondary hover:text-primary-600"
                            title="Bearbeiten"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(site) }}
                            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </>)}

      {/* Create / Edit Modal — erweitert */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'KRITIS-Objekt bearbeiten' : 'KRITIS-Objekt hinzufügen'} size="lg">

        {/* Grunddaten */}
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Grunddaten</div>
        <FormField label="Name" required>
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="z.B. Kreiskrankenhaus Quedlinburg" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Kategorie" required>
            <select className={selectClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categoryOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </FormField>
          <FormField label="Risiko-Exposition">
            <select className={selectClass} value={form.risk_exposure} onChange={(e) => setForm({ ...form, risk_exposure: e.target.value })}>
              <option value="niedrig">Niedrig</option>
              <option value="mittel">Mittel</option>
              <option value="erhöht">Erhöht</option>
              <option value="hoch">Hoch</option>
              <option value="extrem">Extrem</option>
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Betreiber / Eigentümer">
            <input className={inputClass} value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} placeholder="z.B. Stadtwerke Quedlinburg" />
          </FormField>
          <FormField label="Beschäftigte">
            <input type="number" className={inputClass} value={form.employee_count} onChange={(e) => setForm({ ...form, employee_count: e.target.value })} placeholder="z.B. 250" />
          </FormField>
        </div>

        {/* Adresse + Geocoding */}
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
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Breitengrad (Lat)">
            <input type="number" step="any" className={inputClass} value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="z.B. 51.7900" />
          </FormField>
          <FormField label="Längengrad (Lng)">
            <input type="number" step="any" className={inputClass} value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="z.B. 11.1500" />
          </FormField>
        </div>

        {/* Ansprechpartner */}
        <div className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Ansprechpartner vor Ort</div>
        <FormField label="Name">
          <input className={inputClass} value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} placeholder="z.B. Dr. Müller" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Telefon">
            <input type="tel" className={inputClass} value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="+49 3946 123456" />
          </FormField>
          <FormField label="E-Mail">
            <input type="email" className={inputClass} value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="mueller@krankenhaus.de" />
          </FormField>
        </div>

        {/* Notfallbereitschaft */}
        <div className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Notfallbereitschaft & Resilienz</div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Notfallplan vorhanden?">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.has_emergency_plan}
                onChange={(e) => setForm({ ...form, has_emergency_plan: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-600/20"
              />
              <span className="text-sm text-text-secondary">Ja, Notfallplan liegt vor</span>
            </label>
          </FormField>
          <FormField label="Stand Notfallplan">
            <input type="date" className={inputClass} value={form.emergency_plan_updated_at} onChange={(e) => setForm({ ...form, emergency_plan_updated_at: e.target.value })} />
          </FormField>
        </div>
        {form.has_emergency_plan && (
          <FormField label="Anmerkungen zum Notfallplan">
            <textarea
              className={inputClass + ' min-h-[60px] resize-none'}
              value={form.emergency_plan_notes}
              onChange={(e) => setForm({ ...form, emergency_plan_notes: e.target.value })}
              placeholder="z.B. Letztes Update Dezember 2025, enthält Evakuierungsplan..."
            />
          </FormField>
        )}
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Notstromversorgung?">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.has_backup_power}
                onChange={(e) => setForm({ ...form, has_backup_power: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-600/20"
              />
              <span className="text-sm text-text-secondary">Vorhanden</span>
            </label>
          </FormField>
          <FormField label="Redundanz-Stufe">
            <select className={selectClass} value={form.redundancy_level} onChange={(e) => setForm({ ...form, redundancy_level: e.target.value as typeof form.redundancy_level })}>
              <option value="">– Nicht angegeben –</option>
              <option value="keine">Keine Redundanz</option>
              <option value="teilweise">Teilweise redundant</option>
              <option value="voll">Voll redundant</option>
            </select>
          </FormField>
          <FormField label="Letzte Inspektion">
            <input type="date" className={inputClass} value={form.last_inspected_at} onChange={(e) => setForm({ ...form, last_inspected_at: e.target.value })} />
          </FormField>
        </div>

        <ModalFooter onCancel={() => setShowModal(false)} onSubmit={handleSave} submitLabel={editId ? 'Änderungen speichern' : 'Objekt speichern'} loading={saving} disabled={!form.name.trim()} />
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="KRITIS-Objekt löschen" message={`Möchten Sie "${deleteTarget?.name}" wirklich löschen?`} loading={deleting} />
    </div>
  )
}

import {
  Package, Plus, Upload, Download, Sparkles, Loader2,
  ChevronDown, ChevronUp, Search, X, Euro,
} from 'lucide-react'
import { useState, useMemo, useRef, useEffect } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import Modal, {
  FormField, inputClass, selectClass, ModalFooter,
  ConfirmDialog, RowActions,
} from '@/components/ui/Modal'
import { useDistrict } from '@/hooks/useDistrict'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/lib/supabase'
import type {
  DbInventoryItem, DbInventoryScenarioLink,
  DbScenario, DbMunicipality,
} from '@/types/database'

// ─── Konstanten ──────────────────────────────────────

const KATEGORIE_OPTIONS = [
  'Medizin', 'Technik', 'Verpflegung', 'Schutzausrüstung',
  'Kommunikation', 'Unterkunft', 'Transport', 'Wasser',
  'Brandschutz', 'Werkzeug', 'Stromerzeugung', 'Sonstiges',
]

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  kritisch: { label: 'Kritisch', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  hoch: { label: 'Hoch', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  mittel: { label: 'Mittel', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  niedrig: { label: 'Niedrig', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
}

const UNIT_OPTIONS = ['Stück', 'kg', 'Liter', 'Paletten', 'Karton', 'Satz', 'Set', 'Paar']

const CONDITION_OPTIONS: { value: string; label: string }[] = [
  { value: 'einsatzbereit', label: 'Einsatzbereit' },
  { value: 'wartung_noetig', label: 'Wartung nötig' },
  { value: 'defekt', label: 'Defekt' },
]

// ─── Sort ────────────────────────────────────────────

type SortKey =
  | 'category'
  | 'kategorie'
  | 'priority'
  | 'target_quantity'
  | 'current_quantity'
  | 'price_per_unit'
  | 'totalCost'
  | 'location'
  | 'coverage'

const PRIORITY_ORDER: Record<string, number> = {
  kritisch: 0,
  hoch: 1,
  mittel: 2,
  niedrig: 3,
}

function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey
  sortKey: SortKey | null
  sortDir: 'asc' | 'desc'
}) {
  if (sortKey !== col) {
    return <ChevronDown className="ml-1 inline h-3 w-3 text-text-muted/40" />
  }
  return sortDir === 'asc' ? (
    <ChevronUp className="ml-1 inline h-3 w-3 text-primary-600" />
  ) : (
    <ChevronDown className="ml-1 inline h-3 w-3 text-primary-600" />
  )
}

// ─── Helpers ─────────────────────────────────────────

function getPercent(current: number, target: number) {
  if (target === 0) return 100
  return Math.min(Math.round((current / target) * 100), 100)
}

function getBarColor(percent: number) {
  if (percent >= 90) return 'bg-green-500'
  if (percent >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

function formatCurrency(value: number) {
  return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

// ─── Hauptkomponente ─────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const EMPTY_FORM = {
  category: '',
  kategorie: '',
  priority: '',
  unit: 'Stück',
  target_quantity: '',
  current_quantity: '',
  price_per_unit: '',
  location: '',
  municipality_id: '',
  scenario_ids: [] as string[],
  condition: '',
  responsible: '',
}

export default function InventarPage() {
  const { districtId, loading: districtLoading } = useDistrict()

  // ─── Modal state ───
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showSzenarioDropdown, setShowSzenarioDropdown] = useState(false)
  const szenarioDropdownRef = useRef<HTMLDivElement>(null)

  // ─── Delete state ───
  const [deleteTarget, setDeleteTarget] = useState<DbInventoryItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ─── AI state ───
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuccess, setAiSuccess] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  // ─── Filter state ───
  const [searchQuery, setSearchQuery] = useState('')
  const [filterKategorie, setFilterKategorie] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const [filterGemeinde, setFilterGemeinde] = useState<string | null>(null)
  const [filterSzenario, setFilterSzenario] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  // ─── Sort state ───
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }


  // ─── Close dropdown on outside click ───
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (szenarioDropdownRef.current && !szenarioDropdownRef.current.contains(e.target as Node)) {
        setShowSzenarioDropdown(false)
      }
    }
    if (showSzenarioDropdown) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [showSzenarioDropdown])

  // ─── Data queries ───
  const { data: items, loading, refetch } = useSupabaseQuery<DbInventoryItem>(
    (sb) =>
      sb
        .from('inventory_items')
        .select('*')
        .eq('district_id', districtId!)
        .order('category'),
    [districtId],
  )

  const { data: municipalities } = useSupabaseQuery<DbMunicipality>(
    (sb) =>
      sb
        .from('municipalities')
        .select('id, name')
        .eq('district_id', districtId!)
        .order('name'),
    [districtId],
  )

  const { data: allScenarios } = useSupabaseQuery<Pick<DbScenario, 'id' | 'title' | 'handbook'>>(
    (sb) =>
      sb
        .from('scenarios')
        .select('id, title, handbook')
        .eq('district_id', districtId!)
        .order('title'),
    [districtId],
  )

  // Scenario links — fetch all for this district's items
  const itemIds = useMemo(() => items.map((i) => i.id), [items])
  const { data: scenarioLinks, refetch: refetchLinks } = useSupabaseQuery<DbInventoryScenarioLink>(
    (sb) => {
      if (itemIds.length === 0) return sb.from('inventory_scenario_links').select('*').limit(0)
      return sb.from('inventory_scenario_links').select('*').in('inventory_item_id', itemIds)
    },
    [itemIds.join(',')],
  )

  // ─── Filtering ───
  const filtered = useMemo(() => {
    let result = items

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (i) =>
          i.category.toLowerCase().includes(q) ||
          i.kategorie?.toLowerCase().includes(q) ||
          i.location?.toLowerCase().includes(q),
      )
    }
    if (filterKategorie) result = result.filter((i) => i.kategorie === filterKategorie)
    if (filterPriority) result = result.filter((i) => i.priority === filterPriority)
    if (filterGemeinde) result = result.filter((i) => i.municipality_id === filterGemeinde)
    if (filterSzenario) {
      const linkedItemIds = new Set(
        scenarioLinks.filter((l) => l.scenario_id === filterSzenario).map((l) => l.inventory_item_id),
      )
      result = result.filter((i) => linkedItemIds.has(i.id))
    }
    if (filterStatus) {
      result = result.filter((i) => {
        const pct = getPercent(i.current_quantity, i.target_quantity)
        if (filterStatus === 'ok') return pct >= 90
        if (filterStatus === 'niedrig') return pct >= 60 && pct < 90
        if (filterStatus === 'kritisch') return pct < 60
        return true
      })
    }

    return result
  }, [items, searchQuery, filterKategorie, filterPriority, filterGemeinde, filterSzenario, filterStatus, scenarioLinks])

  // ─── Sorting (applied after filtering) ───
  const sortedItems = useMemo(() => {
    if (!sortKey) return filtered

    return [...filtered].sort((a, b) => {
      let cmp = 0

      switch (sortKey) {
        case 'category':
          cmp = a.category.localeCompare(b.category, 'de')
          break
        case 'kategorie':
          cmp = (a.kategorie ?? '').localeCompare(b.kategorie ?? '', 'de')
          break
        case 'priority': {
          const pa = a.priority ? (PRIORITY_ORDER[a.priority] ?? 99) : 99
          const pb = b.priority ? (PRIORITY_ORDER[b.priority] ?? 99) : 99
          cmp = pa - pb
          break
        }
        case 'target_quantity':
          cmp = a.target_quantity - b.target_quantity
          break
        case 'current_quantity':
          cmp = a.current_quantity - b.current_quantity
          break
        case 'price_per_unit':
          cmp = (a.price_per_unit ?? -1) - (b.price_per_unit ?? -1)
          break
        case 'totalCost': {
          const ca =
            a.price_per_unit && a.target_quantity ? a.price_per_unit * a.target_quantity : -1
          const cb =
            b.price_per_unit && b.target_quantity ? b.price_per_unit * b.target_quantity : -1
          cmp = ca - cb
          break
        }
        case 'location':
          cmp = (a.location ?? '').localeCompare(b.location ?? '', 'de')
          break
        case 'coverage':
          cmp =
            getPercent(a.current_quantity, a.target_quantity) -
            getPercent(b.current_quantity, b.target_quantity)
          break
      }

      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const hasActiveFilters = searchQuery || filterKategorie || filterPriority || filterGemeinde || filterSzenario || filterStatus

  const clearAllFilters = () => {
    setSearchQuery('')
    setFilterKategorie(null)
    setFilterPriority(null)
    setFilterGemeinde(null)
    setFilterSzenario(null)
    setFilterStatus(null)
  }

  // ─── CRUD ───
  const openCreate = () => {
    setEditId(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (item: DbInventoryItem) => {
    setEditId(item.id)
    const itemScenarioIds = scenarioLinks
      .filter((l) => l.inventory_item_id === item.id)
      .map((l) => l.scenario_id)
    setForm({
      category: item.category,
      kategorie: item.kategorie || '',
      priority: item.priority || '',
      unit: item.unit,
      target_quantity: item.target_quantity ? String(item.target_quantity) : '',
      current_quantity: item.current_quantity ? String(item.current_quantity) : '',
      price_per_unit: item.price_per_unit ? String(item.price_per_unit) : '',
      location: item.location || '',
      municipality_id: item.municipality_id || '',
      scenario_ids: itemScenarioIds,
      condition: item.condition || '',
      responsible: item.responsible || '',
    })
    setShowModal(true)
  }

  const toggleScenario = (sid: string) => {
    setForm((prev) => ({
      ...prev,
      scenario_ids: prev.scenario_ids.includes(sid)
        ? prev.scenario_ids.filter((id) => id !== sid)
        : [...prev.scenario_ids, sid],
    }))
  }

  const handleSave = async () => {
    if (!form.category.trim() || !districtId) return
    setSaving(true)
    try {
      const payload = {
        category: form.category.trim(),
        kategorie: form.kategorie || null,
        priority: (form.priority || null) as DbInventoryItem['priority'],
        unit: form.unit,
        target_quantity: form.target_quantity ? Number(form.target_quantity) : 0,
        current_quantity: form.current_quantity ? Number(form.current_quantity) : 0,
        price_per_unit: form.price_per_unit ? Number(form.price_per_unit) : null,
        location: form.location.trim() || null,
        municipality_id: form.municipality_id || null,
        condition: (form.condition || null) as DbInventoryItem['condition'],
        responsible: form.responsible.trim() || null,
      }

      let itemId = editId
      if (editId) {
        const { error } = await supabase
          .from('inventory_items')
          .update(payload)
          .eq('id', editId)
          .eq('district_id', districtId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('inventory_items')
          .insert({ ...payload, district_id: districtId })
          .select('id')
          .single()
        if (error) throw error
        itemId = data.id
      }

      // Sync scenario links
      if (itemId) {
        await supabase.from('inventory_scenario_links').delete().eq('inventory_item_id', itemId)
        if (form.scenario_ids.length > 0) {
          const links = form.scenario_ids.map((sid) => ({
            inventory_item_id: itemId!,
            scenario_id: sid,
          }))
          await supabase.from('inventory_scenario_links').insert(links)
        }
      }

      refetch()
      refetchLinks()
      setShowModal(false)
      setForm(EMPTY_FORM)
      setEditId(null)
    } catch (err) {
      console.error('Inventar-Item speichern fehlgeschlagen:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !districtId) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', deleteTarget.id)
        .eq('district_id', districtId)
      if (error) throw error
      refetch()
      refetchLinks()
      setDeleteTarget(null)
    } catch (err) {
      console.error('Inventar-Item löschen fehlgeschlagen:', err)
    } finally {
      setDeleting(false)
    }
  }

  const handleAiRecommendation = async () => {
    if (!districtId) return
    setAiLoading(true)
    setAiError(null)
    setAiSuccess(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) throw new Error('Nicht angemeldet.')

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-inventory-recommendation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ districtId }),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Unbekannter Fehler')

      setAiSuccess(
        `KI hat ${result.updatedCount} Soll-Mengen aktualisiert und ${result.createdCount} neue Kategorien hinzugefügt.`,
      )
      refetch()
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Verbindungsfehler.')
    } finally {
      setAiLoading(false)
    }
  }

  // ─── Loading state ───
  if (districtLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // ─── Computed stats ───
  const totalTarget = items.reduce((sum, i) => sum + i.target_quantity, 0)
  const totalCurrent = items.reduce((sum, i) => sum + i.current_quantity, 0)
  const overallPercent = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0
  const underMin = items.filter((i) => getPercent(i.current_quantity, i.target_quantity) < 60).length
  const totalBudget = items.reduce((sum, i) => {
    if (i.price_per_unit && i.target_quantity) return sum + i.price_per_unit * i.target_quantity
    return sum
  }, 0)

  // Unique categories used
  const usedKategorien = [...new Set(items.map((i) => i.kategorie).filter(Boolean))] as string[]

  return (
    <div>
      <PageHeader
        title="KI-Inventar"
        description="Professionelle Bestandsverwaltung mit Soll/Ist-Vergleich, Kostenplanung und Szenario-Zuordnung."
        actions={
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary">
              <Upload className="h-4 w-4" />
              CSV-Import
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={handleAiRecommendation}
              disabled={aiLoading}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analysiere...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> KI-Empfehlung
                </>
              )}
            </button>
          </div>
        }
      />

      {/* KI Loading Banner */}
      {aiLoading && (
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-primary-200 bg-primary-50 p-5">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
            <Sparkles className="absolute h-4 w-4 text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-primary-900">KI analysiert Ihr Inventar...</p>
            <p className="text-sm text-primary-700">
              Die KI prüft Soll-Mengen anhand Ihres Risikoprofils und der Bevölkerungszahl. Dies kann 15–30 Sekunden
              dauern.
            </p>
          </div>
        </div>
      )}

      {/* KI Success Banner */}
      {aiSuccess && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5">
          <p className="font-semibold text-green-900">KI-Empfehlung abgeschlossen</p>
          <p className="text-sm text-green-700">{aiSuccess}</p>
        </div>
      )}

      {/* KI Error Banner */}
      {aiError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-900">Fehler bei der KI-Empfehlung</p>
          <p className="text-sm text-red-700">{aiError}</p>
        </div>
      )}

      {/* ═══ Summary Stats (4 Cards) ═══ */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="flex items-center gap-2">
            <Euro className="h-4 w-4 text-text-muted" />
            <p className="text-sm text-text-secondary">Gesamtkosten (Soll)</p>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-text-primary">
            {totalBudget > 0 ? formatCurrency(totalBudget) : '–'}
          </p>
          <p className="mt-1 text-xs text-text-muted">Basierend auf Einzelpreisen × Soll-Menge</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="text-sm text-text-secondary">Gesamt-Abdeckung</p>
          <p className="mt-1 text-2xl font-extrabold text-text-primary">{overallPercent}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-secondary">
            <div className={`h-full rounded-full ${getBarColor(overallPercent)}`} style={{ width: `${overallPercent}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="text-sm text-text-secondary">Artikel</p>
          <p className="mt-1 text-2xl font-extrabold text-text-primary">{items.length}</p>
          <p className="mt-1 text-xs text-text-muted">{usedKategorien.length} Kategorien</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="text-sm text-text-secondary">Kritisch fehlend</p>
          <p className={`mt-1 text-2xl font-extrabold ${underMin > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {underMin}
          </p>
          <p className="mt-1 text-xs text-text-muted">Abdeckung unter 60%</p>
        </div>
      </div>

      {/* ═══ Filter-Bar ═══ */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary-300"
            placeholder="Artikel suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Kategorie */}
        <select
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-text-secondary outline-none"
          value={filterKategorie || ''}
          onChange={(e) => setFilterKategorie(e.target.value || null)}
        >
          <option value="">Alle Kategorien</option>
          {KATEGORIE_OPTIONS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>

        {/* Priorität */}
        <select
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-text-secondary outline-none"
          value={filterPriority || ''}
          onChange={(e) => setFilterPriority(e.target.value || null)}
        >
          <option value="">Alle Prioritäten</option>
          {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.label}
            </option>
          ))}
        </select>

        {/* Gemeinde */}
        <select
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-text-secondary outline-none"
          value={filterGemeinde || ''}
          onChange={(e) => setFilterGemeinde(e.target.value || null)}
        >
          <option value="">Alle Gemeinden</option>
          {municipalities.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        {/* Szenario */}
        <select
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-text-secondary outline-none"
          value={filterSzenario || ''}
          onChange={(e) => setFilterSzenario(e.target.value || null)}
        >
          <option value="">Alle Szenarien</option>
          {allScenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-text-secondary outline-none"
          value={filterStatus || ''}
          onChange={(e) => setFilterStatus(e.target.value || null)}
        >
          <option value="">Alle Status</option>
          <option value="ok">OK (≥90%)</option>
          <option value="niedrig">Niedrig (60–89%)</option>
          <option value="kritisch">Kritisch (&lt;60%)</option>
        </select>
      </div>

      {/* Active filters */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {searchQuery && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
              Suche: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="ml-0.5 text-primary-400 hover:text-primary-600">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filterKategorie && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
              {filterKategorie}
              <button onClick={() => setFilterKategorie(null)} className="ml-0.5 text-primary-400 hover:text-primary-600">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filterPriority && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
              {PRIORITY_CONFIG[filterPriority]?.label}
              <button onClick={() => setFilterPriority(null)} className="ml-0.5 text-primary-400 hover:text-primary-600">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filterGemeinde && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
              {municipalities.find((m) => m.id === filterGemeinde)?.name}
              <button onClick={() => setFilterGemeinde(null)} className="ml-0.5 text-primary-400 hover:text-primary-600">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filterSzenario && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
              {allScenarios.find((s) => s.id === filterSzenario)?.title}
              <button onClick={() => setFilterSzenario(null)} className="ml-0.5 text-primary-400 hover:text-primary-600">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filterStatus && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
              Status: {filterStatus === 'ok' ? 'OK' : filterStatus === 'niedrig' ? 'Niedrig' : 'Kritisch'}
              <button onClick={() => setFilterStatus(null)} className="ml-0.5 text-primary-400 hover:text-primary-600">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <button onClick={clearAllFilters} className="text-xs text-primary-600 hover:underline">
            Alle Filter zurücksetzen
          </button>
        </div>
      )}

      {/* ═══ Bestandstabelle ═══ */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-text-primary">
            Bestandsübersicht
            {hasActiveFilters && (
              <span className="ml-2 text-sm font-normal text-text-muted">
                ({filtered.length} von {items.length})
              </span>
            )}
          </h2>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 text-sm text-primary-600 transition-colors hover:text-primary-700"
          >
            <Plus className="h-4 w-4" />
            Hinzufügen
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-secondary">
              {items.length === 0
                ? 'Noch keine Inventar-Einträge vorhanden.'
                : 'Keine Einträge für die gewählten Filter.'}
            </p>
          </div>
        ) : (
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  <th className="px-4 py-3">
                    <button onClick={() => handleSort('category')} className="flex items-center whitespace-nowrap text-[11px] font-medium uppercase tracking-wider text-text-muted hover:text-text-primary">
                      Artikel <SortIcon col="category" sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button onClick={() => handleSort('kategorie')} className="flex items-center whitespace-nowrap text-[11px] font-medium uppercase tracking-wider text-text-muted hover:text-text-primary">
                      Kategorie <SortIcon col="kategorie" sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button onClick={() => handleSort('priority')} className="flex items-center whitespace-nowrap text-[11px] font-medium uppercase tracking-wider text-text-muted hover:text-text-primary">
                      Prio <SortIcon col="priority" sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button onClick={() => handleSort('target_quantity')} className="ml-auto flex items-center whitespace-nowrap text-[11px] font-medium uppercase tracking-wider text-text-muted hover:text-text-primary">
                      Soll <SortIcon col="target_quantity" sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button onClick={() => handleSort('current_quantity')} className="ml-auto flex items-center whitespace-nowrap text-[11px] font-medium uppercase tracking-wider text-text-muted hover:text-text-primary">
                      Ist <SortIcon col="current_quantity" sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="whitespace-nowrap px-4 py-3">Einheit</th>
                  <th className="px-4 py-3 text-right">
                    <button onClick={() => handleSort('price_per_unit')} className="ml-auto flex items-center whitespace-nowrap text-[11px] font-medium uppercase tracking-wider text-text-muted hover:text-text-primary">
                      Preis/Einh. <SortIcon col="price_per_unit" sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button onClick={() => handleSort('totalCost')} className="ml-auto flex items-center whitespace-nowrap text-[11px] font-medium uppercase tracking-wider text-text-muted hover:text-text-primary">
                      Gesamtkosten <SortIcon col="totalCost" sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button onClick={() => handleSort('location')} className="flex items-center whitespace-nowrap text-[11px] font-medium uppercase tracking-wider text-text-muted hover:text-text-primary">
                      Lagerort <SortIcon col="location" sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="whitespace-nowrap px-4 py-3">Gemeinde</th>
                  <th className="whitespace-nowrap px-4 py-3">Szenario</th>
                  <th className="px-4 py-3">
                    <button onClick={() => handleSort('coverage')} className="flex items-center whitespace-nowrap text-[11px] font-medium uppercase tracking-wider text-text-muted hover:text-text-primary">
                      Abdeckung <SortIcon col="coverage" sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="whitespace-nowrap px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedItems.map((item) => {
                  const pct = getPercent(item.current_quantity, item.target_quantity)
                  const prio = item.priority ? PRIORITY_CONFIG[item.priority] : null
                  const municipalityName = municipalities.find((m) => m.id === item.municipality_id)?.name
                  const itemScenarios = scenarioLinks
                    .filter((l) => l.inventory_item_id === item.id)
                    .map((l) => allScenarios.find((s) => s.id === l.scenario_id))
                    .filter(Boolean) as Pick<DbScenario, 'id' | 'title'>[]
                  const totalCost =
                    item.price_per_unit && item.target_quantity
                      ? item.price_per_unit * item.target_quantity
                      : null

                  return (
                    <tr
                      key={item.id}
                      onClick={() => openEdit(item)}
                      className="cursor-pointer transition-colors hover:bg-surface-secondary/50"
                    >
                      {/* Artikel */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="text-sm font-medium text-text-primary">{item.category}</span>
                      </td>

                      {/* Kategorie */}
                      <td className="whitespace-nowrap px-4 py-3">
                        {item.kategorie ? (
                          <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                            {item.kategorie}
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">–</span>
                        )}
                      </td>

                      {/* Priorität */}
                      <td className="whitespace-nowrap px-4 py-3">
                        {prio ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${prio.bg} ${prio.text}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${prio.dot}`} />
                            {prio.label}
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">–</span>
                        )}
                      </td>

                      {/* Soll */}
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-text-primary">
                        {item.target_quantity.toLocaleString('de-DE')}
                      </td>

                      {/* Ist */}
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-text-primary">
                        {item.current_quantity.toLocaleString('de-DE')}
                      </td>

                      {/* Einheit */}
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-text-secondary">{item.unit}</td>

                      {/* Preis/Einheit */}
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-text-secondary">
                        {item.price_per_unit ? formatCurrency(item.price_per_unit) : '–'}
                      </td>

                      {/* Gesamtkosten */}
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-text-primary">
                        {totalCost ? formatCurrency(totalCost) : '–'}
                      </td>

                      {/* Lagerort */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                        {item.location || '–'}
                      </td>

                      {/* Gemeinde */}
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                        {municipalityName || '–'}
                      </td>

                      {/* Szenario */}
                      <td className="px-4 py-3">
                        {itemScenarios.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {itemScenarios.slice(0, 2).map((sc) => (
                              <span
                                key={sc.id}
                                className="inline-block rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700"
                              >
                                {sc.title.length > 15 ? sc.title.slice(0, 13) + '…' : sc.title}
                              </span>
                            ))}
                            {itemScenarios.length > 2 && (
                              <span className="inline-block rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-text-muted">
                                +{itemScenarios.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted">–</span>
                        )}
                      </td>

                      {/* Abdeckung */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-surface-secondary">
                            <div
                              className={`h-full rounded-full ${getBarColor(pct)}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-text-primary">{pct}%</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge variant={pct >= 90 ? 'success' : pct >= 60 ? 'warning' : 'danger'}>
                          {pct >= 90 ? 'OK' : pct >= 60 ? 'Niedrig' : 'Kritisch'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <RowActions onEdit={() => openEdit(item)} onDelete={() => setDeleteTarget(item)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* ═══ Create / Edit Modal ═══ */}
      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setShowSzenarioDropdown(false)
        }}
        title={editId ? 'Inventar-Artikel bearbeiten' : 'Inventar-Artikel hinzufügen'}
        size="lg"
      >
        {/* Artikel */}
        <FormField label="Artikel / Bezeichnung" required>
          <input
            className={inputClass}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="z.B. Sandsäcke 20kg, Feldbetten Alu, Trinkwasser 1L"
          />
        </FormField>

        {/* Kategorie + Priorität */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <FormField label="Kategorie">
            <select
              className={selectClass}
              value={form.kategorie}
              onChange={(e) => setForm({ ...form, kategorie: e.target.value })}
            >
              <option value="">Keine Kategorie</option>
              {KATEGORIE_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Priorität">
            <select
              className={selectClass}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="">Keine Priorität</option>
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Soll-Menge + Ist-Menge */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <FormField label="Soll-Menge">
            <input
              type="number"
              className={inputClass}
              value={form.target_quantity}
              onChange={(e) => setForm({ ...form, target_quantity: e.target.value })}
              placeholder="z.B. 5000"
            />
          </FormField>
          <FormField label="Ist-Menge">
            <input
              type="number"
              className={inputClass}
              value={form.current_quantity}
              onChange={(e) => setForm({ ...form, current_quantity: e.target.value })}
              placeholder="z.B. 3200"
            />
          </FormField>
        </div>

        {/* Einheit + Preis */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <FormField label="Einheit" required>
            <select
              className={selectClass}
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Preis pro Einheit (€)">
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={form.price_per_unit}
              onChange={(e) => setForm({ ...form, price_per_unit: e.target.value })}
              placeholder="z.B. 2.50"
            />
          </FormField>
        </div>

        {/* Lagerort + Gemeinde */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <FormField label="Lagerort">
            <input
              className={inputClass}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="z.B. Katastrophenschutzlager Thale"
            />
          </FormField>
          <FormField label="Gemeinde">
            <select
              className={selectClass}
              value={form.municipality_id}
              onChange={(e) => setForm({ ...form, municipality_id: e.target.value })}
            >
              <option value="">Keine Gemeinde</option>
              {municipalities.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Zustand + Verantwortlich */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <FormField label="Zustand">
            <select
              className={selectClass}
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
            >
              <option value="">Nicht angegeben</option>
              {CONDITION_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Verantwortlich">
            <input
              className={inputClass}
              value={form.responsible}
              onChange={(e) => setForm({ ...form, responsible: e.target.value })}
              placeholder="z.B. Max Müller, THW"
            />
          </FormField>
        </div>

        {/* Szenario Multi-Select */}
        <FormField label="Szenarien">
          <div ref={szenarioDropdownRef} className="relative">
            <div
              onClick={() => setShowSzenarioDropdown(!showSzenarioDropdown)}
              className={`${inputClass} flex min-h-[42px] cursor-pointer flex-wrap items-center gap-1`}
            >
              {form.scenario_ids.length === 0 && (
                <span className="text-sm text-text-muted">Szenarien zuordnen...</span>
              )}
              {form.scenario_ids.map((sid) => {
                const sc = allScenarios.find((s) => s.id === sid)
                return sc ? (
                  <span
                    key={sid}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700"
                  >
                    {sc.title.length > 25 ? sc.title.slice(0, 23) + '…' : sc.title}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleScenario(sid)
                      }}
                      className="text-primary-400 hover:text-primary-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : null
              })}
            </div>
            {showSzenarioDropdown && (
              <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-white shadow-lg">
                {allScenarios.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-text-muted">Keine Szenarien vorhanden</p>
                ) : (
                  allScenarios.map((sc) => (
                    <label
                      key={sc.id}
                      className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-surface-secondary"
                    >
                      <input
                        type="checkbox"
                        checked={form.scenario_ids.includes(sc.id)}
                        onChange={() => toggleScenario(sc.id)}
                        className="rounded border-border text-primary-600"
                      />
                      {sc.title}
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        </FormField>

        <ModalFooter
          onCancel={() => {
            setShowModal(false)
            setShowSzenarioDropdown(false)
          }}
          onSubmit={handleSave}
          submitLabel={editId ? 'Änderungen speichern' : 'Artikel speichern'}
          loading={saving}
          disabled={!form.category.trim()}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Inventar-Artikel löschen"
        message={`Möchten Sie "${deleteTarget?.category}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        loading={deleting}
      />
    </div>
  )
}

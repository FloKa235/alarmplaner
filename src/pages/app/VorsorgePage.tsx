/**
 * VorsorgePage — Notfallvorsorge / Vorratsliste
 *
 * Features:
 * - Zeitraum-Selector (1 Woche, 2 Wochen, 1 Monat, 3 Monate) mit dynamischem Soll-Faktor
 * - Kategorie-Übersicht oben: farbige Chips mit Progress-Ring, Klick → scroll zur Kategorie
 * - Inline +/- Buttons für current_qty (kein Modal nötig)
 * - Reichhaltigere Zeilen: Subcategory, Produktname, Notizen, MHD
 * - Filter, Suche, Add/Edit Modal
 */
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  Package, Search, Plus, Minus, CheckCircle2,
  Circle, X, Calendar, Loader2, Apple,
  Droplets, Sparkles, Heart, Flashlight, Wrench, FileText,
  Baby, PawPrint, Filter, Clock,
} from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { useCitizenInventory, type InventoryStats } from '@/hooks/useCitizenInventory'
import { useCitizenHousehold } from '@/hooks/useCitizenHousehold'
import { useCitizenLocation } from '@/hooks/useCitizenLocation'
import { germanDistricts } from '@/data/german-districts'
import type { DbCitizenInventory, DbCitizenInventoryInsert, CitizenInventoryCategory } from '@/types/database'

// ─── Category Config ──────────────────────────────────────

const CATEGORY_ORDER: CitizenInventoryCategory[] = [
  'getraenke', 'lebensmittel', 'hygiene', 'medikamente',
  'notfallausruestung', 'werkzeuge', 'dokumente', 'babybedarf', 'tierbedarf',
]

const CATEGORY_CONFIG: Record<CitizenInventoryCategory, {
  name: string
  icon: typeof Package
  color: string
  bgLight: string
  bgChip: string
  ringColor: string
  borderColor: string
}> = {
  getraenke: { name: 'Getränke', icon: Droplets, color: 'text-blue-600', bgLight: 'bg-blue-50', bgChip: 'bg-blue-50 border-blue-200', ringColor: 'stroke-blue-500', borderColor: 'border-blue-200' },
  lebensmittel: { name: 'Lebensmittel', icon: Apple, color: 'text-green-600', bgLight: 'bg-green-50', bgChip: 'bg-green-50 border-green-200', ringColor: 'stroke-green-500', borderColor: 'border-green-200' },
  hygiene: { name: 'Hygiene', icon: Sparkles, color: 'text-purple-600', bgLight: 'bg-purple-50', bgChip: 'bg-purple-50 border-purple-200', ringColor: 'stroke-purple-500', borderColor: 'border-purple-200' },
  medikamente: { name: 'Medikamente', icon: Heart, color: 'text-red-600', bgLight: 'bg-red-50', bgChip: 'bg-red-50 border-red-200', ringColor: 'stroke-red-500', borderColor: 'border-red-200' },
  notfallausruestung: { name: 'Notfallausrüstung', icon: Flashlight, color: 'text-amber-600', bgLight: 'bg-amber-50', bgChip: 'bg-amber-50 border-amber-200', ringColor: 'stroke-amber-500', borderColor: 'border-amber-200' },
  werkzeuge: { name: 'Werkzeuge', icon: Wrench, color: 'text-gray-600', bgLight: 'bg-gray-50', bgChip: 'bg-gray-50 border-gray-200', ringColor: 'stroke-gray-500', borderColor: 'border-gray-200' },
  dokumente: { name: 'Dokumente', icon: FileText, color: 'text-slate-600', bgLight: 'bg-slate-50', bgChip: 'bg-slate-50 border-slate-200', ringColor: 'stroke-slate-500', borderColor: 'border-slate-200' },
  babybedarf: { name: 'Baby', icon: Baby, color: 'text-pink-600', bgLight: 'bg-pink-50', bgChip: 'bg-pink-50 border-pink-200', ringColor: 'stroke-pink-500', borderColor: 'border-pink-200' },
  tierbedarf: { name: 'Tiere', icon: PawPrint, color: 'text-orange-600', bgLight: 'bg-orange-50', bgChip: 'bg-orange-50 border-orange-200', ringColor: 'stroke-orange-500', borderColor: 'border-orange-200' },
}

// Full names for category sections
const CATEGORY_FULL_NAMES: Record<CitizenInventoryCategory, string> = {
  getraenke: 'Getränke',
  lebensmittel: 'Lebensmittel',
  hygiene: 'Hygiene',
  medikamente: 'Medikamente',
  notfallausruestung: 'Notfallausrüstung',
  werkzeuge: 'Werkzeuge',
  dokumente: 'Dokumente & Bargeld',
  babybedarf: 'Babybedarf',
  tierbedarf: 'Tierbedarf',
}

// ─── Zeitraum Config ──────────────────────────────────────

interface ZeitraumOption {
  id: string
  label: string
  shortLabel: string
  days: number
  factor: number // relativ zu 10-Tage-Basis
}

const ZEITRAUM_OPTIONS: ZeitraumOption[] = [
  { id: '7d', label: '1 Woche', shortLabel: '1W', days: 7, factor: 0.7 },
  { id: '14d', label: '2 Wochen', shortLabel: '2W', days: 14, factor: 1.4 },
  { id: '30d', label: '1 Monat', shortLabel: '1M', days: 30, factor: 3.0 },
  { id: '90d', label: '3 Monate', shortLabel: '3M', days: 90, factor: 9.0 },
]

type StatusFilter = 'alle' | 'fehlend' | 'ablaufend' | 'komplett'

// ─── MHD Helper ───────────────────────────────────────────

function getMhdStatus(expiryDate: string | null): { label: string; color: string } | null {
  if (!expiryDate) return null
  const now = new Date()
  const exp = new Date(expiryDate)
  const diffDays = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: 'Abgelaufen', color: 'bg-red-100 text-red-700' }
  if (diffDays < 30) return { label: `${diffDays}d`, color: 'bg-orange-100 text-orange-700' }
  if (diffDays < 180) return { label: `${Math.floor(diffDays / 30)} Mon.`, color: 'bg-yellow-100 text-yellow-700' }
  return { label: `${Math.floor(diffDays / 30)} Mon.`, color: 'bg-green-100 text-green-700' }
}

// ─── Mini Progress Ring ──────────────────────────────────

function ProgressRing({ percent, colorClass, size = 32 }: { percent: number; colorClass: string; size?: number }) {
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-surface-secondary"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={`transition-all duration-500 ${colorClass}`}
      />
    </svg>
  )
}

// ─── Page Component ───────────────────────────────────────

export default function VorsorgePage() {
  const { items, loading, stats, toggleChecked, updateItem, addItem, deleteItem, generateFromTemplate } = useCitizenInventory()
  const { household, hasCompletedOnboarding } = useCitizenHousehold()
  const { location } = useCitizenLocation()
  const [generating, setGenerating] = useState(false)
  const autoGenerateAttempted = useRef(false)

  // Active category tab (first one with items, or first in order)
  const [activeCategory, setActiveCategory] = useState<CitizenInventoryCategory | null>(null)

  // ─── Auto-Generate wenn Liste leer + Onboarding abgeschlossen ──
  useEffect(() => {
    if (loading) return
    if (items.length > 0) return
    if (generating) return
    if (autoGenerateAttempted.current) return
    if (!hasCompletedOnboarding) return
    if (!location) return

    autoGenerateAttempted.current = true
    const run = async () => {
      setGenerating(true)
      try {
        const district = germanDistricts.find(d => d.agsCode === location.districtAgs)
        await generateFromTemplate(household, location, district?.state || '')
      } catch (err) {
        console.error('Auto-Generierung fehlgeschlagen:', err)
      } finally {
        setGenerating(false)
      }
    }
    run()
  }, [loading, items.length, generating, hasCompletedOnboarding, location, household, generateFromTemplate])

  // ─── State ──────────────────────────────────────────────
  const [zeitraum, setZeitraum] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('alarmplaner-zeitraum') || '14d'
      // Migrate old "10d" values
      if (saved === '10d') return '14d'
      return saved
    } catch { return '14d' }
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('alle')
  const [editItem, setEditItem] = useState<DbCitizenInventory | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const zeitraumOption = ZEITRAUM_OPTIONS.find(z => z.id === zeitraum) || ZEITRAUM_OPTIONS[1]

  const handleZeitraumChange = (id: string) => {
    setZeitraum(id)
    try { localStorage.setItem('alarmplaner-zeitraum', id) } catch { /* ignore */ }
  }

  // Scale target_qty by zeitraum factor
  const getScaledTarget = useCallback((baseTarget: number) => {
    return Math.ceil(baseTarget * zeitraumOption.factor)
  }, [zeitraumOption.factor])

  // ─── Filtered Items ──────────────────────────────────

  const filteredItems = useMemo(() => {
    let filtered = items

    // Filter by active category
    if (activeCategory) {
      filtered = filtered.filter(i => i.category === activeCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(i =>
        i.item_name.toLowerCase().includes(q) ||
        (i.product_name?.toLowerCase().includes(q)) ||
        (i.notes?.toLowerCase().includes(q)) ||
        (i.subcategory?.toLowerCase().includes(q))
      )
    }

    if (statusFilter === 'fehlend') {
      filtered = filtered.filter(i => i.current_qty === 0 && i.target_qty > 0)
    } else if (statusFilter === 'ablaufend') {
      const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(i => i.expiry_date && new Date(i.expiry_date) < in30)
    } else if (statusFilter === 'komplett') {
      filtered = filtered.filter(i => i.current_qty >= getScaledTarget(i.target_qty))
    }

    // Sort alphabetically by item_name
    filtered.sort((a, b) => a.item_name.localeCompare(b.item_name, 'de'))

    return filtered
  }, [items, searchQuery, statusFilter, getScaledTarget, activeCategory])

  // Category stats — quantity-based progress (current_qty / scaledTarget per item)
  const allCategoryStats = useMemo(() => {
    const result: Record<string, { total: number; fulfilled: number; percent: number; missing: number }> = {}
    const allGroups: Record<string, DbCitizenInventory[]> = {}
    for (const item of items) {
      if (!allGroups[item.category]) allGroups[item.category] = []
      allGroups[item.category].push(item)
    }
    for (const [cat, catItems] of Object.entries(allGroups)) {
      let fulfilled = 0
      let missing = 0
      let totalProgress = 0
      for (const item of catItems) {
        const target = getScaledTarget(item.target_qty)
        const itemProgress = target > 0 ? Math.min(1, item.current_qty / target) : (item.current_qty > 0 ? 1 : 0)
        totalProgress += itemProgress
        if (item.current_qty >= target && target > 0) {
          fulfilled++
        } else if (item.current_qty === 0) {
          missing++
        }
      }
      result[cat] = {
        total: catItems.length,
        fulfilled,
        percent: catItems.length > 0 ? Math.round((totalProgress / catItems.length) * 100) : 0,
        missing,
      }
    }
    return result
  }, [items, getScaledTarget])

  // Categories that have items — known + custom
  const availableCategories = useMemo(() => {
    const known = CATEGORY_ORDER.filter(cat => allCategoryStats[cat]?.total > 0)
    // Add any custom categories not in CATEGORY_ORDER
    const customCats = Object.keys(allCategoryStats)
      .filter(cat => !CATEGORY_ORDER.includes(cat as CitizenInventoryCategory) && allCategoryStats[cat].total > 0)
      .sort((a, b) => a.localeCompare(b, 'de'))
    return [...known, ...customCats as CitizenInventoryCategory[]]
  }, [allCategoryStats])

  // Auto-select first category if none active
  useEffect(() => {
    if (!activeCategory && availableCategories.length > 0) {
      setActiveCategory(availableCategories[0])
    } else if (activeCategory && !availableCategories.includes(activeCategory)) {
      setActiveCategory(availableCategories[0] || null)
    }
  }, [availableCategories, activeCategory])

  // Overall quantity-based progress across all items
  const overallQtyProgress = useMemo(() => {
    if (items.length === 0) return 0
    let totalProgress = 0
    for (const item of items) {
      const target = getScaledTarget(item.target_qty)
      totalProgress += target > 0 ? Math.min(1, item.current_qty / target) : (item.current_qty > 0 ? 1 : 0)
    }
    return Math.round((totalProgress / items.length) * 100)
  }, [items, getScaledTarget])

  // ─── Inline Qty Change ──────────────────────────────

  const handleQtyChange = useCallback(async (id: string, delta: number) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const newQty = Math.max(0, item.current_qty + delta)
    await updateItem(id, { current_qty: newQty })
  }, [items, updateItem])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Notfallvorsorge"
        description={`Vorrat für ${household.household_persons} Person${household.household_persons !== 1 ? 'en' : ''} nach BBK-Empfehlung`}
      />

      {/* Zeitraum-Selector */}
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-white p-3">
        <div className="flex items-center gap-2 text-text-muted">
          <Clock className="h-4 w-4" />
          <span className="hidden text-xs font-medium sm:inline">Vorrat für</span>
        </div>
        <div className="flex flex-1 gap-1.5">
          {ZEITRAUM_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => handleZeitraumChange(opt.id)}
              className={`flex-1 rounded-xl px-2 py-2 text-center text-xs font-semibold transition-all ${
                zeitraum === opt.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-secondary/80'
              }`}
            >
              <span className="hidden sm:inline">{opt.label}</span>
              <span className="sm:hidden">{opt.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Kategorie-Tabs ─────────────────────────────── */}
      {items.length > 0 && (
        <div className="mb-4 overflow-x-auto rounded-2xl border border-border bg-white">
          <div className="flex min-w-max">
            {availableCategories.map(cat => {
              const config = CATEGORY_CONFIG[cat]
              const stat = allCategoryStats[cat]
              if (!stat) return null
              const Icon = config?.icon || Package
              const isActive = activeCategory === cat
              const isComplete = stat.percent === 100
              const color = config?.color || 'text-indigo-600'
              const ringColor = config?.ringColor || 'stroke-indigo-500'

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex flex-col items-center gap-1 px-3.5 py-3 text-center transition-all border-b-2 min-w-[72px] ${
                    isActive
                      ? `border-current ${color} bg-white`
                      : 'border-transparent text-text-muted hover:text-text-secondary hover:bg-surface-secondary/40'
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    <ProgressRing
                      percent={stat.percent}
                      colorClass={isComplete ? 'stroke-green-500' : isActive ? ringColor : 'stroke-gray-300'}
                      size={28}
                    />
                    <Icon className={`absolute h-3 w-3 ${isActive ? color : 'text-text-muted'}`} />
                  </div>
                  <span className={`text-[10px] font-semibold leading-tight ${isActive ? color : ''}`}>
                    {config?.name || cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </span>
                  <span className={`text-[9px] leading-tight ${
                    isComplete ? 'text-green-600' : stat.missing > 0 ? 'text-red-500' : 'text-text-muted'
                  }`}>
                    {isComplete ? '✓' : `${stat.fulfilled}/${stat.total}`}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <StatsRow stats={stats} zeitraumLabel={zeitraumOption.label} qtyProgress={overallQtyProgress} />

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Artikel suchen..."
            className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-text-muted" />
          {(['alle', 'fehlend', 'ablaufend', 'komplett'] as StatusFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === f
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-secondary/80'
              }`}
            >
              {f === 'alle' ? 'Alle' : f === 'fehlend' ? 'Fehlend' : f === 'ablaufend' ? 'Ablaufend' : 'Komplett'}
              {f === 'fehlend' && stats.missingItems > 0 && (
                <span className="ml-1 rounded-full bg-red-500 px-1.5 text-[10px] text-white">{stats.missingItems}</span>
              )}
              {f === 'ablaufend' && (stats.expiringItems + stats.expiredItems) > 0 && (
                <span className="ml-1 rounded-full bg-orange-500 px-1.5 text-[10px] text-white">{stats.expiringItems + stats.expiredItems}</span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Artikel
        </button>
      </div>

      {/* Items — single category at a time */}
      <div className="mt-4">
        {items.length === 0 && !generating && !location ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <Package className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Standort erforderlich</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
              Bitte lege zuerst deinen Standort in den Einstellungen fest, damit wir
              eine personalisierte Vorratsliste erstellen können.
            </p>
          </div>
        ) : generating ? (
          <div className="rounded-2xl border border-border bg-white p-12 text-center">
            <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-primary-600" />
            <h3 className="text-lg font-bold text-text-primary">Vorratsliste wird erstellt…</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Deine personalisierte Liste wird berechnet — einen Moment bitte.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-8 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-secondary">Keine Artikel gefunden.</p>
          </div>
        ) : activeCategory ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            {/* Column Headers */}
            <div className="flex items-center gap-3 border-b border-border/50 bg-surface-secondary/50 px-5 py-2">
              <div className="w-5 shrink-0" />
              <p className="min-w-0 flex-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Artikel</p>
              <div className="flex items-center gap-1.5">
                <div className="w-7" />
                <p className="w-14 text-center text-[10px] font-semibold uppercase tracking-wider text-text-muted">Ist/Soll</p>
                <div className="w-7" />
                <p className="hidden w-8 text-right text-[10px] font-semibold uppercase tracking-wider text-text-muted sm:block">Einh.</p>
              </div>
            </div>

            {/* Items */}
            {filteredItems.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                scaledTarget={getScaledTarget(item.target_qty)}
                onToggle={() => toggleChecked(item.id)}
                onEdit={() => setEditItem(item)}
                onQtyChange={(delta) => handleQtyChange(item.id, delta)}
              />
            ))}

            {/* Category Add Button */}
            <button
              onClick={() => {
                setShowAddModal(true)
              }}
              className="flex w-full items-center justify-center gap-2 border-t border-border/50 px-5 py-3 text-xs font-medium text-text-muted transition-colors hover:bg-surface-secondary/40 hover:text-primary-600"
            >
              <Plus className="h-3.5 w-3.5" />
              Artikel zu {CATEGORY_CONFIG[activeCategory]?.name || activeCategory} hinzufügen
            </button>
          </div>
        ) : null}
      </div>

      {/* Edit Modal */}
      {editItem && (
        <EditItemModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={async (updates) => {
            await updateItem(editItem.id, updates)
            setEditItem(null)
          }}
          onDelete={editItem.is_custom ? async () => {
            await deleteItem(editItem.id)
            setEditItem(null)
          } : undefined}
        />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          defaultCategory={activeCategory || 'lebensmittel'}
          onSave={async (item) => {
            await addItem(item)
            setShowAddModal(false)
          }}
        />
      )}
    </div>
  )
}

// ─── Stats Row ────────────────────────────────────────────

function StatsRow({ stats, zeitraumLabel, qtyProgress }: { stats: InventoryStats; zeitraumLabel: string; qtyProgress: number }) {
  const fulfilledItems = stats.totalItems - stats.missingItems
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatMini
        label="Abdeckung"
        value={`${qtyProgress}%`}
        sub={`${fulfilledItems}/${stats.totalItems} Artikel vorrätig`}
        color={qtyProgress >= 80 ? 'text-green-600' : qtyProgress >= 40 ? 'text-amber-600' : 'text-red-600'}
      />
      <StatMini
        label="Zeitraum"
        value={zeitraumLabel}
        sub="Vorratsdauer"
        color="text-text-primary"
      />
      <StatMini
        label="Ablaufend"
        value={String(stats.expiringItems + stats.expiredItems)}
        sub={stats.expiredItems > 0 ? `${stats.expiredItems} abgelaufen` : 'in 30 Tagen'}
        color={stats.expiringItems + stats.expiredItems > 0 ? 'text-orange-600' : 'text-green-600'}
      />
      <StatMini
        label="Fehlend"
        value={String(stats.missingItems)}
        sub="Menge = 0"
        color={stats.missingItems > 0 ? 'text-red-600' : 'text-green-600'}
      />
    </div>
  )
}

function StatMini({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-text-muted">{sub}</p>
    </div>
  )
}

// ─── Item Row ─────────────────────────────────────────────

function ItemRow({
  item, scaledTarget, onToggle, onEdit, onQtyChange,
}: {
  item: DbCitizenInventory
  scaledTarget: number
  onToggle: () => void
  onEdit: () => void
  onQtyChange: (delta: number) => void
}) {
  const mhd = getMhdStatus(item.expiry_date)
  const qtyPercent = scaledTarget > 0 ? Math.min(100, Math.round((item.current_qty / scaledTarget) * 100)) : 0
  const isFulfilled = item.current_qty >= scaledTarget

  return (
    <div className="border-b border-border/50 px-5 py-3 last:border-b-0 transition-colors hover:bg-surface-secondary/30">
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <button onClick={onToggle} className="shrink-0">
          {item.is_checked ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-border" />
          )}
        </button>

        {/* Name + Meta — klickbar für Edit */}
        <div className="min-w-0 flex-1 cursor-pointer" onClick={onEdit}>
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium ${item.is_checked ? 'text-text-muted line-through' : 'text-text-primary'}`}>
              {item.item_name}
            </p>
            {item.is_regional && (
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                Regional
              </span>
            )}
            {item.subcategory && (
              <span className="hidden rounded bg-surface-secondary px-1.5 py-0.5 text-[10px] font-medium text-text-muted sm:inline">
                {item.subcategory}
              </span>
            )}
          </div>
          {/* Second line: product name, notes, MHD */}
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {item.product_name && (
              <span className="text-xs text-text-secondary">{item.product_name}</span>
            )}
            {item.notes && !item.product_name && (
              <span className="text-xs text-text-muted line-clamp-1">{item.notes}</span>
            )}
            {mhd && (
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${mhd.color}`}>
                MHD: {mhd.label}
              </span>
            )}
          </div>
        </div>

        {/* Inline Qty Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onQtyChange(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary"
          >
            <Minus className="h-3 w-3" />
          </button>
          <div className="w-14 text-center">
            <span className={`text-xs font-bold ${
              isFulfilled ? 'text-green-600' : item.current_qty > 0 ? 'text-amber-600' : 'text-red-500'
            }`}>
              {item.current_qty}
            </span>
            <span className="text-xs text-text-muted">/{scaledTarget}</span>
            <div className="mx-auto mt-0.5 h-1 w-full rounded-full bg-surface-secondary">
              <div
                className={`h-1 rounded-full transition-all ${
                  qtyPercent >= 100 ? 'bg-green-500' : qtyPercent > 0 ? 'bg-amber-500' : 'bg-red-400'
                }`}
                style={{ width: `${qtyPercent}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => onQtyChange(1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary"
          >
            <Plus className="h-3 w-3" />
          </button>
          <span className="hidden w-8 text-right text-[10px] text-text-muted sm:block">{item.unit}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Item Modal ──────────────────────────────────────

function EditItemModal({
  item, onClose, onSave, onDelete,
}: {
  item: DbCitizenInventory
  onClose: () => void
  onSave: (updates: Partial<DbCitizenInventoryInsert>) => Promise<void>
  onDelete?: () => Promise<void>
}) {
  const [currentQty, setCurrentQty] = useState(item.current_qty)
  const [productName, setProductName] = useState(item.product_name || '')
  const [expiryDate, setExpiryDate] = useState(item.expiry_date || '')
  const [purchaseDate, setPurchaseDate] = useState(item.purchase_date || '')
  const [notes, setNotes] = useState(item.notes || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave({
      current_qty: currentQty,
      product_name: productName || null,
      expiry_date: expiryDate || null,
      purchase_date: purchaseDate || null,
      notes: notes || null,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="font-bold text-text-primary">{item.item_name}</h3>
            {item.subcategory && (
              <p className="text-xs text-text-muted">{item.subcategory}</p>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-text-muted hover:bg-surface-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Aktuelle Menge ({item.unit}) — Ziel: {item.target_qty}
            </label>
            <input
              type="number"
              value={currentQty}
              onChange={(e) => setCurrentQty(Number(e.target.value))}
              min={0}
              step={0.1}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Produktname (optional)</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="z.B. Volvic 6er Pack"
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                <Calendar className="mr-1 inline h-3.5 w-3.5" />MHD
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Kaufdatum</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Notizen</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          {onDelete ? (
            <button
              onClick={onDelete}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Löschen
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Add Item Modal ───────────────────────────────────────

function AddItemModal({
  onClose, onSave, defaultCategory = 'lebensmittel',
}: {
  onClose: () => void
  onSave: (item: Omit<DbCitizenInventoryInsert, 'user_id'>) => Promise<void>
  defaultCategory?: CitizenInventoryCategory
}) {
  const [itemName, setItemName] = useState('')
  const [category, setCategory] = useState<string>(defaultCategory)
  const [customCategory, setCustomCategory] = useState('')
  const [targetQty, setTargetQty] = useState(1)
  const [unit, setUnit] = useState('Stk')
  const [saving, setSaving] = useState(false)

  const effectiveCategory = category === '__custom__' ? customCategory.trim().toLowerCase().replace(/\s+/g, '_') : category

  const handleSave = async () => {
    if (!itemName.trim()) return
    if (category === '__custom__' && !customCategory.trim()) return
    setSaving(true)
    await onSave({
      category: effectiveCategory as CitizenInventoryCategory,
      item_name: itemName.trim(),
      target_qty: targetQty,
      current_qty: 0,
      unit,
      is_custom: true,
      is_regional: false,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="font-bold text-text-primary">Neuen Artikel hinzufügen</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-text-muted hover:bg-surface-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Artikelname *</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="z.B. Gaskocher Kartuschen"
              autoFocus
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Kategorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none"
            >
              {Object.entries(CATEGORY_CONFIG).map(([key]) => (
                <option key={key} value={key}>{CATEGORY_FULL_NAMES[key as CitizenInventoryCategory]}</option>
              ))}
              <option value="__custom__">+ Neue Kategorie…</option>
            </select>
            {category === '__custom__' && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="z.B. Camping, Outdoor, Technik"
                className="mt-2 w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                autoFocus
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Zielmenge</label>
              <input
                type="number"
                value={targetQty}
                onChange={(e) => setTargetQty(Number(e.target.value))}
                min={1}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Einheit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none"
              >
                {['Stk', 'kg', 'L', 'Pkg', 'Paar', 'Rollen', 'Set', 'EUR', 'Flasche'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={!itemName.trim() || saving || (category === '__custom__' && !customCategory.trim())}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  )
}

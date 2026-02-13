import { useState, useEffect, useCallback } from 'react'
import { ClipboardList, Plus, Check, Trash2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Modal, { FormField, ModalFooter, inputClass } from '@/components/ui/Modal'

// ─── Types ────────────────────────────────────────────

interface ChecklistItem {
  id: string
  label: string
  quantity: string
  checked: boolean
}

interface ChecklistCategory {
  id: string
  name: string
  items: ChecklistItem[]
}

// ─── Default-Daten (BBK-Empfehlung) ──────────────────

const DEFAULT_CATEGORIES: ChecklistCategory[] = [
  {
    id: 'cat-1',
    name: 'Wasser',
    items: [
      { id: 'i-1', label: 'Trinkwasser (2L pro Person/Tag)', quantity: '14L', checked: false },
      { id: 'i-2', label: 'Wasserkanister', quantity: '2×', checked: false },
      { id: 'i-3', label: 'Wasserentkeimungstabletten', quantity: '1×', checked: false },
    ],
  },
  {
    id: 'cat-2',
    name: 'Lebensmittel',
    items: [
      { id: 'i-4', label: 'Konserven (Gemüse, Obst, Fleisch)', quantity: '10×', checked: false },
      { id: 'i-5', label: 'Nudeln & Reis', quantity: '2 kg', checked: false },
      { id: 'i-6', label: 'Knäckebrot / Zwieback', quantity: '500 g', checked: false },
      { id: 'i-7', label: 'Zucker, Salz, Gewürze', quantity: 'je 1×', checked: false },
      { id: 'i-8', label: 'Energieriegel', quantity: '10×', checked: false },
      { id: 'i-9', label: 'Honig / Marmelade', quantity: '2×', checked: false },
    ],
  },
  {
    id: 'cat-3',
    name: 'Hygiene & Gesundheit',
    items: [
      { id: 'i-10', label: 'Erste-Hilfe-Set', quantity: '1×', checked: false },
      { id: 'i-11', label: 'Persönliche Medikamente', quantity: '', checked: false },
      { id: 'i-12', label: 'Desinfektionsmittel', quantity: '1×', checked: false },
      { id: 'i-13', label: 'Seife / Waschzeug', quantity: '1×', checked: false },
      { id: 'i-14', label: 'Toilettenpapier', quantity: '6 Rollen', checked: false },
      { id: 'i-15', label: 'Müllbeutel', quantity: '1 Rolle', checked: false },
    ],
  },
  {
    id: 'cat-4',
    name: 'Technik & Licht',
    items: [
      { id: 'i-16', label: 'Taschenlampe + Ersatzbatterien', quantity: '1×', checked: false },
      { id: 'i-17', label: 'Kurbelradio (UKW)', quantity: '1×', checked: false },
      { id: 'i-18', label: 'Powerbank (vollgeladen)', quantity: '1×', checked: false },
      { id: 'i-19', label: 'Kerzen + Streichhölzer', quantity: '5×', checked: false },
      { id: 'i-20', label: 'Campingkocher + Brennstoff', quantity: '1×', checked: false },
    ],
  },
  {
    id: 'cat-5',
    name: 'Dokumente & Bargeld',
    items: [
      { id: 'i-21', label: 'Personalausweis / Reisepass (Kopie)', quantity: '', checked: false },
      { id: 'i-22', label: 'Bargeld in kleinen Scheinen', quantity: '500 €', checked: false },
      { id: 'i-23', label: 'Versicherungspolicen (Kopie)', quantity: '', checked: false },
      { id: 'i-24', label: 'Impfausweis', quantity: '', checked: false },
    ],
  },
]

const STORAGE_KEY = 'alarmplaner-checkliste'

function generateId() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ─── LocalStorage Helpers ─────────────────────────────

function loadCategories(): ChecklistCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ChecklistCategory[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // invalid data, use defaults
  }
  return structuredClone(DEFAULT_CATEGORIES)
}

function saveCategories(cats: ChecklistCategory[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cats))
}

// ─── Component ────────────────────────────────────────

export default function ChecklistenPage() {
  const [categories, setCategories] = useState<ChecklistCategory[]>(loadCategories)
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set())

  // Modal state: Neuer Artikel
  const [showAddItem, setShowAddItem] = useState(false)
  const [addToCatId, setAddToCatId] = useState<string | null>(null)
  const [newLabel, setNewLabel] = useState('')
  const [newQuantity, setNewQuantity] = useState('')

  // Modal state: Neue Kategorie
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  // Persist on every change
  useEffect(() => {
    saveCategories(categories)
  }, [categories])

  // ─── Stats ──────────────────────────────────────────
  const totalItems = categories.reduce((s, c) => s + c.items.length, 0)
  const checkedItems = categories.reduce((s, c) => s + c.items.filter((i) => i.checked).length, 0)
  const percent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0

  // ─── Actions ────────────────────────────────────────

  const toggleItem = useCallback((catId: string, itemId: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === catId
          ? {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId ? { ...item, checked: !item.checked } : item
              ),
            }
          : cat
      )
    )
  }, [])

  const deleteItem = useCallback((catId: string, itemId: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === catId
          ? { ...cat, items: cat.items.filter((item) => item.id !== itemId) }
          : cat
      ).filter((cat) => cat.items.length > 0) // remove empty categories
    )
  }, [])

  const deleteCategory = useCallback((catId: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== catId))
  }, [])

  const handleAddItem = () => {
    if (!newLabel.trim() || !addToCatId) return
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === addToCatId
          ? {
              ...cat,
              items: [
                ...cat.items,
                { id: generateId(), label: newLabel.trim(), quantity: newQuantity.trim(), checked: false },
              ],
            }
          : cat
      )
    )
    setShowAddItem(false)
    setNewLabel('')
    setNewQuantity('')
    setAddToCatId(null)
  }

  const handleAddCategory = () => {
    if (!newCatName.trim()) return
    setCategories((prev) => [
      ...prev,
      { id: generateId(), name: newCatName.trim(), items: [] },
    ])
    setShowAddCategory(false)
    setNewCatName('')
  }

  const resetToDefaults = () => {
    setCategories(structuredClone(DEFAULT_CATEGORIES))
    setCollapsedCats(new Set())
  }

  const toggleCollapse = (catId: string) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  // ─── Render ─────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Vorrats-Checkliste"
        description="Persönliche Notfall-Vorratsliste nach BBK-Empfehlung. Vorrat für 10 Tage."
        actions={
          <div className="flex gap-2">
            <button
              onClick={resetToDefaults}
              className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
            >
              <RotateCcw className="h-4 w-4" />
              Zurücksetzen
            </button>
            <button
              onClick={() => setShowAddCategory(true)}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Kategorie
            </button>
          </div>
        }
      />

      {/* Progress bar */}
      <div className="mb-8 rounded-2xl border border-border bg-white p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">Fortschritt</span>
          <span className="text-sm font-bold text-primary-600">{percent}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-surface-secondary">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percent}%`,
              background:
                percent === 100
                  ? 'linear-gradient(to right, #22c55e, #16a34a)'
                  : 'linear-gradient(to right, #2563eb, #60a5fa)',
            }}
          />
        </div>
        <p className="mt-2 text-xs text-text-muted">
          {checkedItems} von {totalItems} Artikeln erledigt
          {percent === 100 && ' ✓ Komplett!'}
        </p>
      </div>

      {/* Empty state */}
      {categories.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
          <ClipboardList className="mx-auto mb-4 h-12 w-12 text-text-muted" />
          <p className="text-text-secondary">Keine Kategorien vorhanden.</p>
          <button
            onClick={resetToDefaults}
            className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            BBK-Standardliste laden
          </button>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const catChecked = cat.items.filter((i) => i.checked).length
          const catTotal = cat.items.length
          const isCollapsed = collapsedCats.has(cat.id)

          return (
            <div key={cat.id} className="rounded-2xl border border-border bg-white">
              {/* Category Header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <button
                  onClick={() => toggleCollapse(cat.id)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <ClipboardList className="h-5 w-5 text-primary-600" />
                  <h3 className="font-semibold text-text-primary">{cat.name}</h3>
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4 text-text-muted" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-text-muted" />
                  )}
                </button>
                <div className="flex items-center gap-3">
                  {/* Mini progress */}
                  {catTotal > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-secondary">
                        <div
                          className="h-full rounded-full bg-primary-500 transition-all duration-300"
                          style={{ width: `${catTotal > 0 ? (catChecked / catTotal) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-text-muted">
                        {catChecked}/{catTotal}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                    title="Kategorie löschen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Items (collapsible) */}
              {!isCollapsed && (
                <>
                  {catTotal === 0 ? (
                    <div className="px-5 py-6 text-center text-sm text-text-muted">
                      Noch keine Artikel in dieser Kategorie.
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {cat.items.map((item) => (
                        <div
                          key={item.id}
                          className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-secondary/50"
                        >
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleItem(cat.id, item.id)}
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                              item.checked
                                ? 'border-primary-600 bg-primary-600 text-white'
                                : 'border-border bg-white hover:border-primary-400'
                            }`}
                          >
                            {item.checked && <Check className="h-3 w-3" />}
                          </button>

                          {/* Label */}
                          <span
                            className={`flex-1 text-sm transition-colors ${
                              item.checked ? 'text-text-muted line-through' : 'text-text-primary'
                            }`}
                          >
                            {item.label}
                          </span>

                          {/* Quantity */}
                          {item.quantity && (
                            <span className="text-xs font-medium text-text-muted">{item.quantity}</span>
                          )}

                          {/* Delete button (visible on hover) */}
                          <button
                            onClick={() => deleteItem(cat.id, item.id)}
                            className="flex h-6 w-6 items-center justify-center rounded text-text-muted opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                            title="Entfernen"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add item button */}
                  <div className="px-5 py-3">
                    <button
                      onClick={() => {
                        setAddToCatId(cat.id)
                        setShowAddItem(true)
                      }}
                      className="flex items-center gap-1.5 text-sm text-primary-600 transition-colors hover:text-primary-700"
                    >
                      <Plus className="h-4 w-4" />
                      Artikel hinzufügen
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Info */}
      <div className="mt-8 rounded-xl bg-primary-50 p-4">
        <p className="text-xs leading-relaxed text-primary-700">
          <strong>Empfehlung des BBK:</strong> Jeder Haushalt sollte einen Notvorrat für mindestens
          10 Tage vorhalten. Diese Liste basiert auf der offiziellen Checkliste des
          Bundesamts für Bevölkerungsschutz und Katastrophenhilfe. Deine Checkliste wird
          lokal auf diesem Gerät gespeichert.
        </p>
      </div>

      {/* ─── Modal: Artikel hinzufügen ─────────────────── */}
      <Modal
        open={showAddItem}
        onClose={() => {
          setShowAddItem(false)
          setNewLabel('')
          setNewQuantity('')
        }}
        title="Artikel hinzufügen"
        size="sm"
      >
        <FormField label="Bezeichnung" required>
          <input
            className={inputClass}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="z. B. Taschenlampe"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          />
        </FormField>
        <FormField label="Menge (optional)">
          <input
            className={inputClass}
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            placeholder="z. B. 2×, 500 g, 1 Packung"
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          />
        </FormField>
        <ModalFooter
          onCancel={() => {
            setShowAddItem(false)
            setNewLabel('')
            setNewQuantity('')
          }}
          onSubmit={handleAddItem}
          submitLabel="Hinzufügen"
          disabled={!newLabel.trim()}
        />
      </Modal>

      {/* ─── Modal: Neue Kategorie ─────────────────────── */}
      <Modal
        open={showAddCategory}
        onClose={() => {
          setShowAddCategory(false)
          setNewCatName('')
        }}
        title="Neue Kategorie"
        size="sm"
      >
        <FormField label="Kategorie-Name" required>
          <input
            className={inputClass}
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="z. B. Kleidung & Schutz"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          />
        </FormField>
        <ModalFooter
          onCancel={() => {
            setShowAddCategory(false)
            setNewCatName('')
          }}
          onSubmit={handleAddCategory}
          submitLabel="Erstellen"
          disabled={!newCatName.trim()}
        />
      </Modal>
    </div>
  )
}

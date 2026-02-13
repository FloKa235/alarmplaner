import { useState, useEffect } from 'react'
import { Package, CheckCircle2, AlertTriangle, XCircle, HelpCircle, Plus, Trash2, Loader2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import type { ScenarioHandbook, DbInventoryItem } from '@/types/database'

// ─── Types ──────────────────────────────────────────
type InventarItem = NonNullable<ScenarioHandbook['inventar']>[number]
type MatchStatus = 'ausreichend' | 'niedrig' | 'kritisch' | 'nicht_vorhanden'

interface MatchResult {
  empfehlung: InventarItem
  liveItem: DbInventoryItem | null
  percent: number
  status: MatchStatus
}

interface InventarTabProps {
  handbook: ScenarioHandbook
  districtId: string
  onUpdateHandbook?: (section: string, data: InventarItem[]) => Promise<void>
  saving?: boolean
  isEditing?: boolean
  onStopEditing?: () => void
}

// ─── Status-Config ──────────────────────────────────
const statusConfig: Record<MatchStatus, { icon: typeof CheckCircle2; color: string; bg: string; label: string; badgeVariant: 'success' | 'warning' | 'danger' | 'default' }> = {
  ausreichend:     { icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-50',  label: 'Ausreichend',     badgeVariant: 'success' },
  niedrig:         { icon: AlertTriangle, color: 'text-amber-600',  bg: 'bg-amber-50',  label: 'Niedrig',         badgeVariant: 'warning' },
  kritisch:        { icon: XCircle,       color: 'text-red-600',    bg: 'bg-red-50',    label: 'Kritisch',        badgeVariant: 'danger'  },
  nicht_vorhanden: { icon: HelpCircle,    color: 'text-gray-500',   bg: 'bg-gray-50',   label: 'Nicht vorhanden', badgeVariant: 'default' },
}

const EINHEITEN = ['Stück', 'kg', 'Liter', 'Paletten', 'Karton', 'Satz']

// ─── Matching-Logik ─────────────────────────────────
function matchInventory(empfehlungen: InventarItem[], liveItems: DbInventoryItem[]): MatchResult[] {
  return empfehlungen.map(emp => {
    const live = liveItems.find(
      item => item.category.toLowerCase().trim() === emp.kategorie.toLowerCase().trim()
    )

    if (!live) {
      return { empfehlung: emp, liveItem: null, percent: 0, status: 'nicht_vorhanden' as const }
    }

    const percent = emp.empfohlene_menge > 0
      ? Math.round((live.current_quantity / emp.empfohlene_menge) * 100)
      : 100

    let status: MatchStatus
    if (percent >= 100) status = 'ausreichend'
    else if (percent >= 60) status = 'niedrig'
    else status = 'kritisch'

    return { empfehlung: emp, liveItem: live, percent, status }
  })
}

// ─── Fortschrittsbalken-Farbe ───────────────────────
function getBarColor(percent: number): string {
  if (percent >= 100) return 'bg-green-500'
  if (percent >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

// ─── Komponente ─────────────────────────────────────
export default function InventarTab({ handbook, districtId, onUpdateHandbook, saving, isEditing = false, onStopEditing }: InventarTabProps) {
  const inventar = handbook.inventar || []
  const [editData, setEditData] = useState<InventarItem[] | null>(null)

  // ─── Live-Inventar laden ─────────────────────────
  const { data: liveInventory, loading: inventoryLoading } = useSupabaseQuery<DbInventoryItem>(
    (sb) =>
      sb
        .from('inventory_items')
        .select('*')
        .eq('district_id', districtId)
        .order('category'),
    [districtId]
  )

  // ─── Edit-Modus ──────────────────────────────────
  useEffect(() => {
    if (isEditing && !editData) {
      setEditData(JSON.parse(JSON.stringify(inventar)))
    }
    if (!isEditing) {
      setEditData(null)
    }
  }, [isEditing]) // eslint-disable-line react-hooks/exhaustive-deps

  const cancelEditing = () => {
    setEditData(null)
    onStopEditing?.()
  }

  const saveEditing = async () => {
    if (!editData || !onUpdateHandbook) return
    const cleaned = editData
      .filter(item => item.kategorie.trim())
      .map(item => ({
        kategorie: item.kategorie.trim(),
        empfohlene_menge: item.empfohlene_menge,
        einheit: item.einheit,
        begruendung: item.begruendung.trim(),
      }))
    await onUpdateHandbook('inventar', cleaned)
    onStopEditing?.()
  }

  const updateField = (index: number, field: keyof InventarItem, value: string | number) => {
    setEditData(prev => {
      if (!prev) return prev
      return prev.map((item, i) => i === index ? { ...item, [field]: value } : item)
    })
  }

  const addItem = () => {
    setEditData(prev => prev ? [...prev, { kategorie: '', empfohlene_menge: 0, einheit: 'Stück', begruendung: '' }] : prev)
  }

  const removeItem = (index: number) => {
    setEditData(prev => prev ? prev.filter((_, i) => i !== index) : prev)
  }

  // ─── Loading ──────────────────────────────────────
  if (inventoryLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
        <span className="ml-2 text-sm text-text-muted">Lade Inventar-Daten…</span>
      </div>
    )
  }

  // ─── Empty State ──────────────────────────────────
  if (!isEditing && inventar.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
        <Package className="mx-auto mb-3 h-8 w-8 text-text-muted" />
        <p className="text-sm text-text-secondary">
          Keine szenario-spezifischen Inventar-Empfehlungen vorhanden.
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Generieren Sie das Krisenhandbuch erneut, um Inventar-Empfehlungen zu erhalten.
        </p>
      </div>
    )
  }

  const data = isEditing && editData ? editData : inventar
  const matches = matchInventory(data, liveInventory)

  // ─── Summary Stats ────────────────────────────────
  const stats = {
    total: matches.length,
    ausreichend: matches.filter(m => m.status === 'ausreichend').length,
    niedrig: matches.filter(m => m.status === 'niedrig').length,
    kritisch: matches.filter(m => m.status === 'kritisch' || m.status === 'nicht_vorhanden').length,
  }

  return (
    <div>
      {/* Summary-Leiste */}
      {!isEditing && (
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-white p-4 text-center">
            <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
            <p className="text-xs text-text-muted">Empfehlungen</p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.ausreichend}</p>
            <p className="text-xs text-green-600">Ausreichend</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.niedrig}</p>
            <p className="text-xs text-amber-600">Niedrig</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.kritisch}</p>
            <p className="text-xs text-red-600">Kritisch / Fehlend</p>
          </div>
        </div>
      )}

      {/* Inventar-Tabelle / Edit-Liste */}
      <div className="rounded-2xl border border-border bg-white">
        {isEditing ? (
          // ─── Edit-Modus ───────────────────────────
          <div className="divide-y divide-border">
            {(editData || []).map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                  <Package className="h-4 w-4 text-primary-600" />
                </div>
                <div className="grid flex-1 gap-3 sm:grid-cols-4">
                  <input
                    className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-text-primary focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                    value={item.kategorie}
                    onChange={(e) => updateField(i, 'kategorie', e.target.value)}
                    placeholder="Kategorie…"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      className="w-24 rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-text-primary focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                      value={item.empfohlene_menge}
                      onChange={(e) => updateField(i, 'empfohlene_menge', parseInt(e.target.value, 10) || 0)}
                    />
                    <select
                      className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm text-text-primary focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                      value={item.einheit}
                      onChange={(e) => updateField(i, 'einheit', e.target.value)}
                    >
                      {EINHEITEN.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <input
                    className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-text-primary focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 sm:col-span-2"
                    value={item.begruendung}
                    onChange={(e) => updateField(i, 'begruendung', e.target.value)}
                    placeholder="Begründung…"
                  />
                </div>
                <button
                  onClick={() => removeItem(i)}
                  className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <button
              onClick={addItem}
              className="flex w-full items-center justify-center gap-2 p-4 text-sm text-primary-600 transition-colors hover:bg-primary-50"
            >
              <Plus className="h-4 w-4" />
              Material hinzufügen
            </button>
          </div>
        ) : (
          // ─── Lese-Modus ───────────────────────────
          <div className="divide-y divide-border">
            {matches.map((m, i) => {
              const cfg = statusConfig[m.status]
              const StatusIcon = cfg.icon
              const istMenge = m.liveItem?.current_quantity ?? 0
              const clampedPercent = Math.min(m.percent, 100)

              return (
                <div key={i} className="flex items-center gap-4 p-4">
                  {/* Icon */}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
                    <StatusIcon className={`h-4 w-4 ${cfg.color}`} />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-text-primary">{m.empfehlung.kategorie}</p>
                      <Badge variant={cfg.badgeVariant}>{cfg.label}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-text-muted">{m.empfehlung.begruendung}</p>
                  </div>

                  {/* Mengen + Fortschritt */}
                  <div className="w-48 shrink-0 text-right">
                    <div className="flex items-baseline justify-end gap-1 text-sm">
                      <span className="font-semibold text-text-primary">{istMenge}</span>
                      <span className="text-text-muted">/</span>
                      <span className="text-text-secondary">{m.empfehlung.empfohlene_menge}</span>
                      <span className="text-xs text-text-muted">{m.empfehlung.einheit}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all ${getBarColor(m.percent)}`}
                        style={{ width: `${clampedPercent}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-text-muted">{m.percent}%</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Speichern/Abbrechen Toolbar (unten, nur im Edit-Modus) */}
      {isEditing && (
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={cancelEditing}
            disabled={saving}
            className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
          >
            Abbrechen
          </button>
          <button
            onClick={saveEditing}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Speichern…</> : 'Speichern'}
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * InventarReadonlySection — Read-only Inventar-Ansicht im Szenario-Detail
 *
 * Zeigt nur Items die mit diesem Szenario verlinkt sind.
 * Kein Anlegen, Bearbeiten oder Löschen möglich.
 */
import { useState, useMemo } from 'react'
import { Package, Search, Euro, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import type { DbInventoryItem, DbInventoryScenarioLink } from '@/types/database'

interface InventarReadonlySectionProps {
  scenarioId: string
  districtId: string
}

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  kritisch: { label: 'Kritisch', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  hoch: { label: 'Hoch', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  mittel: { label: 'Mittel', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  niedrig: { label: 'Niedrig', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
}

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

export default function InventarReadonlySection({
  scenarioId,
  districtId,
}: InventarReadonlySectionProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const { data: allDistrictItems, loading } = useSupabaseQuery<DbInventoryItem>(
    (sb) => sb.from('inventory_items').select('*').eq('district_id', districtId).order('category'),
    [districtId],
  )

  const allItemIds = useMemo(() => allDistrictItems.map(i => i.id), [allDistrictItems])
  const { data: scenarioLinks } = useSupabaseQuery<DbInventoryScenarioLink>(
    (sb) => {
      if (allItemIds.length === 0) return sb.from('inventory_scenario_links').select('*').limit(0)
      return sb.from('inventory_scenario_links').select('*').in('inventory_item_id', allItemIds).eq('scenario_id', scenarioId)
    },
    [allItemIds.join(','), scenarioId],
  )

  const linkedItemIds = useMemo(
    () => new Set(scenarioLinks.map(l => l.inventory_item_id)),
    [scenarioLinks],
  )

  const items = useMemo(
    () => allDistrictItems.filter(i => linkedItemIds.has(i.id)),
    [allDistrictItems, linkedItemIds],
  )

  const filtered = useMemo(() => {
    if (!searchQuery) return items
    const q = searchQuery.toLowerCase()
    return items.filter(i =>
      i.category.toLowerCase().includes(q) ||
      i.kategorie?.toLowerCase().includes(q) ||
      i.location?.toLowerCase().includes(q),
    )
  }, [items, searchQuery])

  if (loading) return null

  // Stats
  const totalTarget = items.reduce((sum, i) => sum + i.target_quantity, 0)
  const totalCurrent = items.reduce((sum, i) => sum + i.current_quantity, 0)
  const overallPercent = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0
  const underMin = items.filter(i => getPercent(i.current_quantity, i.target_quantity) < 60).length
  const totalBudget = items.reduce((sum, i) => {
    if (i.price_per_unit && i.target_quantity) return sum + i.price_per_unit * i.target_quantity
    return sum
  }, 0)

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <Package className="mx-auto mb-3 h-10 w-10 text-text-muted" />
        <h3 className="mb-1 text-base font-semibold text-text-primary">
          Kein Inventar zugeordnet
        </h3>
        <p className="mb-4 text-sm text-text-secondary">
          Diesem Szenario sind noch keine Inventar-Artikel zugeordnet. Inventar kann über die Inventar-Verwaltung zugeordnet werden.
        </p>
        <Link
          to="/pro/inventar"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
        >
          <ExternalLink className="h-4 w-4" />
          Zur Inventar-Verwaltung
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="flex items-center gap-2">
            <Euro className="h-4 w-4 text-text-muted" />
            <p className="text-sm text-text-secondary">Gesamtkosten (Soll)</p>
          </div>
          <p className="mt-1 text-xl font-extrabold text-text-primary">
            {totalBudget > 0 ? formatCurrency(totalBudget) : '–'}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm text-text-secondary">Gesamt-Abdeckung</p>
          <p className="mt-1 text-xl font-extrabold text-text-primary">{overallPercent}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-secondary">
            <div className={`h-full rounded-full ${getBarColor(overallPercent)}`} style={{ width: `${overallPercent}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm text-text-secondary">Artikel</p>
          <p className="mt-1 text-xl font-extrabold text-text-primary">{items.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm text-text-secondary">Kritisch fehlend</p>
          <p className={`mt-1 text-xl font-extrabold ${underMin > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {underMin}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">Abdeckung unter 60%</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary-300"
          placeholder="Artikel suchen..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-bold text-text-primary">
            Zugeordnetes Inventar
            {searchQuery && (
              <span className="ml-2 text-sm font-normal text-text-muted">
                ({filtered.length} von {items.length})
              </span>
            )}
          </h2>
          <Link
            to="/pro/inventar"
            className="flex items-center gap-1.5 text-sm text-primary-600 transition-colors hover:text-primary-700"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Inventar verwalten
          </Link>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-secondary">Keine Einträge für die Suche.</p>
          </div>
        ) : (
          <div className="max-h-[480px] overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  <th className="px-4 py-3">Artikel</th>
                  <th className="px-4 py-3">Kategorie</th>
                  <th className="px-4 py-3">Priorität</th>
                  <th className="px-4 py-3 text-right">Soll</th>
                  <th className="px-4 py-3 text-right">Ist</th>
                  <th className="px-4 py-3">Einheit</th>
                  <th className="px-4 py-3">Abdeckung</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(item => {
                  const pct = getPercent(item.current_quantity, item.target_quantity)
                  const prio = item.priority ? PRIORITY_CONFIG[item.priority] : null
                  return (
                    <tr key={item.id} className="transition-colors hover:bg-surface-secondary/50">
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="text-sm font-medium text-text-primary">{item.category}</span>
                        {item.location && (
                          <p className="text-xs text-text-muted">{item.location}</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {item.kategorie ? (
                          <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-text-secondary">{item.kategorie}</span>
                        ) : <span className="text-xs text-text-muted">–</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {prio ? (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${prio.bg} ${prio.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${prio.dot}`} />
                            {prio.label}
                          </span>
                        ) : <span className="text-xs text-text-muted">–</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-text-primary">
                        {item.target_quantity.toLocaleString('de-DE')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-text-primary">
                        {item.current_quantity.toLocaleString('de-DE')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-text-secondary">{item.unit}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-surface-secondary">
                            <div className={`h-full rounded-full ${getBarColor(pct)}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-medium text-text-primary">{pct}%</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge variant={pct >= 90 ? 'success' : pct >= 60 ? 'warning' : 'danger'}>
                          {pct >= 90 ? 'OK' : pct >= 60 ? 'Niedrig' : 'Kritisch'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

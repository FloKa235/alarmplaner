/**
 * useCitizenInventory — CRUD + Stats für Bürger-Vorratsliste
 *
 * Verwaltet citizen_inventory in Supabase.
 * generateFromTemplate() erstellt die initiale Vorratsliste basierend auf
 * BBK-Templates × Haushaltsgröße + regionale Risiko-Items.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { DbCitizenInventory, DbCitizenInventoryInsert, CitizenInventoryCategory } from '@/types/database'
import { BBK_CATEGORIES, calculateTargetQty } from '@/data/bbk-supply-templates'
import { detectRegionalRisks, getRegionalItems } from '@/data/regional-risk-items'
import type { CitizenHouseholdProfile } from '@/hooks/useCitizenHousehold'
import type { CitizenLocation } from '@/hooks/useCitizenLocation'

// ─── Stats ───────────────────────────────────────────────

export interface InventoryStats {
  totalItems: number
  checkedItems: number
  progressPercent: number
  expiringItems: number       // MHD < 30 Tage
  expiredItems: number        // MHD überschritten
  missingItems: number        // current_qty = 0
  categoriesTotal: number
  categoriesComplete: number
  categoryStats: Record<CitizenInventoryCategory, { total: number; checked: number; percent: number }>
}

// ─── Hook Return ─────────────────────────────────────────

interface UseCitizenInventoryReturn {
  items: DbCitizenInventory[]
  loading: boolean
  error: string | null
  stats: InventoryStats
  // CRUD
  toggleChecked: (id: string) => Promise<void>
  updateItem: (id: string, updates: Partial<DbCitizenInventoryInsert>) => Promise<void>
  addItem: (item: Omit<DbCitizenInventoryInsert, 'user_id'>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  // Generation
  generateFromTemplate: (
    household: CitizenHouseholdProfile,
    location: CitizenLocation,
    districtState: string,
  ) => Promise<boolean>
  // Refresh
  refetch: () => void
}

// ─── Hook ────────────────────────────────────────────────

export function useCitizenInventory(): UseCitizenInventoryReturn {
  const { user } = useAuth()
  const [items, setItems] = useState<DbCitizenInventory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  // ─── Deduplicate ───────────────────────────────────────
  // One-time cleanup: if duplicate item_name+category exist, keep only the first

  const deduplicateItems = useCallback(async (data: DbCitizenInventory[]): Promise<DbCitizenInventory[]> => {
    const seen = new Map<string, DbCitizenInventory>()
    const duplicateIds: string[] = []

    for (const item of data) {
      const key = `${item.category}::${item.item_name}`
      if (seen.has(key)) {
        // Keep the one with higher current_qty or is_checked, delete the other
        const existing = seen.get(key)!
        const keepExisting = existing.current_qty >= item.current_qty && (existing.is_checked || !item.is_checked)
        if (keepExisting) {
          duplicateIds.push(item.id)
        } else {
          duplicateIds.push(existing.id)
          seen.set(key, item)
        }
      } else {
        seen.set(key, item)
      }
    }

    if (duplicateIds.length > 0) {
      console.warn(`Bereinige ${duplicateIds.length} doppelte Inventar-Einträge`)
      // Delete in batches of 50
      for (let i = 0; i < duplicateIds.length; i += 50) {
        const batch = duplicateIds.slice(i, i + 50)
        await supabase.from('citizen_inventory').delete().in('id', batch)
      }
      return Array.from(seen.values())
    }

    return data
  }, [])

  // ─── Fetch ──────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }

    const currentRequestId = ++requestIdRef.current
    setLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('citizen_inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('category')
        .order('sort_order')

      if (currentRequestId !== requestIdRef.current) return

      if (queryError) {
        setError(queryError.message)
        setItems([])
      } else {
        const cleaned = await deduplicateItems((data as DbCitizenInventory[]) || [])
        setItems(cleaned)
      }
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [user, deduplicateItems])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // ─── Stats ──────────────────────────────────────────────

  const stats = useMemo<InventoryStats>(() => {
    const now = new Date()
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const categoryStatsMap = {} as Record<CitizenInventoryCategory, { total: number; checked: number; percent: number }>
    const categories: CitizenInventoryCategory[] = [
      'getraenke', 'lebensmittel', 'hygiene', 'medikamente',
      'notfallausruestung', 'werkzeuge', 'dokumente', 'babybedarf', 'tierbedarf',
    ]
    for (const cat of categories) {
      categoryStatsMap[cat] = { total: 0, checked: 0, percent: 0 }
    }

    let expiringItems = 0
    let expiredItems = 0
    let missingItems = 0
    let checkedItems = 0

    for (const item of items) {
      const catStats = categoryStatsMap[item.category as CitizenInventoryCategory]
      if (catStats) {
        catStats.total++
        if (item.is_checked) catStats.checked++
      }

      if (item.is_checked) checkedItems++
      if (item.current_qty === 0 && item.target_qty > 0) missingItems++

      if (item.expiry_date) {
        const expDate = new Date(item.expiry_date)
        if (expDate < now) {
          expiredItems++
        } else if (expDate < in30Days) {
          expiringItems++
        }
      }
    }

    // Calculate percentages
    for (const cat of categories) {
      const cs = categoryStatsMap[cat]
      cs.percent = cs.total > 0 ? Math.round((cs.checked / cs.total) * 100) : 0
    }

    const categoriesComplete = categories.filter(c => {
      const cs = categoryStatsMap[c]
      return cs.total > 0 && cs.checked === cs.total
    }).length

    const categoriesTotal = categories.filter(c => categoryStatsMap[c].total > 0).length

    return {
      totalItems: items.length,
      checkedItems,
      progressPercent: items.length > 0 ? Math.round((checkedItems / items.length) * 100) : 0,
      expiringItems,
      expiredItems,
      missingItems,
      categoriesTotal,
      categoriesComplete,
      categoryStats: categoryStatsMap,
    }
  }, [items])

  // ─── CRUD ───────────────────────────────────────────────

  const toggleChecked = useCallback(async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return

    const newChecked = !item.is_checked
    // Optimistic update
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_checked: newChecked } : i))

    const { error } = await supabase
      .from('citizen_inventory')
      .update({ is_checked: newChecked })
      .eq('id', id)

    if (error) {
      // Revert
      setItems(prev => prev.map(i => i.id === id ? { ...i, is_checked: !newChecked } : i))
      console.error('Toggle fehlgeschlagen:', error)
    }
  }, [items])

  const updateItem = useCallback(async (id: string, updates: Partial<DbCitizenInventoryInsert>) => {
    // Optimistic update
    const prevItems = items
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } as DbCitizenInventory : i))

    const { error } = await supabase
      .from('citizen_inventory')
      .update(updates)
      .eq('id', id)

    if (error) {
      // Revert on failure
      setItems(prevItems)
      console.error('Update fehlgeschlagen:', error)
      throw error
    }
  }, [items])

  const addItem = useCallback(async (item: Omit<DbCitizenInventoryInsert, 'user_id'>) => {
    if (!user) return

    const { error } = await supabase
      .from('citizen_inventory')
      .insert({ ...item, user_id: user.id })

    if (error) {
      console.error('Insert fehlgeschlagen:', error)
      throw error
    }

    fetchItems()
  }, [user, fetchItems])

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('citizen_inventory')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete fehlgeschlagen:', error)
      throw error
    }

    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  // ─── Generate from Template ─────────────────────────────

  const generateFromTemplate = useCallback(async (
    household: CitizenHouseholdProfile,
    location: CitizenLocation,
    districtState: string,
  ): Promise<boolean> => {
    if (!user) return false

    try {
      // 0. Check if items already exist — prevent duplicates
      const { count } = await supabase
        .from('citizen_inventory')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (count && count > 0) {
        console.warn('Vorratsliste existiert bereits, überspringe Generierung')
        await fetchItems()
        return true
      }

      // 1. BBK Standard-Items
      const inserts: DbCitizenInventoryInsert[] = []
      let sortOrder = 0

      for (const category of BBK_CATEGORIES) {
        // Skip conditional categories if not applicable
        if (category.conditional === 'babies' && household.household_babies === 0) continue
        if (category.conditional === 'pets' && !household.household_pets) continue

        for (const item of category.items) {
          const persons = item.scaleType === 'per_person'
            ? (category.conditional === 'babies'
                ? household.household_babies
                : household.household_persons)
            : 1

          inserts.push({
            user_id: user.id,
            category: item.category as CitizenInventoryCategory,
            subcategory: item.subcategory ?? null,
            item_name: item.itemName,
            target_qty: calculateTargetQty(item, persons),
            current_qty: 0,
            unit: item.unit,
            notes: item.notes ?? null,
            is_custom: false,
            is_regional: false,
            sort_order: sortOrder++,
          })
        }
      }

      // 2. Regionale Risiko-Items
      const riskIds = detectRegionalRisks(location.districtName, districtState, location.lat)
      const regionalItems = getRegionalItems(riskIds)

      for (const rItem of regionalItems) {
        const persons = rItem.scaleType === 'per_person' ? household.household_persons : 1
        const qty = rItem.scaleType === 'per_household'
          ? rItem.qtyPerPerson10Days
          : Math.ceil(rItem.qtyPerPerson10Days * persons)

        inserts.push({
          user_id: user.id,
          category: rItem.category as CitizenInventoryCategory,
          item_name: rItem.itemName,
          target_qty: qty,
          current_qty: 0,
          unit: rItem.unit,
          notes: rItem.notes ?? null,
          is_custom: false,
          is_regional: true,
          sort_order: sortOrder++,
        })
      }

      // 3. Batch-Insert (Supabase erlaubt bis 1000 Rows per Insert)
      if (inserts.length > 0) {
        const { error } = await supabase
          .from('citizen_inventory')
          .insert(inserts)

        if (error) throw error
      }

      // 4. Refresh
      await fetchItems()
      return true
    } catch (err) {
      console.error('Vorratsliste generieren fehlgeschlagen:', err)
      return false
    }
  }, [user, fetchItems])

  return {
    items,
    loading,
    error,
    stats,
    toggleChecked,
    updateItem,
    addItem,
    deleteItem,
    generateFromTemplate,
    refetch: fetchItems,
  }
}

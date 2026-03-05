import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/hooks/useOrganization'
import type { DbSupplyDependency, DbSupplyDependencyInsert } from '@/types/database'

export interface SupplyStats {
  total: number
  kritisch: number
  ohneAlternative: number
  typeCount: number
}

interface UseSupplyDependenciesReturn {
  dependencies: DbSupplyDependency[]
  loading: boolean
  error: string | null
  stats: SupplyStats
  addDependency: (data: Omit<DbSupplyDependencyInsert, 'organization_id'>) => Promise<void>
  updateDependency: (id: string, updates: Partial<DbSupplyDependencyInsert>) => Promise<void>
  deleteDependency: (id: string) => Promise<void>
  refetch: () => void
}

export function useSupplyDependencies(): UseSupplyDependenciesReturn {
  const { organizationId } = useOrganization()
  const [dependencies, setDependencies] = useState<DbSupplyDependency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const fetchItems = useCallback(async () => {
    if (!organizationId) {
      setDependencies([])
      setLoading(false)
      return
    }

    const currentRequestId = ++requestIdRef.current
    setLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('supply_dependencies')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at')

      if (currentRequestId !== requestIdRef.current) return

      if (queryError) {
        setError(queryError.message)
        setDependencies([])
      } else {
        setDependencies((data as DbSupplyDependency[]) || [])
      }
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [organizationId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const stats = useMemo<SupplyStats>(() => {
    const kritisch = dependencies.filter(d => d.criticality === 'kritisch').length
    const ohneAlternative = dependencies.filter(d => !d.alternatives || (d.alternatives as string[]).length === 0).length
    const typeCount = new Set(dependencies.map(d => d.type)).size
    return { total: dependencies.length, kritisch, ohneAlternative, typeCount }
  }, [dependencies])

  const addDependency = useCallback(async (data: Omit<DbSupplyDependencyInsert, 'organization_id'>) => {
    if (!organizationId) return
    const { error } = await supabase
      .from('supply_dependencies')
      .insert({ ...data, organization_id: organizationId })
    if (error) throw error
    fetchItems()
  }, [organizationId, fetchItems])

  const updateDependency = useCallback(async (id: string, updates: Partial<DbSupplyDependencyInsert>) => {
    const prev = dependencies
    setDependencies(d => d.map(item => item.id === id ? { ...item, ...updates } as DbSupplyDependency : item))
    const { error } = await supabase
      .from('supply_dependencies')
      .update(updates)
      .eq('id', id)
    if (error) {
      setDependencies(prev)
      throw error
    }
  }, [dependencies])

  const deleteDependency = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('supply_dependencies')
      .delete()
      .eq('id', id)
    if (error) throw error
    setDependencies(d => d.filter(item => item.id !== id))
  }, [])

  return { dependencies, loading, error, stats, addDependency, updateDependency, deleteDependency, refetch: fetchItems }
}

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/hooks/useOrganization'
import type { DbBusinessProcess, DbBusinessProcessInsert } from '@/types/database'

export interface BiaStats {
  total: number
  kritisch: number
  ohneRto: number
  minRto: number | null
}

interface UseBusinessProcessesReturn {
  processes: DbBusinessProcess[]
  loading: boolean
  error: string | null
  stats: BiaStats
  addProcess: (data: Omit<DbBusinessProcessInsert, 'organization_id'>) => Promise<void>
  updateProcess: (id: string, updates: Partial<DbBusinessProcessInsert>) => Promise<void>
  deleteProcess: (id: string) => Promise<void>
  refetch: () => void
}

export function useBusinessProcesses(): UseBusinessProcessesReturn {
  const { organizationId } = useOrganization()
  const [processes, setProcesses] = useState<DbBusinessProcess[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const fetchItems = useCallback(async () => {
    if (!organizationId) {
      setProcesses([])
      setLoading(false)
      return
    }

    const currentRequestId = ++requestIdRef.current
    setLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('business_processes')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at')

      if (currentRequestId !== requestIdRef.current) return

      if (queryError) {
        setError(queryError.message)
        setProcesses([])
      } else {
        setProcesses((data as DbBusinessProcess[]) || [])
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

  const stats = useMemo<BiaStats>(() => {
    const kritisch = processes.filter(p => p.criticality === 'kritisch').length
    const ohneRto = processes.filter(p => p.rto_hours === null).length
    const rtosWithValue = processes.filter(p => p.rto_hours !== null).map(p => p.rto_hours!)
    const minRto = rtosWithValue.length > 0 ? Math.min(...rtosWithValue) : null
    return { total: processes.length, kritisch, ohneRto, minRto }
  }, [processes])

  const addProcess = useCallback(async (data: Omit<DbBusinessProcessInsert, 'organization_id'>) => {
    if (!organizationId) return
    const { error } = await supabase
      .from('business_processes')
      .insert({ ...data, organization_id: organizationId })
    if (error) throw error
    fetchItems()
  }, [organizationId, fetchItems])

  const updateProcess = useCallback(async (id: string, updates: Partial<DbBusinessProcessInsert>) => {
    const prev = processes
    setProcesses(p => p.map(item => item.id === id ? { ...item, ...updates } as DbBusinessProcess : item))
    const { error } = await supabase
      .from('business_processes')
      .update(updates)
      .eq('id', id)
    if (error) {
      setProcesses(prev)
      throw error
    }
  }, [processes])

  const deleteProcess = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('business_processes')
      .delete()
      .eq('id', id)
    if (error) throw error
    setProcesses(p => p.filter(item => item.id !== id))
  }, [])

  return { processes, loading, error, stats, addProcess, updateProcess, deleteProcess, refetch: fetchItems }
}

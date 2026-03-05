import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/hooks/useOrganization'
import type { DbOrganizationSite, DbOrganizationSiteInsert } from '@/types/database'

interface UseOrganizationSitesReturn {
  sites: DbOrganizationSite[]
  loading: boolean
  error: string | null
  addSite: (data: Omit<DbOrganizationSiteInsert, 'organization_id'>) => Promise<void>
  updateSite: (id: string, updates: Partial<DbOrganizationSiteInsert>) => Promise<void>
  deleteSite: (id: string) => Promise<void>
  refetch: () => void
}

export function useOrganizationSites(): UseOrganizationSitesReturn {
  const { organizationId } = useOrganization()
  const [sites, setSites] = useState<DbOrganizationSite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const fetchItems = useCallback(async () => {
    if (!organizationId) {
      setSites([])
      setLoading(false)
      return
    }

    const currentRequestId = ++requestIdRef.current
    setLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('organization_sites')
        .select('*')
        .eq('organization_id', organizationId)
        .order('is_primary', { ascending: false })
        .order('created_at')

      if (currentRequestId !== requestIdRef.current) return

      if (queryError) {
        setError(queryError.message)
        setSites([])
      } else {
        setSites((data as DbOrganizationSite[]) || [])
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

  const addSite = useCallback(async (data: Omit<DbOrganizationSiteInsert, 'organization_id'>) => {
    if (!organizationId) return
    const { error } = await supabase
      .from('organization_sites')
      .insert({ ...data, organization_id: organizationId })
    if (error) throw error
    fetchItems()
  }, [organizationId, fetchItems])

  const updateSite = useCallback(async (id: string, updates: Partial<DbOrganizationSiteInsert>) => {
    const prev = sites
    setSites(s => s.map(item => item.id === id ? { ...item, ...updates } as DbOrganizationSite : item))
    const { error } = await supabase
      .from('organization_sites')
      .update(updates)
      .eq('id', id)
    if (error) {
      setSites(prev)
      throw error
    }
  }, [sites])

  const deleteSite = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('organization_sites')
      .delete()
      .eq('id', id)
    if (error) throw error
    setSites(s => s.filter(item => item.id !== id))
  }, [])

  return { sites, loading, error, addSite, updateSite, deleteSite, refetch: fetchItems }
}

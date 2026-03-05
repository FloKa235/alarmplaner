import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/hooks/useOrganization'
import type { DbExercise, DbExerciseInsert } from '@/types/database'

export interface ExerciseStats {
  total: number
  geplant: number
  durchgefuehrt: number
  findings: number
  participants: number
}

interface UseExercisesReturn {
  exercises: DbExercise[]
  loading: boolean
  error: string | null
  stats: ExerciseStats
  addExercise: (data: Omit<DbExerciseInsert, 'organization_id'>) => Promise<void>
  updateExercise: (id: string, updates: Partial<DbExerciseInsert>) => Promise<void>
  deleteExercise: (id: string) => Promise<void>
  refetch: () => void
}

export function useExercises(): UseExercisesReturn {
  const { organizationId } = useOrganization()
  const [exercises, setExercises] = useState<DbExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const fetchItems = useCallback(async () => {
    if (!organizationId) {
      setExercises([])
      setLoading(false)
      return
    }

    const currentRequestId = ++requestIdRef.current
    setLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('exercises')
        .select('*')
        .eq('organization_id', organizationId)
        .order('date_planned', { ascending: true })

      if (currentRequestId !== requestIdRef.current) return

      if (queryError) {
        setError(queryError.message)
        setExercises([])
      } else {
        setExercises((data as DbExercise[]) || [])
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

  const stats = useMemo<ExerciseStats>(() => {
    const geplant = exercises.filter(e => e.status === 'geplant').length
    const durchgefuehrt = exercises.filter(e => e.status !== 'geplant').length
    const findings = exercises.reduce((sum, e) => sum + ((e.findings as unknown[]) || []).length, 0)
    const participants = exercises.reduce((sum, e) => sum + ((e.participants as unknown[]) || []).length, 0)
    return { total: exercises.length, geplant, durchgefuehrt, findings, participants }
  }, [exercises])

  const addExercise = useCallback(async (data: Omit<DbExerciseInsert, 'organization_id'>) => {
    if (!organizationId) return
    const { error } = await supabase
      .from('exercises')
      .insert({ ...data, organization_id: organizationId })
    if (error) throw error
    fetchItems()
  }, [organizationId, fetchItems])

  const updateExercise = useCallback(async (id: string, updates: Partial<DbExerciseInsert>) => {
    const prev = exercises
    setExercises(e => e.map(item => item.id === id ? { ...item, ...updates } as DbExercise : item))
    const { error } = await supabase
      .from('exercises')
      .update(updates)
      .eq('id', id)
    if (error) {
      setExercises(prev)
      throw error
    }
  }, [exercises])

  const deleteExercise = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id)
    if (error) throw error
    setExercises(e => e.filter(item => item.id !== id))
  }, [])

  return { exercises, loading, error, stats, addExercise, updateExercise, deleteExercise, refetch: fetchItems }
}

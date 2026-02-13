import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseQueryLike = PromiseLike<{ data: any; error: { message: string } | null }>

interface QueryResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  refetch: () => void
}

interface SingleQueryResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Leichtgewichtiger Hook für Supabase-Queries.
 * Ersetzt TanStack Query für die erste Phase.
 *
 * Beispiel:
 * ```ts
 * const { data, loading, error } = useSupabaseQuery(
 *   (sb) => sb.from('municipalities').select('*').order('name'),
 *   [districtId]
 * )
 * ```
 */
export function useSupabaseQuery<T>(
  queryFn: (client: typeof supabase) => SupabaseQueryLike,
  deps: unknown[] = []
): QueryResult<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const fetchData = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current
    setLoading(true)
    setError(null)

    try {
      const { data: result, error: queryError } = await queryFn(supabase)

      // Ignore stale responses – only apply if this is still the latest request
      if (currentRequestId !== requestIdRef.current) return

      if (queryError) {
        setError(queryError.message)
        setData([])
      } else {
        setData((result as T[]) || [])
      }
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
      setData([])
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Variante für Einzelabfragen (z.B. ein Szenario nach ID).
 *
 * Beispiel:
 * ```ts
 * const { data, loading } = useSupabaseSingle(
 *   (sb) => sb.from('scenarios').select('*').eq('id', id).single(),
 *   [id]
 * )
 * ```
 */
export function useSupabaseSingle<T>(
  queryFn: (client: typeof supabase) => SupabaseQueryLike,
  deps: unknown[] = []
): SingleQueryResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const fetchData = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current
    setLoading(true)
    setError(null)

    try {
      const { data: result, error: queryError } = await queryFn(supabase)

      if (currentRequestId !== requestIdRef.current) return

      if (queryError) {
        setError(queryError.message)
        setData(null)
      } else {
        setData(result as T)
      }
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
      setData(null)
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

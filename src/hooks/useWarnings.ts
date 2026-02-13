import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { DbExternalWarning } from '@/types/database'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 Minuten

interface UseWarningsResult {
  warnings: DbExternalWarning[]
  loading: boolean
  fetching: boolean
  error: string | null
  fetchWarnings: () => Promise<void>
}

/**
 * Hook für externe Warnungen (NINA/DWD).
 * Lädt Warnungen aus der DB und kann neue über die Edge Function abrufen.
 * Auto-Refresh alle 5 Minuten.
 */
export function useWarnings(districtId: string | null): UseWarningsResult {
  const [warnings, setWarnings] = useState<DbExternalWarning[]>([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  // Warnungen aus der DB laden
  const loadFromDb = useCallback(async () => {
    if (!districtId) {
      setWarnings([])
      setLoading(false)
      return
    }

    try {
      const { data, error: queryError } = await supabase
        .from('external_warnings')
        .select('*')
        .eq('district_id', districtId)
        .order('severity', { ascending: false })

      if (!mountedRef.current) return

      if (queryError) {
        // Tabelle existiert vielleicht noch nicht – kein harter Fehler
        console.warn('Warnungen laden:', queryError.message)
        setWarnings([])
      } else {
        setWarnings((data as DbExternalWarning[]) || [])
      }
    } catch (err) {
      if (!mountedRef.current) return
      console.warn('Warnungen laden Fehler:', err)
      setWarnings([])
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [districtId])

  // Neue Warnungen über Edge Function abrufen
  const fetchWarnings = useCallback(async () => {
    if (!districtId) return
    setFetching(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) throw new Error('Nicht angemeldet.')

      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-warnings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ districtId }),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Fehler beim Abrufen')

      // DB neu laden nach dem Fetch
      await loadFromDb()
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Verbindungsfehler')
      }
    } finally {
      if (mountedRef.current) setFetching(false)
    }
  }, [districtId, loadFromDb])

  // Initial laden
  useEffect(() => {
    mountedRef.current = true
    loadFromDb()
    return () => { mountedRef.current = false }
  }, [loadFromDb])

  // Auto-Refresh alle 5 Min
  useEffect(() => {
    if (!districtId) return
    const interval = setInterval(() => {
      fetchWarnings()
    }, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [districtId, fetchWarnings])

  return { warnings, loading, fetching, error, fetchWarnings }
}

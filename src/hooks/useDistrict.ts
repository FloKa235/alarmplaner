import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { createElement } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { DbDistrict } from '@/types/database'

interface DistrictState {
  district: DbDistrict | null
  districtId: string | null
  loading: boolean
  error: string | null
  refetch: () => void
}

const DistrictContext = createContext<DistrictState | null>(null)

/**
 * Provider der den aktuellen Landkreis des eingeloggten Users lädt.
 * Wraps die PRO-App Routen.
 */
export function DistrictProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [district, setDistrict] = useState<DbDistrict | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDistrict = async () => {
    if (!user) {
      setDistrict(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('districts')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (queryError) {
        setError(queryError.message)
        setDistrict(null)
      } else {
        setDistrict(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden des Landkreises')
      setDistrict(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDistrict()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  return createElement(
    DistrictContext.Provider,
    {
      value: {
        district,
        districtId: district?.id ?? null,
        loading,
        error,
        refetch: fetchDistrict,
      },
    },
    children
  )
}

/**
 * Hook um auf den aktuellen Landkreis zuzugreifen.
 * Muss innerhalb von `<DistrictProvider>` verwendet werden.
 */
export function useDistrict(): DistrictState {
  const context = useContext(DistrictContext)
  if (!context) {
    throw new Error('useDistrict must be used within a DistrictProvider')
  }
  return context
}

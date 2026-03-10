import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { createElement } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { DbOrganization } from '@/types/database'

interface OrganizationState {
  organization: DbOrganization | null
  organizationId: string | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export const OrganizationContext = createContext<OrganizationState | null>(null)

/**
 * Provider der die aktuelle Organisation des eingeloggten Users laedt.
 * Wraps die Unternehmen-App Routen.
 */
export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [organization, setOrganization] = useState<DbOrganization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrganization = async () => {
    if (!user) {
      setOrganization(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (queryError) {
        setError(queryError.message)
        setOrganization(null)
      } else {
        setOrganization(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Organisation')
      setOrganization(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganization()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  return createElement(
    OrganizationContext.Provider,
    {
      value: {
        organization,
        organizationId: organization?.id ?? null,
        loading,
        error,
        refetch: fetchOrganization,
      },
    },
    children
  )
}

/**
 * Hook um auf die aktuelle Organisation zuzugreifen.
 * Muss innerhalb von `<OrganizationProvider>` verwendet werden.
 */
export function useOrganization(): OrganizationState {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}

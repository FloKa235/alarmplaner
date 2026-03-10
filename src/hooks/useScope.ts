/**
 * useScope – Dual-Provider Hook fuer Shared Pages
 *
 * Erkennt automatisch ob DistrictProvider (Pro) oder OrganizationProvider (Enterprise)
 * aktiv ist und gibt die passende Scope-ID + Column zurueck.
 * Fuer Seiten die sowohl unter /pro/* als auch /unternehmen/* geroutet werden.
 */
import { useContext } from 'react'
import { DistrictContext } from '@/hooks/useDistrict'
import { OrganizationContext } from '@/hooks/useOrganization'
import { CrisisContext } from '@/contexts/CrisisContext'
import { EnterpriseCrisisContext } from '@/contexts/EnterpriseCrisisContext'
import type { CrisisEventType } from '@/types/database'
import type { CrisisStufe } from '@/contexts/CrisisContext'

export interface ScopeState {
  scopeId: string | null
  scopeColumn: 'district_id' | 'organization_id'
  scopeType: 'district' | 'organization'
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useScope(): ScopeState {
  const district = useContext(DistrictContext)
  const organization = useContext(OrganizationContext)

  if (district) {
    return {
      scopeId: district.districtId,
      scopeColumn: 'district_id',
      scopeType: 'district',
      loading: district.loading,
      error: district.error,
      refetch: district.refetch,
    }
  }

  if (organization) {
    return {
      scopeId: organization.organizationId,
      scopeColumn: 'organization_id',
      scopeType: 'organization',
      loading: organization.loading,
      error: organization.error,
      refetch: organization.refetch,
    }
  }

  throw new Error('useScope must be used within a DistrictProvider or OrganizationProvider')
}

export interface ScopeCrisisState {
  isActive: boolean
  scenarioId: string | null
  scenarioTitle: string | null
  stufe: CrisisStufe | null
  startedAt: string | null
  elapsedSeconds: number
  loading: boolean
  activateCrisis: (scenarioId: string, scenarioTitle: string, stufe: CrisisStufe) => Promise<void>
  deactivateCrisis: () => Promise<void>
  changeStufe: (stufe: CrisisStufe) => Promise<void>
  insertEvent: (
    type: CrisisEventType,
    beschreibung: string,
    details?: Record<string, unknown>
  ) => Promise<void>
}

export function useScopeCrisis(): ScopeCrisisState {
  const crisis = useContext(CrisisContext)
  const enterpriseCrisis = useContext(EnterpriseCrisisContext)

  if (crisis) return crisis
  if (enterpriseCrisis) return enterpriseCrisis

  throw new Error('useScopeCrisis must be used within a CrisisProvider or EnterpriseCrisisProvider')
}

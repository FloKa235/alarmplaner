/**
 * useCitizenHousehold — Haushalt-Profil-Management für Bürger-App
 *
 * Speichert Haushalt-Daten in Supabase user_metadata (gleicher Pattern wie useCitizenLocation).
 * Kein eigener DB-Table nötig – alles in auth.users.raw_user_meta_data.
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { CitizenHouseholdProfile } from '@/types/database'

export type { CitizenHouseholdProfile }

const DEFAULT_HOUSEHOLD: CitizenHouseholdProfile = {
  household_persons: 1,
  household_babies: 0,
  household_seniors: 0,
  household_pets: false,
  dietary_restrictions: [],
  risk_profile: [],
  onboarding_completed: false,
}

interface UseCitizenHouseholdReturn {
  household: CitizenHouseholdProfile
  loading: boolean
  hasCompletedOnboarding: boolean
  saveHousehold: (profile: Partial<CitizenHouseholdProfile>) => Promise<boolean>
  completeOnboarding: () => Promise<boolean>
}

export function useCitizenHousehold(): UseCitizenHouseholdReturn {
  const { user } = useAuth()
  const [household, setHousehold] = useState<CitizenHouseholdProfile>(DEFAULT_HOUSEHOLD)
  const [loading, setLoading] = useState(true)

  // Aus user_metadata laden
  useEffect(() => {
    if (!user) {
      setHousehold(DEFAULT_HOUSEHOLD)
      setLoading(false)
      return
    }

    const meta = user.user_metadata
    setHousehold({
      household_persons: meta?.household_persons ?? 1,
      household_babies: meta?.household_babies ?? 0,
      household_seniors: meta?.household_seniors ?? 0,
      household_pets: meta?.household_pets ?? false,
      dietary_restrictions: meta?.dietary_restrictions ?? [],
      risk_profile: meta?.risk_profile ?? [],
      onboarding_completed: meta?.onboarding_completed ?? false,
    })
    setLoading(false)
  }, [user])

  const saveHousehold = useCallback(async (profile: Partial<CitizenHouseholdProfile>): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: profile,
      })
      if (error) throw error

      setHousehold(prev => ({ ...prev, ...profile }))
      return true
    } catch (err) {
      console.error('Haushalt speichern fehlgeschlagen:', err)
      return false
    }
  }, [])

  const completeOnboarding = useCallback(async (): Promise<boolean> => {
    return saveHousehold({ onboarding_completed: true })
  }, [saveHousehold])

  return {
    household,
    loading,
    hasCompletedOnboarding: household.onboarding_completed,
    saveHousehold,
    completeOnboarding,
  }
}

/**
 * useCitizenLocation — Standort-Management für Bürger-App
 *
 * Speichert den Standort (Landkreis) in Supabase user_metadata.
 * Kein eigener DB-Table nötig – alles in auth.users.raw_user_meta_data.
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface CitizenLocation {
  districtName: string
  districtAgs: string
  warncellId: number
  lat: number
  lng: number
}

interface UseCitizenLocationReturn {
  location: CitizenLocation | null
  loading: boolean
  hasLocation: boolean
  saveLocation: (loc: CitizenLocation) => Promise<boolean>
}

export function useCitizenLocation(): UseCitizenLocationReturn {
  const { user } = useAuth()
  const [location, setLocation] = useState<CitizenLocation | null>(null)
  const [loading, setLoading] = useState(true)

  // Aus user_metadata laden
  useEffect(() => {
    if (!user) {
      setLocation(null)
      setLoading(false)
      return
    }

    const meta = user.user_metadata
    if (meta?.district_name && meta?.district_ags) {
      setLocation({
        districtName: meta.district_name,
        districtAgs: meta.district_ags,
        warncellId: meta.warncell_id || 0,
        lat: meta.location_lat || 51.5,
        lng: meta.location_lng || 10.5,
      })
    }
    setLoading(false)
  }, [user])

  const saveLocation = useCallback(async (loc: CitizenLocation): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          district_name: loc.districtName,
          district_ags: loc.districtAgs,
          warncell_id: loc.warncellId,
          location_lat: loc.lat,
          location_lng: loc.lng,
        },
      })
      if (error) throw error
      setLocation(loc)
      return true
    } catch (err) {
      console.error('Standort speichern fehlgeschlagen:', err)
      return false
    }
  }, [])

  return {
    location,
    loading,
    hasLocation: !!location,
    saveLocation,
  }
}

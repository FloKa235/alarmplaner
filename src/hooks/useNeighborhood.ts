/**
 * useNeighborhood — Nachbarschafts-Netzwerk Hook
 *
 * CRUD für Nachbarschafts-Profile und Hilfe-Anfragen.
 * Koordinaten werden auf ~500m Raster gerundet (Datenschutz).
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useCitizenLocation } from '@/hooks/useCitizenLocation'
import type { DbNeighborhoodProfile, DbNeighborhoodProfileInsert, DbNeighborhoodRequest, DbNeighborhoodRequestInsert } from '@/types/database'

// ─── Skill/Resource Options ──────────────────────────────

export const SKILLS = [
  { id: 'erste_hilfe', label: 'Erste Hilfe', emoji: '\u{1F3E5}' },
  { id: 'handwerk', label: 'Handwerk', emoji: '\u{1F527}' },
  { id: 'kochen', label: 'Notkochen', emoji: '\u{1F373}' },
  { id: 'kinder', label: 'Kinderbetreuung', emoji: '\u{1F476}' },
  { id: 'transport', label: 'Transport', emoji: '\u{1F697}' },
  { id: 'kommunikation', label: 'Funk/Kommunikation', emoji: '\u{1F4FB}' },
]

export const RESOURCES = [
  { id: 'generator', label: 'Stromgenerator', emoji: '\u26A1' },
  { id: 'wasserkanister', label: 'Wasserkanister', emoji: '\u{1F4A7}' },
  { id: 'werkzeug', label: 'Werkzeug', emoji: '\u{1F6E0}\u{FE0F}' },
  { id: 'campingkocher', label: 'Campingkocher', emoji: '\u{1F525}' },
  { id: 'erste_hilfe_set', label: 'Erste-Hilfe-Set', emoji: '\u{1FA79}' },
  { id: 'batterien', label: 'Batterien/Powerbank', emoji: '\u{1F50B}' },
]

export const REQUEST_CATEGORIES = [
  { id: 'strom', label: 'Strom', emoji: '\u26A1' },
  { id: 'wasser', label: 'Wasser', emoji: '\u{1F4A7}' },
  { id: 'transport', label: 'Transport', emoji: '\u{1F697}' },
  { id: 'medizin', label: 'Medizin', emoji: '\u{1F48A}' },
  { id: 'werkzeug', label: 'Werkzeug', emoji: '\u{1F527}' },
  { id: 'sonstiges', label: 'Sonstiges', emoji: '\u{1F4AC}' },
]

// ─── Helpers ─────────────────────────────────────────────

/** Round coordinates to ~500m grid for privacy */
function roundCoord(coord: number): number {
  return Math.round(coord / 0.005) * 0.005
}

/** Approximate distance in km between two coordinates */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Types ──────────────────────────────────────────────

export interface NeighborWithDistance extends DbNeighborhoodProfile {
  distance: number // km
}

interface UseNeighborhoodReturn {
  // Profile
  myProfile: DbNeighborhoodProfile | null
  profileLoading: boolean
  createProfile: (displayName: string, skills: string[], resources: string[]) => Promise<boolean>
  updateProfile: (updates: Partial<Pick<DbNeighborhoodProfileInsert, 'display_name' | 'skills' | 'resources' | 'is_active'>>) => Promise<boolean>

  // Neighbors
  neighbors: NeighborWithDistance[]
  neighborsLoading: boolean
  refreshNeighbors: () => Promise<void>

  // Requests
  requests: DbNeighborhoodRequest[]
  requestsLoading: boolean
  createRequest: (data: Omit<DbNeighborhoodRequestInsert, 'profile_id'>) => Promise<boolean>
  resolveRequest: (id: string) => Promise<boolean>
}

// ─── Hook ───────────────────────────────────────────────

export function useNeighborhood(): UseNeighborhoodReturn {
  const { user } = useAuth()
  const { location } = useCitizenLocation()

  const [myProfile, setMyProfile] = useState<DbNeighborhoodProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [neighbors, setNeighbors] = useState<NeighborWithDistance[]>([])
  const [neighborsLoading, setNeighborsLoading] = useState(false)
  const [requests, setRequests] = useState<DbNeighborhoodRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)

  // ─── Load Own Profile ─────────────────────────────────
  useEffect(() => {
    if (!user) {
      setMyProfile(null)
      setProfileLoading(false)
      return
    }

    const loadProfile = async () => {
      try {
        const { data } = await supabase
          .from('neighborhood_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        setMyProfile(data as DbNeighborhoodProfile | null)
      } catch (err) {
        console.warn('Nachbarschafts-Profil laden fehlgeschlagen:', err)
      } finally {
        setProfileLoading(false)
      }
    }

    loadProfile()
  }, [user])

  // ─── Create Profile ───────────────────────────────────
  const createProfile = useCallback(async (
    displayName: string,
    skills: string[],
    resources: string[],
  ): Promise<boolean> => {
    if (!user || !location) return false

    try {
      const insert: DbNeighborhoodProfileInsert = {
        user_id: user.id,
        display_name: displayName.trim(),
        skills,
        resources,
        lat: roundCoord(location.lat),
        lng: roundCoord(location.lng),
      }

      const { data, error } = await supabase
        .from('neighborhood_profiles')
        .upsert(insert, { onConflict: 'user_id' })
        .select()
        .single()

      if (error) throw error
      setMyProfile(data as DbNeighborhoodProfile)
      return true
    } catch (err) {
      console.error('Profil erstellen fehlgeschlagen:', err)
      return false
    }
  }, [user, location])

  // ─── Update Profile ───────────────────────────────────
  const updateProfile = useCallback(async (
    updates: Partial<Pick<DbNeighborhoodProfileInsert, 'display_name' | 'skills' | 'resources' | 'is_active'>>
  ): Promise<boolean> => {
    if (!user || !myProfile) return false

    try {
      const { data, error } = await supabase
        .from('neighborhood_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', myProfile.id)
        .select()
        .single()

      if (error) throw error
      setMyProfile(data as DbNeighborhoodProfile)
      return true
    } catch (err) {
      console.error('Profil aktualisieren fehlgeschlagen:', err)
      return false
    }
  }, [user, myProfile])

  // ─── Load Neighbors ───────────────────────────────────
  const refreshNeighbors = useCallback(async () => {
    if (!location || !user) return

    setNeighborsLoading(true)
    try {
      const myLat = roundCoord(location.lat)
      const myLng = roundCoord(location.lng)

      // ~5km radius filter (±0.05 degrees)
      const { data, error } = await supabase
        .from('neighborhood_profiles')
        .select('*')
        .eq('is_active', true)
        .gte('lat', myLat - 0.05)
        .lte('lat', myLat + 0.05)
        .gte('lng', myLng - 0.05)
        .lte('lng', myLng + 0.05)
        .neq('user_id', user.id)
        .limit(50)

      if (error) throw error

      const neighborsWithDistance = ((data || []) as DbNeighborhoodProfile[])
        .map(n => ({
          ...n,
          distance: haversineDistance(myLat, myLng, n.lat, n.lng),
        }))
        .sort((a, b) => a.distance - b.distance)

      setNeighbors(neighborsWithDistance)
    } catch (err) {
      console.warn('Nachbarn laden fehlgeschlagen:', err)
    } finally {
      setNeighborsLoading(false)
    }
  }, [location, user])

  // Auto-load neighbors when profile exists
  useEffect(() => {
    if (myProfile) {
      refreshNeighbors()
    }
  }, [myProfile, refreshNeighbors])

  // ─── Load Requests ────────────────────────────────────
  useEffect(() => {
    if (!myProfile) return

    const loadRequests = async () => {
      setRequestsLoading(true)
      try {
        // Load requests from all neighbors in the area
        const neighborIds = neighbors.map(n => n.id)
        const allIds = myProfile ? [...neighborIds, myProfile.id] : neighborIds

        if (allIds.length === 0) {
          setRequests([])
          return
        }

        const { data, error } = await supabase
          .from('neighborhood_requests')
          .select('*')
          .in('profile_id', allIds)
          .eq('is_resolved', false)
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) throw error
        setRequests((data || []) as DbNeighborhoodRequest[])
      } catch (err) {
        console.warn('Hilfe-Anfragen laden fehlgeschlagen:', err)
      } finally {
        setRequestsLoading(false)
      }
    }

    loadRequests()
  }, [myProfile, neighbors])

  // ─── Create Request ───────────────────────────────────
  const createRequest = useCallback(async (
    data: Omit<DbNeighborhoodRequestInsert, 'profile_id'>
  ): Promise<boolean> => {
    if (!myProfile) return false

    try {
      const { error } = await supabase
        .from('neighborhood_requests')
        .insert({ ...data, profile_id: myProfile.id })

      if (error) throw error

      // Refresh requests
      const { data: refreshed } = await supabase
        .from('neighborhood_requests')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(20)

      setRequests((refreshed || []) as DbNeighborhoodRequest[])
      return true
    } catch (err) {
      console.error('Hilfe-Anfrage erstellen fehlgeschlagen:', err)
      return false
    }
  }, [myProfile])

  // ─── Resolve Request ──────────────────────────────────
  const resolveRequest = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('neighborhood_requests')
        .update({ is_resolved: true })
        .eq('id', id)

      if (error) throw error
      setRequests(prev => prev.filter(r => r.id !== id))
      return true
    } catch (err) {
      console.error('Anfrage aufl\u00F6sen fehlgeschlagen:', err)
      return false
    }
  }, [])

  return {
    myProfile,
    profileLoading,
    createProfile,
    updateProfile,
    neighbors,
    neighborsLoading,
    refreshNeighbors,
    requests,
    requestsLoading,
    createRequest,
    resolveRequest,
  }
}

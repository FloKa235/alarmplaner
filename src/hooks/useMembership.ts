import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { createElement } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { DbDistrictMember, DbMunicipality, DistrictMemberRole } from '@/types/database'

export interface MembershipState {
  /** Rolle des Users: 'admin' (District-Owner oder admin-Member), 'buergermeister', null (noch ladend/nicht berechtigt) */
  role: DistrictMemberRole | null
  /** Municipality-ID falls Bürgermeister, sonst null */
  municipalityId: string | null
  /** District-ID (von Owner oder Membership) */
  districtId: string | null
  /** Gemeinde-Details für Bürgermeister */
  municipality: DbMunicipality | null
  /** Membership-Record (falls vorhanden) */
  membership: DbDistrictMember | null
  /** Ob der User District-Owner ist (d.h. districts.user_id = auth.uid()) */
  isOwner: boolean
  /** Falls Owner auch einen Bürgermeister-Record hat (für /gemeinde Preview) */
  hasBuergermeisterRecord: boolean
  /** Bürgermeister-Membership für Owner-Preview (municipality_id etc.) */
  buergermeisterMembership: DbDistrictMember | null
  /** Gemeinde-Details für Owner-Preview */
  buergermeisterMunicipality: DbMunicipality | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export const MembershipContext = createContext<MembershipState | null>(null)

/**
 * Provider der die Mitgliedschaft/Rolle des eingeloggten Users ermittelt.
 *
 * Prüft in dieser Reihenfolge:
 * 1. Ist der User Owner eines Districts? → role='admin', isOwner=true
 * 2. Hat der User einen aktiven district_members Eintrag? → role=membership.role
 * 3. Hat der User eine offene Einladung? → role=null (redirect zu /invite-accept)
 */
export function MembershipProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [role, setRole] = useState<DistrictMemberRole | null>(null)
  const [municipalityId, setMunicipalityId] = useState<string | null>(null)
  const [districtId, setDistrictId] = useState<string | null>(null)
  const [municipality, setMunicipality] = useState<DbMunicipality | null>(null)
  const [membership, setMembership] = useState<DbDistrictMember | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [hasBuergermeisterRecord, setHasBuergermeisterRecord] = useState(false)
  const [buergermeisterMembership, setBuergermeisterMembership] = useState<DbDistrictMember | null>(null)
  const [buergermeisterMunicipality, setBuergermeisterMunicipality] = useState<DbMunicipality | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMembership = async () => {
    if (!user) {
      setRole(null)
      setMunicipalityId(null)
      setDistrictId(null)
      setMunicipality(null)
      setMembership(null)
      setIsOwner(false)
      setHasBuergermeisterRecord(false)
      setBuergermeisterMembership(null)
      setBuergermeisterMunicipality(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Check: Ist der User District-Owner?
      const { data: ownedDistrict, error: ownerError } = await supabase
        .from('districts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (ownerError) {
        setError(ownerError.message)
        setLoading(false)
        return
      }

      if (ownedDistrict) {
        // User ist District-Owner → Admin
        setRole('admin')
        setDistrictId(ownedDistrict.id)
        setMunicipalityId(null)
        setMunicipality(null)
        setMembership(null)
        setIsOwner(true)

        // Auch prüfen ob Owner einen Bürgermeister-Record hat (für /gemeinde Preview)
        const { data: bmRecord } = await supabase
          .from('district_members')
          .select('*')
          .eq('user_id', user.id)
          .eq('role', 'buergermeister')
          .eq('status', 'active')
          .limit(1)
          .maybeSingle()

        if (bmRecord) {
          const bm = bmRecord as DbDistrictMember
          setHasBuergermeisterRecord(true)
          setBuergermeisterMembership(bm)
          // Gemeinde-Details laden
          if (bm.municipality_id) {
            const { data: muni } = await supabase
              .from('municipalities')
              .select('*')
              .eq('id', bm.municipality_id)
              .single()
            setBuergermeisterMunicipality(muni as DbMunicipality | null)
          }
        } else {
          setHasBuergermeisterRecord(false)
          setBuergermeisterMembership(null)
          setBuergermeisterMunicipality(null)
        }

        setLoading(false)
        return
      }

      // 2. Check: Hat der User eine aktive Membership?
      const { data: memberRecord, error: memberError } = await supabase
        .from('district_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle()

      if (memberError) {
        setError(memberError.message)
        setLoading(false)
        return
      }

      if (memberRecord) {
        const member = memberRecord as DbDistrictMember
        setRole(member.role)
        setDistrictId(member.district_id)
        setMunicipalityId(member.municipality_id)
        setMembership(member)
        setIsOwner(false)

        // Gemeinde-Details laden falls Bürgermeister
        if (member.municipality_id) {
          const { data: muni } = await supabase
            .from('municipalities')
            .select('*')
            .eq('id', member.municipality_id)
            .single()
          setMunicipality(muni as DbMunicipality | null)
        } else {
          setMunicipality(null)
        }

        setLoading(false)
        return
      }

      // 3. Kein Owner und kein aktives Member → null
      setRole(null)
      setDistrictId(null)
      setMunicipalityId(null)
      setMunicipality(null)
      setMembership(null)
      setIsOwner(false)
      setHasBuergermeisterRecord(false)
      setBuergermeisterMembership(null)
      setBuergermeisterMunicipality(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Mitgliedschaft')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembership()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  return createElement(
    MembershipContext.Provider,
    {
      value: {
        role,
        municipalityId,
        districtId,
        municipality,
        membership,
        isOwner,
        hasBuergermeisterRecord,
        buergermeisterMembership,
        buergermeisterMunicipality,
        loading,
        error,
        refetch: fetchMembership,
      },
    },
    children
  )
}

/**
 * Hook um auf die Mitgliedschaft/Rolle des Users zuzugreifen.
 * Muss innerhalb von `<MembershipProvider>` verwendet werden.
 */
export function useMembership(): MembershipState {
  const context = useContext(MembershipContext)
  if (!context) {
    throw new Error('useMembership must be used within a MembershipProvider')
  }
  return context
}

/**
 * Hilfsfunktion: Prüft ob User eine offene Einladung hat (für Redirect zu /invite-accept).
 * Wird im LoginPage aufgerufen.
 */
export async function checkPendingInvite(email: string): Promise<boolean> {
  const { data } = await supabase
    .from('district_members')
    .select('id')
    .eq('invited_email', email)
    .eq('status', 'invited')
    .limit(1)
    .maybeSingle()
  return !!data
}

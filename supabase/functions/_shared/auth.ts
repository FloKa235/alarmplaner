import { createClient } from 'jsr:@supabase/supabase-js@2'

/**
 * Validiert den JWT aus dem Authorization-Header und gibt den User zurück.
 */
export async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw new Error('Nicht authentifiziert. Bitte erneut anmelden.')
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Ungültige Sitzung. Bitte erneut anmelden.')
  }

  return user
}

/**
 * Erstellt einen Supabase-Client mit service_role Key (bypassed RLS).
 */
export function getServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

/**
 * Ermittelt den District des authentifizierten Users.
 * Prüft sowohl District-Owner als auch aktive Membership.
 * Gibt district_id zurück.
 */
export async function getDistrictForUser(userId: string, serviceClient?: ReturnType<typeof getServiceClient>) {
  const client = serviceClient || getServiceClient()

  // 1. Prüfe District-Owner
  const { data: ownedDistrict } = await client
    .from('districts')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (ownedDistrict) {
    return { districtId: ownedDistrict.id, role: 'admin' as const, isOwner: true, municipalityId: null }
  }

  // 2. Prüfe aktive Membership
  const { data: member } = await client
    .from('district_members')
    .select('district_id, role, municipality_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (member) {
    return {
      districtId: member.district_id as string,
      role: member.role as 'admin' | 'buergermeister',
      isOwner: false,
      municipalityId: member.municipality_id as string | null,
    }
  }

  throw new Error('Kein Landkreis zugeordnet. Bitte kontaktieren Sie Ihren Administrator.')
}

/**
 * Prüft ob der User Admin-Rechte für den District hat.
 * Gibt district_id zurück, wirft Error wenn kein Admin.
 */
export async function requireDistrictAdmin(userId: string, serviceClient?: ReturnType<typeof getServiceClient>) {
  const result = await getDistrictForUser(userId, serviceClient)

  if (result.role !== 'admin') {
    throw new Error('Keine Berechtigung. Nur Administratoren können diese Aktion ausführen.')
  }

  return result
}

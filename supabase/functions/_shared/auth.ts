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

import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser, getServiceClient, requireDistrictAdmin } from '../_shared/auth.ts'

/**
 * Edge Function: invite-member
 *
 * Lädt einen Bürgermeister oder Admin per E-Mail zum Landkreis ein.
 *
 * 1. Auth prüfen → User muss District-Admin sein
 * 2. Validierung: E-Mail + Rolle + optional municipality_id
 * 3. district_members Eintrag erstellen (status: 'invited')
 * 4. Supabase Auth: inviteUserByEmail() → Magic Link E-Mail
 *
 * Request Body:
 * {
 *   email: string,
 *   role: 'admin' | 'buergermeister',
 *   municipality_id?: string  (required wenn role === 'buergermeister')
 * }
 */
Deno.serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1) Auth: User muss eingeloggt sein
    const user = await getAuthenticatedUser(req)
    const serviceClient = getServiceClient()

    // 2) User muss District-Admin sein
    const { districtId } = await requireDistrictAdmin(user.id, serviceClient)

    // 3) Request Body
    const { email, role, municipality_id } = await req.json()

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: 'E-Mail und Rolle sind erforderlich.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['admin', 'buergermeister'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Ungültige Rolle. Erlaubt: admin, buergermeister.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (role === 'buergermeister' && !municipality_id) {
      return new Response(
        JSON.stringify({ error: 'Für Bürgermeister ist eine Gemeinde erforderlich.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4) Prüfe ob bereits eine Einladung existiert
    const { data: existingMember } = await serviceClient
      .from('district_members')
      .select('id, status')
      .eq('district_id', districtId)
      .eq('invited_email', email)
      .limit(1)
      .maybeSingle()

    if (existingMember) {
      if (existingMember.status === 'active') {
        return new Response(
          JSON.stringify({ error: 'Dieser Benutzer ist bereits aktives Mitglied.' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (existingMember.status === 'invited') {
        return new Response(
          JSON.stringify({ error: 'Für diese E-Mail-Adresse existiert bereits eine offene Einladung.' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 5) Prüfe ob Gemeinde zum Landkreis gehört (wenn municipality_id angegeben)
    if (municipality_id) {
      const { data: muni, error: muniError } = await serviceClient
        .from('municipalities')
        .select('id')
        .eq('id', municipality_id)
        .eq('district_id', districtId)
        .single()

      if (muniError || !muni) {
        return new Response(
          JSON.stringify({ error: 'Die ausgewählte Gemeinde gehört nicht zu diesem Landkreis.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 6) district_members Eintrag erstellen
    const { data: memberRecord, error: insertError } = await serviceClient
      .from('district_members')
      .insert({
        district_id: districtId,
        role,
        municipality_id: municipality_id || null,
        invited_by: user.id,
        invited_email: email,
        status: 'invited',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Fehler beim Erstellen der Einladung: ' + insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 7) Supabase Auth: Einladung per E-Mail senden
    const { error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.vercel.app') || 'https://alarmplaner.de'}/invite-accept`,
      data: {
        invited_to_district: districtId,
        invited_role: role,
      },
    })

    if (inviteError) {
      // Einladung ist trotzdem in DB → nicht fatal
      // User existiert evtl. schon und kann sich normal einloggen
      console.warn('Auth invite warning (non-fatal):', inviteError.message)
    }

    return new Response(
      JSON.stringify({
        success: true,
        member_id: memberRecord.id,
        message: `Einladung an ${email} wurde gesendet.`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    console.error('invite-member error:', message)

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

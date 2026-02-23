import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Loader2, XCircle, Building2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { DbDistrictMember, DbMunicipality } from '@/types/database'

interface InviteData {
  member: DbDistrictMember
  districtName: string
  municipality: DbMunicipality | null
}

export default function InviteAcceptPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    loadInvite()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  const loadInvite = async () => {
    if (!user?.email) return

    setLoading(true)
    setError(null)

    try {
      // Suche Einladung per E-Mail
      const { data: member, error: memberError } = await supabase
        .from('district_members')
        .select('*')
        .eq('invited_email', user.email)
        .eq('status', 'invited')
        .limit(1)
        .maybeSingle()

      if (memberError) {
        setError(memberError.message)
        setLoading(false)
        return
      }

      if (!member) {
        // Keine offene Einladung → vielleicht schon akzeptiert?
        const { data: activeMember } = await supabase
          .from('district_members')
          .select('role')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle()

        if (activeMember) {
          // Schon aktiv → direkt weiterleiten
          navigate(activeMember.role === 'buergermeister' ? '/gemeinde' : '/pro', { replace: true })
          return
        }

        setError('Keine offene Einladung gefunden. Bitte kontaktieren Sie Ihren Landkreis-Administrator.')
        setLoading(false)
        return
      }

      const typedMember = member as DbDistrictMember

      // District-Name laden
      const { data: district } = await supabase
        .from('districts')
        .select('name')
        .eq('id', typedMember.district_id)
        .single()

      // Gemeinde laden falls zugeordnet
      let municipality: DbMunicipality | null = null
      if (typedMember.municipality_id) {
        const { data: muni } = await supabase
          .from('municipalities')
          .select('*')
          .eq('id', typedMember.municipality_id)
          .single()
        municipality = muni as DbMunicipality | null
      }

      setInviteData({
        member: typedMember,
        districtName: district?.name || 'Unbekannter Landkreis',
        municipality,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Einladung')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!inviteData || !user) return

    setAccepting(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('district_members')
        .update({
          user_id: user.id,
          status: 'active',
          activated_at: new Date().toISOString(),
        })
        .eq('id', inviteData.member.id)

      if (updateError) {
        setError(updateError.message)
        setAccepting(false)
        return
      }

      setSuccess(true)

      // Nach 2 Sekunden weiterleiten
      setTimeout(() => {
        const target = inviteData.member.role === 'buergermeister' ? '/gemeinde' : '/pro'
        navigate(target, { replace: true })
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Annehmen der Einladung')
      setAccepting(false)
    }
  }

  // Loading States
  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          <p className="text-sm text-text-secondary">Einladung wird geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-text-primary">Alarmplaner</span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
          {success ? (
            // ─── Erfolg ────────────────────────────
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="mb-2 text-xl font-bold text-text-primary">Einladung angenommen!</h1>
              <p className="text-sm text-text-secondary">
                Sie werden weitergeleitet...
              </p>
              <div className="mt-4">
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary-600" />
              </div>
            </div>
          ) : error && !inviteData ? (
            // ─── Fehler (keine Einladung) ────────────
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="mb-2 text-xl font-bold text-text-primary">Keine Einladung gefunden</h1>
              <p className="mb-6 text-sm text-text-secondary">{error}</p>
              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Zur App
              </Link>
            </div>
          ) : inviteData ? (
            // ─── Einladung anzeigen ────────────────
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
                  <Building2 className="h-8 w-8 text-primary-600" />
                </div>
                <h1 className="mb-2 text-xl font-bold text-text-primary">Einladung zum Landkreis</h1>
                <p className="text-sm text-text-secondary">
                  Sie wurden eingeladen, dem Krisenmanagement beizutreten.
                </p>
              </div>

              {/* Details */}
              <div className="mb-6 space-y-3 rounded-xl bg-surface-secondary p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Landkreis</span>
                  <span className="text-sm font-medium text-text-primary">{inviteData.districtName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Rolle</span>
                  <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                    {inviteData.member.role === 'buergermeister' ? 'Bürgermeister/in' : 'Administrator'}
                  </span>
                </div>
                {inviteData.municipality && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Gemeinde</span>
                    <span className="text-sm font-medium text-text-primary">{inviteData.municipality.name}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleAccept}
                disabled={accepting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {accepting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Wird angenommen...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Einladung annehmen
                  </>
                )}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

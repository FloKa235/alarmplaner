import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AlertTriangle, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

/**
 * Ermittelt das Redirect-Ziel basierend auf User-Rolle.
 * - District-Owner → /pro
 * - Aktiver Bürgermeister → /gemeinde
 * - Offene Einladung → /invite-accept
 * - Sonst → /app (Bürger-App)
 */
async function getRedirectPath(userId: string, email: string): Promise<string> {
  // 1. Ist der User District-Owner?
  const { data: ownedDistrict } = await supabase
    .from('districts')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (ownedDistrict) return '/pro'

  // 2. Hat der User eine Organisation (Enterprise)?
  const { data: ownedOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (ownedOrg) return '/unternehmen'

  // 3. Hat der User eine aktive Membership?
  const { data: activeMember } = await supabase
    .from('district_members')
    .select('role')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (activeMember) {
    return activeMember.role === 'buergermeister' ? '/gemeinde' : '/pro'
  }

  // 4. Hat der User eine offene Einladung (per E-Mail)?
  const { data: invite } = await supabase
    .from('district_members')
    .select('id')
    .eq('invited_email', email)
    .eq('status', 'invited')
    .limit(1)
    .maybeSingle()

  if (invite) return '/invite-accept'

  // 5. Fallback: Bürger-App
  return '/app'
}

export default function LoginPage() {
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Rollenbasierter Redirect falls User bereits eingeloggt ist
  const redirectLoggedInUser = useCallback(async () => {
    if (!user || !user.email) return
    setIsRedirecting(true)
    try {
      const target = await getRedirectPath(user.id, user.email)
      navigate(target, { replace: true })
    } catch {
      navigate('/app', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    if (!loading && user) {
      redirectLoggedInUser()
    }
  }, [loading, user, redirectLoggedInUser])

  // Zeige Loading während Redirect läuft
  if (!loading && user && isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          <p className="text-sm text-text-secondary">Weiterleitung...</p>
        </div>
      </div>
    )
  }

  // Zeige nichts während initial Loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          <p className="text-sm text-text-secondary">Wird geladen...</p>
        </div>
      </div>
    )
  }

  // Wenn User schon eingeloggt ist aber redirect noch nicht fertig → nichts rendern
  if (user) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const { error: authError } = await signIn(email, password)

    if (authError) {
      setError(authError)
      setIsSubmitting(false)
      return
    }

    // Nach erfolgreichem Login: Rolle ermitteln und redirecten
    setIsRedirecting(true)
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser?.email) {
        // Prüfe ob ein expliziter "from" State existiert
        const from = (location.state as { from?: string })?.from
        if (from && from !== '/login' && from !== '/signup') {
          navigate(from, { replace: true })
          return
        }
        const target = await getRedirectPath(currentUser.id, currentUser.email)
        navigate(target, { replace: true })
      } else {
        navigate('/app', { replace: true })
      }
    } catch {
      navigate('/app', { replace: true })
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left: Gradient panel */}
      <div className="hidden flex-col justify-between bg-gradient-to-br from-[#111d35] via-[#1e3154] to-[#243a5e] p-10 lg:flex lg:w-[480px]">
        <div>
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Alarmplaner</span>
          </Link>
        </div>

        <div>
          <h2 className="mb-3 text-2xl font-bold text-white">
            Willkommen zurück.
          </h2>
          <p className="text-text-on-dark-secondary">
            Melden Sie sich an, um Ihr Krisenmanagement-Dashboard zu nutzen.
          </p>
        </div>

        <p className="text-sm text-text-on-dark-secondary">
          &copy; {new Date().getFullYear()} Alarmplaner. Alle Rechte vorbehalten.
        </p>
      </div>

      {/* Right: Form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-text-primary">Alarmplaner</span>
            </Link>
          </div>

          <h1 className="mb-2 text-2xl font-bold text-text-primary">Anmelden</h1>
          <p className="mb-8 text-text-secondary">
            Geben Sie Ihre Zugangsdaten ein, um fortzufahren.
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-text-primary">
                E-Mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ihre@email.de"
                  required
                  className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="login-password" className="text-sm font-medium text-text-primary">
                  Passwort
                </label>
                <a href="#" className="text-xs text-primary-600 hover:underline">
                  Passwort vergessen?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ihr Passwort"
                  required
                  className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird angemeldet...
                </>
              ) : (
                <>
                  Anmelden
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Noch kein Konto?{' '}
            <Link to="/signup" className="font-medium text-primary-600 hover:underline">
              Registrieren
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

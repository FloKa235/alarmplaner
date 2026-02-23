import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Mail, Lock, User, ArrowRight, Loader2, Shield, Home } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

/**
 * Redirect-Logik nach Signup — gleiche Logik wie LoginPage
 */
async function getRedirectPath(userId: string, email: string, signupType: 'privat' | 'landkreis'): Promise<string> {
  // Wenn als Landkreis registriert → immer Onboarding
  if (signupType === 'landkreis') return '/pro/onboarding'

  // Prüfe ob User bereits District hat (z.B. durch Einladung)
  const { data: ownedDistrict } = await supabase
    .from('districts')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (ownedDistrict) return '/pro'

  // Prüfe aktive Memberships
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

  // Prüfe offene Einladungen
  const { data: invite } = await supabase
    .from('district_members')
    .select('id')
    .eq('invited_email', email)
    .eq('status', 'invited')
    .limit(1)
    .maybeSingle()

  if (invite) return '/invite-accept'

  // Default: Bürger-App
  return '/app'
}

type SignupType = 'privat' | 'landkreis' | null

export default function SignupPage() {
  const { user, loading, signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // ?type=privat oder ?type=landkreis → direkt zur Form
  const preselected = searchParams.get('type') as SignupType

  const [signupType, setSignupType] = useState<SignupType>(preselected)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already logged in — rollenbasiert
  if (!loading && user) {
    return <Navigate to="/app" replace />
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signupType) return
    setError(null)

    if (!agreed) {
      setError('Bitte stimmen Sie den AGB und der Datenschutzerklärung zu.')
      return
    }

    setIsSubmitting(true)
    const { error: authError } = await signUp(email, password, name)

    if (authError) {
      setError(authError)
      setIsSubmitting(false)
      return
    }

    // Rollenbasierter Redirect
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser?.email) {
        const target = await getRedirectPath(currentUser.id, currentUser.email, signupType)
        navigate(target, { replace: true })
      } else {
        navigate(signupType === 'landkreis' ? '/pro/onboarding' : '/app', { replace: true })
      }
    } catch {
      navigate(signupType === 'landkreis' ? '/pro/onboarding' : '/app', { replace: true })
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
            {signupType === 'landkreis'
              ? 'Für Ihren Landkreis.'
              : signupType === 'privat'
                ? 'Für Ihre Familie.'
                : 'Starten Sie noch heute.'
            }
          </h2>
          <p className="text-text-on-dark-secondary">
            {signupType === 'landkreis'
              ? 'KI-gestütztes Krisenmanagement für Landkreise und Kommunen.'
              : signupType === 'privat'
                ? 'Persönliche Notfallvorsorge und Vorratsliste für Ihren Haushalt.'
                : 'Wählen Sie, wie Sie den Alarmplaner nutzen möchten.'
            }
          </p>
        </div>

        <p className="text-sm text-text-on-dark-secondary">
          &copy; {new Date().getFullYear()} Alarmplaner. Alle Rechte vorbehalten.
        </p>
      </div>

      {/* Right: Content */}
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

          {/* Step 1: Account-Typ auswählen */}
          {!signupType ? (
            <>
              <h1 className="mb-2 text-2xl font-bold text-text-primary">Konto erstellen</h1>
              <p className="mb-8 text-text-secondary">
                Wie möchten Sie den Alarmplaner nutzen?
              </p>

              <div className="space-y-3">
                {/* Privat */}
                <button
                  onClick={() => setSignupType('privat')}
                  className="flex w-full items-center gap-4 rounded-2xl border-2 border-border p-5 text-left transition-all hover:border-primary-300 hover:bg-primary-50/50"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50">
                    <Home className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-text-primary">Privat / Familie</p>
                    <p className="mt-0.5 text-sm text-text-secondary">
                      Persönliche Vorratsliste, Notfallplan und lokale Warnungen
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-text-muted" />
                </button>

                {/* Landkreis */}
                <button
                  onClick={() => setSignupType('landkreis')}
                  className="flex w-full items-center gap-4 rounded-2xl border-2 border-border p-5 text-left transition-all hover:border-primary-300 hover:bg-primary-50/50"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                    <Shield className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-text-primary">Landkreis / Kommune</p>
                    <p className="mt-0.5 text-sm text-text-secondary">
                      KI-Risikoanalyse, Szenarien, KRITIS, Alarmierung für Krisenstäbe
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-text-muted" />
                </button>
              </div>

              <p className="mt-6 text-center text-sm text-text-secondary">
                Bereits ein Konto?{' '}
                <Link to="/login" className="font-medium text-primary-600 hover:underline">
                  Anmelden
                </Link>
              </p>
            </>
          ) : (
            <>
              {/* Step 2: Registrierungsformular */}
              <button
                onClick={() => setSignupType(null)}
                className="mb-4 flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                ← Zurück zur Auswahl
              </button>

              <h1 className="mb-2 text-2xl font-bold text-text-primary">
                {signupType === 'privat' ? 'Privates Konto erstellen' : 'Landkreis-Konto erstellen'}
              </h1>
              <p className="mb-8 text-text-secondary">
                {signupType === 'privat'
                  ? 'Kostenlos registrieren — Vorratsliste und Notfallplan für Ihren Haushalt.'
                  : 'Erstellen Sie ein Konto für Ihren Landkreis oder Ihre Kommune.'
                }
              </p>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSignup}>
                <div>
                  <label htmlFor="signup-name" className="mb-1.5 block text-sm font-medium text-text-primary">
                    Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      id="signup-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ihr Name"
                      required
                      autoFocus
                      className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-text-primary">
                    E-Mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      id="signup-email"
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
                  <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-text-primary">
                    Passwort
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 Zeichen"
                      required
                      minLength={6}
                      className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    id="signup-terms"
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-600/20"
                  />
                  <label htmlFor="signup-terms" className="text-sm text-text-secondary">
                    Ich stimme den{' '}
                    <a href="/agb" className="text-primary-600 hover:underline">AGB</a>{' '}
                    und der{' '}
                    <a href="/datenschutz" className="text-primary-600 hover:underline">Datenschutzerklärung</a>{' '}
                    zu.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    signupType === 'privat'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-accent-500 hover:bg-accent-600'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Wird registriert...
                    </>
                  ) : (
                    <>
                      Kostenlos registrieren
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-text-secondary">
                Bereits ein Konto?{' '}
                <Link to="/login" className="font-medium text-primary-600 hover:underline">
                  Anmelden
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

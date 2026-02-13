import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AlertTriangle, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function SignupPage() {
  const { user, loading, signUp } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already logged in
  if (!loading && user) {
    return <Navigate to="/pro/onboarding" replace />
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
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

    navigate('/pro/onboarding', { replace: true })
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
            Starten Sie noch heute.
          </h2>
          <p className="text-text-on-dark-secondary">
            Erstellen Sie Ihr Konto und schützen Sie Ihre Familie mit KI-gestütztem Krisenmanagement.
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

          <h1 className="mb-2 text-2xl font-bold text-text-primary">Konto erstellen</h1>
          <p className="mb-8 text-text-secondary">
            Kostenlos registrieren und sofort loslegen.
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-600 disabled:opacity-60 disabled:cursor-not-allowed"
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
        </div>
      </div>
    </div>
  )
}

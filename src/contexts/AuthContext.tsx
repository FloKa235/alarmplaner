import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'

interface AuthState {
  user: SupabaseUser | null
  session: Session | null
  loading: boolean
  displayName: string | null
  email: string | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Map common Supabase errors to German messages
      const errorMap: Record<string, string> = {
        'Invalid login credentials': 'E-Mail oder Passwort ist falsch.',
        'Email not confirmed': 'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.',
        'Too many requests': 'Zu viele Anmeldeversuche. Bitte warten Sie einen Moment.',
      }
      return { error: errorMap[error.message] || error.message }
    }
    return { error: null }
  }

  const signUp = async (email: string, password: string, name: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })
    if (error) {
      const errorMap: Record<string, string> = {
        'User already registered': 'Diese E-Mail-Adresse ist bereits registriert.',
        'Password should be at least 6 characters': 'Passwort muss mindestens 6 Zeichen lang sein.',
        'Unable to validate email address: invalid format': 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
      }
      return { error: errorMap[error.message] || error.message }
    }
    return { error: null }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || null
  const email = user?.email || null

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        displayName,
        email,
        signIn,
        signUp,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

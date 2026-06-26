import { useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { formatAuthError, secureSignIn } from '../lib/auth'
import { withRateLimit } from '../lib/rate-limiter'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    return secureSignIn(email, password)
  }

  const signUp = async (email: string, password: string) => {
    const normalized = email.toLowerCase().trim()

    return withRateLimit('signUp', normalized, async () => {
      const { data, error } = await supabase.auth.signUp({
        email: normalized,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          return { error: 'This email is already registered. Please sign in instead.' }
        }
        return { error: formatAuthError(error) }
      }

      if (data.user?.identities?.length === 0) {
        return { error: 'This email is already registered. Please sign in instead.' }
      }

      if (data.session) {
        return { error: null }
      }

      return { error: null, needsEmailConfirmation: true }
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

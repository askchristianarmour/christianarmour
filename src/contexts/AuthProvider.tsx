import { useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { formatAuthError, secureSignIn } from '../lib/auth'
import { withRateLimit } from '../lib/rate-limiter'
import { fetchUserBanStatus, storeBanNotice } from '../lib/user-bans'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const applySession = async (nextSession: Session | null) => {
      const nextUser = nextSession?.user ?? null
      if (nextUser?.email) {
        const banStatus = await fetchUserBanStatus(nextUser.email)
        if (cancelled) return
        if (banStatus.banned) {
          storeBanNotice(banStatus.reason || 'Your account has been banned.')
          await supabase.auth.signOut()
          if (cancelled) return
          setSession(null)
          setUser(null)
          setLoading(false)
          return
        }
      }

      if (cancelled) return
      setSession(nextSession)
      setUser(nextUser)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => {
      void applySession(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    return secureSignIn(email, password)
  }

  const signUp = async (email: string, password: string) => {
    const normalized = email.toLowerCase().trim()

    return withRateLimit('signUp', normalized, async () => {
      const banStatus = await fetchUserBanStatus(normalized)
      if (banStatus.banned) {
        const reason = banStatus.reason || 'Your account has been banned.'
        return { error: `This account has been banned. ${reason}` }
      }

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

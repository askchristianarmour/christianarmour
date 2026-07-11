import { useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { formatAuthError, secureSignIn } from '../lib/auth'
import { withRateLimit } from '../lib/rate-limiter'
import { claimReferralCode } from '../lib/invite-rewards'
import { fetchUserBanStatus, storeBanNotice } from '../lib/user-bans'
import { AuthContext } from './auth-context'

const PENDING_REFERRAL_KEY = 'ca_pending_referral'

function readPendingReferral() {
  try {
    return localStorage.getItem(PENDING_REFERRAL_KEY)
  } catch {
    return null
  }
}

function writePendingReferral(code: string | null | undefined) {
  try {
    const normalized = code?.trim().toUpperCase()
    if (normalized) localStorage.setItem(PENDING_REFERRAL_KEY, normalized)
    else localStorage.removeItem(PENDING_REFERRAL_KEY)
  } catch {
    // ignore
  }
}

async function tryClaimPendingReferral() {
  const code = readPendingReferral()
  if (!code) return
  try {
    const result = await claimReferralCode(code)
    if (result?.ok || result?.error === 'Invite already claimed' || result?.error === 'Invite code not found') {
      writePendingReferral(null)
    }
  } catch {
    // Wallet/migration may not exist yet — keep code for a later attempt.
  }
}

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
        await tryClaimPendingReferral()
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

  const signUp = async (email: string, password: string, referralCode?: string | null) => {
    const normalized = email.toLowerCase().trim()
    const code = referralCode?.trim().toUpperCase() || null

    return withRateLimit('signUp', normalized, async () => {
      const banStatus = await fetchUserBanStatus(normalized)
      if (banStatus.banned) {
        const reason = banStatus.reason || 'Your account has been banned.'
        return { error: `This account has been banned. ${reason}` }
      }

      if (code) writePendingReferral(code)

      const { data, error } = await supabase.auth.signUp({
        email: normalized,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: code ? { referral_code: code } : undefined,
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
        await tryClaimPendingReferral()
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

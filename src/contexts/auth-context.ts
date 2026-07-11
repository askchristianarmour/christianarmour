import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type SignInResult = {
  error: string | null
  needsEmailVerification?: boolean
}

export type SignUpResult = {
  error: string | null
  needsEmailConfirmation?: boolean
}

export type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<SignInResult>
  signUp: (email: string, password: string, referralCode?: string | null) => Promise<SignUpResult>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

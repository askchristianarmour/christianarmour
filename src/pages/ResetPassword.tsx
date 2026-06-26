import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { PasswordInput } from '../components/PasswordInput'
import { RateLimitBanner } from '../components/RateLimitBanner'
import { useRateLimit } from '../hooks/useRateLimit'
import { updatePassword } from '../lib/password-reset'
import { supabase } from '../lib/supabase'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

function isRecoveryUrl() {
  const hash = window.location.hash.substring(1)
  const hashParams = new URLSearchParams(hash)
  if (hashParams.get('type') === 'recovery') return true

  const searchParams = new URLSearchParams(window.location.search)
  return searchParams.has('code')
}

export function ResetPassword() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [canReset, setCanReset] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('session')

  const rateLimit = useRateLimit('resetPassword', userEmail)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  useEffect(() => {
    let cancelled = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (session && isRecoveryUrl())) {
        if (!cancelled) {
          setCanReset(true)
          setChecking(false)
        }
      }
    })

    const verifySession = async () => {
      await new Promise((r) => setTimeout(r, 300))
      const { data: { session } } = await supabase.auth.getSession()

      if (cancelled) return

      if (session && isRecoveryUrl()) {
        setCanReset(true)
        if (session.user.email) setUserEmail(session.user.email)
      } else if (!session && !isRecoveryUrl()) {
        setCanReset(false)
      } else if (session) {
        setCanReset(true)
        if (session.user.email) setUserEmail(session.user.email)
      }

      setChecking(false)
    }

    verifySession()

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const onSubmit = async (data: FormData) => {
    if (rateLimit.isBlocked) return

    setAuthError(null)

    const { error } = await updatePassword(data.password, userEmail)

    if (error) {
      setAuthError(error)
      return
    }

    navigate('/signin', {
      state: { message: 'Password updated successfully. Please sign in with your new password.' },
      replace: true,
    })
  }

  if (checking) {
    return (
      <div className="mx-auto max-w-md text-center text-sm text-slate-500">
        Verifying your reset link…
      </div>
    )
  }

  if (!canReset) {
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-bold text-slate-900">Invalid or expired link</h1>
          <p className="mt-2 text-sm text-slate-600">
            This password reset link is invalid or has expired. Request a new one below.
          </p>
          <Link
            to="/forgot-password"
            className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Request new link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Set new password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Choose a new password for your account.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <PasswordInput
            label="New password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <PasswordInput
            label="Confirm new password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <RateLimitBanner
            message={rateLimit.message}
            retryAfterSeconds={rateLimit.retryAfterSeconds}
          />

          {authError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || rateLimit.isBlocked}
            className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isSubmitting
              ? 'Updating…'
              : rateLimit.isBlocked
                ? `Wait ${rateLimit.retryAfterSeconds}s`
                : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}

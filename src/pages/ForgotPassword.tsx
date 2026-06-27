import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { RateLimitBanner } from '../components/RateLimitBanner'
import { useRateLimit } from '../hooks/useRateLimit'
import { sendPasswordResetLink } from '../lib/password-reset'
import { useToast } from '../contexts/ToastContext'

const schema = z.object({
  email: z.email('Enter a valid email'),
})

type FormData = z.infer<typeof schema>

export function ForgotPassword() {
  const navigate = useNavigate()
  const { success: toastSuccess, error: toastError } = useToast()
  const [showFailureHints, setShowFailureHints] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const email = watch('email')
  const rateLimit = useRateLimit('forgotPassword', email)

  const onSubmit = async (data: FormData) => {
    if (showFailureHints && rateLimit.isBlocked) return

    setShowFailureHints(false)

    const { error } = await sendPasswordResetLink(data.email)

    if (error) {
      setShowFailureHints(true)
      toastError(error)
      return
    }

    toastSuccess(`A password reset link has been sent to ${data.email}. Check your email.`)
    navigate('/signin')
  }

  const isBlocked = showFailureHints && rateLimit.isBlocked

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Forgot password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your email and we will send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          {showFailureHints && (
            <RateLimitBanner
              message={rateLimit.message}
              retryAfterSeconds={rateLimit.retryAfterSeconds}
            />
          )}

          <button
            type="submit"
            disabled={isSubmitting || isBlocked}
            className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isSubmitting
              ? 'Sending…'
              : isBlocked
                ? `Wait ${rateLimit.retryAfterSeconds}s`
                : 'Send reset link'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link to="/signin" className="font-medium text-slate-700 underline hover:text-slate-900">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}


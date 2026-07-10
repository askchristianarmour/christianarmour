import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { AuthChrome } from '../components/auth/AuthChrome'
import { AuthFormLogo, AuthFormPanel } from '../components/auth/AuthFormPanel'
import { AuthHeroPanel } from '../components/auth/AuthHeroPanel'
import { CrossSpinner } from '../components/CrossLoader'
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
    <div className="flex min-h-screen flex-col bg-white">
      <AuthChrome />

      <div className="flex flex-1 flex-col lg:flex-row">
        <AuthHeroPanel />

        <AuthFormPanel>
          <AuthFormLogo />

            <h1 className="mt-8 text-center font-serif text-3xl font-semibold text-slate-900 sm:text-4xl">
              Forgot Password
            </h1>

            <p className="mt-3 text-center text-sm text-slate-500">
              Enter your email and we will send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
              <div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email id"
                  {...register('email')}
                  className="w-full border-0 border-b border-slate-300 bg-transparent py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#1c2b3a]"
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
                className="w-full rounded-sm bg-[#1c2b3a] py-3 text-sm font-medium tracking-wide text-white transition-colors hover:bg-[#152231] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <CrossSpinner size="xs" />
                    Sending link…
                  </span>
                ) : isBlocked ? (
                  `Wait ${rateLimit.retryAfterSeconds}s`
                ) : (
                  'Send reset link'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              <Link
                to="/signin"
                className="font-medium text-[#1c2b3a] underline-offset-2 hover:underline"
              >
                Back to sign in
              </Link>
            </p>
        </AuthFormPanel>
      </div>
    </div>
  )
}

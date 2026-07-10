import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { AuthChrome } from '../components/auth/AuthChrome'
import { AuthFormLogo, AuthFormPanel } from '../components/auth/AuthFormPanel'
import { AuthHeroPanel } from '../components/auth/AuthHeroPanel'
import { BrandedPasswordInput } from '../components/auth/BrandedPasswordInput'
import { CrossSpinner } from '../components/CrossLoader'
import { RateLimitBanner } from '../components/RateLimitBanner'
import { useAuth } from '../hooks/useAuth'
import { useRateLimit } from '../hooks/useRateLimit'
import { useToast } from '../contexts/ToastContext'
import { withTrimStart } from '../lib/form-input'

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type FormData = z.infer<typeof schema>

export function SignIn() {
  const { signIn } = useAuth()
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const successMessage = (location.state as { message?: string } | null)?.message
  const [showFailureHints, setShowFailureHints] = useState(false)

  useEffect(() => {
    if (successMessage) {
      toastSuccess(successMessage)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [successMessage, toastSuccess, navigate, location.pathname])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const emailField = register('email')
  const passwordField = register('password')
  const email = watch('email')
  const rateLimit = useRateLimit('signIn', email)

  const onSubmit = async (data: FormData) => {
    if (showFailureHints && rateLimit.isBlocked) return

    setShowFailureHints(false)

    const { error, needsEmailVerification } = await signIn(data.email, data.password)

    if (error) {
      setShowFailureHints(true)
      if (needsEmailVerification) {
        toastInfo(error)
      } else {
        toastError(error)
      }
      return
    }

    toastSuccess('Signed in successfully!')
    navigate('/')
  }

  const isBlocked = showFailureHints && rateLimit.isBlocked

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AuthChrome />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <AuthHeroPanel />

        <AuthFormPanel>
          <AuthFormLogo />

            <h1 className="mt-8 text-center font-serif text-3xl font-semibold text-slate-900 sm:text-4xl">
              Welcome Back
            </h1>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
              <div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email id"
                  {...emailField}
                  onChange={withTrimStart(emailField.onChange)}
                  className="w-full border-0 border-b border-slate-300 bg-transparent py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#1c2b3a]"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              <BrandedPasswordInput
                placeholder="Enter your password"
                autoComplete="current-password"
                error={errors.password?.message}
                {...passwordField}
                onChange={withTrimStart(passwordField.onChange)}
              />

              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
                >
                  Forgot password?
                </Link>
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
                    Signing in…
                  </span>
                ) : isBlocked ? (
                  `Wait ${rateLimit.retryAfterSeconds}s`
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link
                to="/signup"
                className="font-medium text-[#1c2b3a] underline-offset-2 hover:underline"
              >
                Sign up
              </Link>
            </p>
        </AuthFormPanel>
      </div>
    </div>
  )
}

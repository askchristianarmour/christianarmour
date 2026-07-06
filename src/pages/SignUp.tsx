import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { AuthChrome } from '../components/auth/AuthChrome'
import { AuthHeroPanel } from '../components/auth/AuthHeroPanel'
import { BrandedPasswordInput } from '../components/auth/BrandedPasswordInput'
import { CrossSpinner } from '../components/CrossLoader'
import { RateLimitBanner } from '../components/RateLimitBanner'
import { useAuth } from '../hooks/useAuth'
import { useRateLimit } from '../hooks/useRateLimit'
import { useToast } from '../contexts/ToastContext'

const schema = z
  .object({
    email: z.email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export function SignUp() {
  const { signUp } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const navigate = useNavigate()
  const [showFailureHints, setShowFailureHints] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  const email = watch('email')
  const rateLimit = useRateLimit('signUp', email)

  const onSubmit = async (data: FormData) => {
    if (showFailureHints && rateLimit.isBlocked) return

    setShowFailureHints(false)

    const { error, needsEmailConfirmation } = await signUp(data.email, data.password)

    if (error) {
      setShowFailureHints(true)
      toastError(error)
      return
    }

    if (needsEmailConfirmation) {
      toastSuccess(
        `A verification link has been sent to ${data.email}. Please check your inbox and spam folder, then sign in once your account is confirmed.`
      )
      navigate('/signin', { replace: true })
      return
    }

    toastSuccess('Account created and signed in successfully!')
    navigate('/')
  }

  const isBlocked = showFailureHints && rateLimit.isBlocked

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AuthChrome />

      <div className="flex flex-1 flex-col lg:flex-row">
        <AuthHeroPanel />

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:py-16">
          <div className="w-full max-w-sm">
            <img
              src="/signin/cross.svg"
              alt="Christian Armour"
              className="mx-auto h-16 w-auto sm:h-20"
            />

            <h1 className="mt-8 text-center font-serif text-3xl font-semibold text-slate-900 sm:text-4xl">
              Create Account
            </h1>

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

              <BrandedPasswordInput
                placeholder="Enter your password"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register('password')}
              />

              <BrandedPasswordInput
                placeholder="Confirm your password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

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
                    Creating account…
                  </span>
                ) : isBlocked ? (
                  `Wait ${rateLimit.retryAfterSeconds}s`
                ) : (
                  'Sign up'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                to="/signin"
                className="font-medium text-[#1c2b3a] underline-offset-2 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

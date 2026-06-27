import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { PasswordInput } from '../components/PasswordInput'
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
      navigate('/signin', {
        state: { message: 'Account created! Check your email to confirm, then sign in.' },
        replace: true,
      })
      return
    }

    toastSuccess('Account created and signed in successfully!')
    navigate('/')
  }

  const isBlocked = showFailureHints && rateLimit.isBlocked

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign up to like and comment on posts.
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

          <PasswordInput
            label="Password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <PasswordInput
            label="Confirm password"
            autoComplete="new-password"
            placeholder="••••••••"
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
            className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center min-h-[40px]"
          >
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : isBlocked ? (
              `Wait ${rateLimit.retryAfterSeconds}s`
            ) : (
              'Sign up'
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/signin" className="font-medium text-slate-700 underline hover:text-slate-900">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}


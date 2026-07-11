import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { AdminRandomCoversManager } from '../components/AdminRandomCoversManager'
import { PageLoader } from '../components/CrossLoader'
import { useAuth } from '../hooks/useAuth'
import { useIsAdmin } from '../hooks/useUserPermissions'

export function ManageCoverPool() {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin, isLoading: permLoading } = useIsAdmin()
  const navigate = useNavigate()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/signin', { replace: true, state: { from: '/manage-cover-pool' } })
    }
  }, [authLoading, user, navigate])

  if (authLoading || (user && permLoading)) {
    return <PageLoader label="Checking access..." />
  }

  if (!user) {
    return <PageLoader label="Redirecting to sign in..." />
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
          <ShieldAlert size={48} className="mx-auto mb-4 text-red-600" />
          <h1 className="text-xl font-bold text-slate-900">Access Denied</h1>
          <p className="mt-2 text-sm text-slate-600">
            Only administrators can open the Default Cover Pool manager.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              <ArrowLeft size={16} />
              Back to Home
            </button>
            <Link
              to="/profile"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Go to Profile
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/profile"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Back to profile
      </Link>
      <AdminRandomCoversManager variant="full" />
    </div>
  )
}

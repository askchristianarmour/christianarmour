import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { LogOut, Shield, Menu, X, Home, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function Layout() {
  const { user, loading, signOut } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900">
            <Shield size={22} className="text-amber-600" />
            Christian Armour
          </Link>

          <nav>
            {loading ? (
              <span className="text-sm text-slate-400">Loading…</span>
            ) : user ? (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                aria-label="Open navigation menu"
              >
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="User avatar"
                    className="h-7 w-7 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white uppercase shrink-0">
                    {(user.user_metadata?.display_name || user.email || 'U')[0]}
                  </div>
                )}
                <Menu size={18} />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/signin"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Sidebar Drawer */}
      {user && (
        <>
          {/* Overlay backdrop */}
          <div
            className={`fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs transition-opacity duration-300 ${
              isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Drawer container */}
          <div
            className={`fixed inset-y-0 right-0 z-50 w-full max-w-[280px] bg-white border-l border-slate-200 p-6 shadow-2xl transition-transform duration-300 transform ${
              isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="flex items-center gap-2 font-semibold text-slate-900">
                <Shield size={20} className="text-amber-600" />
                Christian Armour
              </span>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 flex flex-col justify-between h-[calc(100%-60px)]">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="User avatar"
                      className="h-10 w-10 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white uppercase">
                      {(user.user_metadata?.display_name || user.email || 'U')[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Logged in as
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-700 truncate" title={user.email}>
                      {user.user_metadata?.display_name || user.email}
                    </p>
                  </div>
                </div>

                <nav className="flex flex-col gap-1">
                  <Link
                    to="/"
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <Home size={18} className="text-slate-400" />
                    Home
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <User size={18} className="text-slate-400" />
                    Profile
                  </Link>
                </nav>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarOpen(false)
                    signOut()
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 hover:bg-red-100 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}


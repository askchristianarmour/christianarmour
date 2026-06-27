import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { LogOut, Shield, Menu, X, Home } from 'lucide-react'
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
                className="flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
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
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Logged in as
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700 truncate" title={user.email}>
                    {user.email}
                  </p>
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


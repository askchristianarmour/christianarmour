import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { BarChart3, Home, LogOut, Menu, PlusCircle, User, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { NotificationBell } from '../NotificationBell'
import { useAuth } from '../../hooks/useAuth'
import { fetchUnreadNotificationCount } from '../../lib/questions'
import { supabase } from '../../lib/supabase'
import { SignOutConfirmationModal } from '../SignOutConfirmationModal'

type NavItem = {
  label: string
  to: string
  key?: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/', key: 'home' },
  { label: 'About', to: '/about', key: 'about' },
  { label: 'Article', to: '/articles', key: 'article' },
  { label: 'Theology', to: '/articles?tag=theology', key: 'theology' },
  { label: 'History', to: '/articles?tag=history', key: 'history' },
  { label: 'Life', to: '/articles?tag=life', key: 'life' },
  { label: 'Ask', to: '/ask', key: 'ask' },
]

type Props = {
  activeNav?: string
}

function resolveActiveNav(pathname: string, override?: string, tagParam?: string | null) {
  if (override) return override
  if (pathname === '/') return 'home'
  if (pathname === '/about') return 'about'
  if (pathname === '/articles') {
    if (tagParam === 'theology') return 'theology'
    if (tagParam === 'history') return 'history'
    if (tagParam === 'life') return 'life'
    if (tagParam === 'exegesis') return 'exegesis'
    return 'article'
  }
  if (pathname.startsWith('/articles/')) return 'article'
  if (pathname.startsWith('/tags/theology')) return 'theology'
  if (pathname.startsWith('/tags/history')) return 'history'
  if (pathname.startsWith('/tags/life')) return 'life'
  if (pathname.startsWith('/tags/exegesis')) return 'exegesis'
  if (pathname.startsWith('/ask')) return 'ask'
  if (
    ['/signin', '/signup', '/forgot-password', '/reset-password'].some((p) =>
      pathname.startsWith(p),
    )
  ) {
    return 'article'
  }
  return undefined
}

export function AuthChrome({ activeNav: activeNavProp }: Props) {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const { user, loading, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  const activeNav = resolveActiveNav(
    pathname,
    activeNavProp,
    pathname === '/articles' ? searchParams.get('tag') : null
  )

  const { data: userPermission } = useQuery({
    queryKey: ['user-permissions', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('email', user.email)
        .single()

      if (error) {
        return {
          email: user.email,
          can_post: user.email === 'ask@christianarmour.com',
          is_admin: user.email === 'ask@christianarmour.com',
        }
      }
      return data
    },
  })

  const isAdmin = user?.email === 'ask@christianarmour.com' || !!userPermission?.is_admin
  const canPost = user?.email === 'ask@christianarmour.com' || !!userPermission?.can_post
  const { data: unreadQuestionCount = 0 } = useQuery({
    queryKey: ['notification-count', user?.id],
    enabled: !!user?.id,
    queryFn: () => fetchUnreadNotificationCount(user!.id),
    staleTime: 30_000,
  })

  const drawerOpen = menuOpen || accountOpen

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  useEffect(() => {
    setMenuOpen(false)
    setAccountOpen(false)
  }, [pathname])

  const closeDrawers = () => {
    setMenuOpen(false)
    setAccountOpen(false)
  }

  const userInitial = useMemo(
    () => (user?.user_metadata?.display_name || user?.email || 'U')[0]?.toUpperCase(),
    [user],
  )

  return (
    <>
      <div className="sticky top-0 z-40">
        <header className="bg-[#1c2b3a] text-white">
          <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4 lg:justify-self-start">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                <img
                  src="/signin/facebookheadlogo.svg"
                  alt=""
                  className="h-5 w-auto opacity-90 hover:opacity-100"
                />
              </a>
              <a href="https://wa.me" target="_blank" rel="noreferrer" aria-label="WhatsApp">
                <img
                  src="/signin/wattsapplogoheader.svg"
                  alt=""
                  className="h-5 w-5 opacity-90 hover:opacity-100"
                />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <img
                  src="/signin/instalogoheader.svg"
                  alt=""
                  className="h-5 w-5 shrink-0 opacity-90 hover:opacity-100"
                />
              </a>
            </div>

            <div className="flex flex-1 justify-center lg:flex-none lg:justify-self-center">
              <Link to="/" className="shrink-0">
                <img
                  src="/signin/headerlogowithcompname.svg"
                  alt="Christian Armour"
                  className="h-9 w-auto sm:h-11 lg:h-12"
                />
              </Link>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3 lg:justify-self-end">
              {!loading && !user && (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link
                    to="/signin"
                    className="rounded-full border border-white/25 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10 sm:px-4 sm:text-sm"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#1c2b3a] transition-colors hover:bg-white/90 sm:px-4 sm:text-sm"
                  >
                    Sign up
                  </Link>
                </div>
              )}

              {!loading && user && (
                <>
                  <NotificationBell canPost={canPost} />
                  <button
                  type="button"
                  onClick={() => setAccountOpen(true)}
                  className="hidden items-center gap-2 rounded-full border border-white/20 p-1 pr-3 text-white transition-colors hover:bg-white/10 sm:flex"
                  aria-label="Open account menu"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-bold uppercase">
                      {userInitial}
                    </div>
                  )}
                  <Menu size={16} className="opacity-80" />
                </button>
                </>
              )}

              <div className="relative hidden lg:block">
                <img
                  src="/signin/serachlogo.svg"
                  alt=""
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70"
                />
                <input
                  type="search"
                  placeholder="Search"
                  className="w-44 rounded-full border border-white/20 bg-white/10 py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/60 outline-none focus:border-white/40 xl:w-52"
                />
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="rounded-md p-2 text-white/90 transition-colors hover:bg-white/10 hover:text-white md:hidden"
                aria-label="Open navigation menu"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </header>

        <nav className="hidden border-b border-slate-200 bg-white md:block">
          <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-6 overflow-x-auto px-4 py-3 text-sm sm:gap-10">
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === activeNav
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`shrink-0 pb-0.5 font-medium transition-colors ${
                    isActive
                      ? 'border-b-2 border-[#1c2b3a] text-[#1c2b3a]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Mobile nav drawer */}
      <div
        className={`fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeDrawers}
        aria-hidden={!menuOpen}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-[60] flex w-full max-w-[300px] flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 md:hidden ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <span className="font-serif text-lg font-semibold text-[#1c2b3a]">Menu</span>
          <button
            type="button"
            onClick={closeDrawers}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === activeNav
              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    onClick={closeDrawers}
                    className={`block rounded-md px-3 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#1c2b3a]/5 text-[#1c2b3a]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="mt-6 border-t border-slate-100 pt-4">
            {!loading && !user && (
              <div className="space-y-2 px-1">
                <Link
                  to="/signin"
                  onClick={closeDrawers}
                  className="block rounded-md border border-slate-200 px-3 py-3 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  onClick={closeDrawers}
                  className="block rounded-md bg-[#1c2b3a] px-3 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-[#152231]"
                >
                  Sign up
                </Link>
              </div>
            )}

            {!loading && user && (
              <div className="space-y-1 px-1">
                <div className="mb-3 flex items-center gap-3 rounded-md bg-slate-50 px-3 py-3">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1c2b3a] text-sm font-bold text-white uppercase">
                      {userInitial}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {user.user_metadata?.display_name || user.email}
                    </p>
                    <p className="text-xs text-slate-500">Signed in</p>
                  </div>
                </div>
                {canPost && (
                  <Link
                    to="/profile?tab=asked-questions"
                    onClick={closeDrawers}
                    className="flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2">
                      <PlusCircle size={16} className="text-slate-400" />
                      Asked Questions
                    </span>
                    {unreadQuestionCount > 0 && (
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {unreadQuestionCount}
                      </span>
                    )}
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={closeDrawers}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <User size={16} className="text-slate-400" />
                  Profile
                </Link>
                {isAdmin && (
                  <>
                    <Link
                      to="/analytics"
                      onClick={closeDrawers}
                      className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <BarChart3 size={16} className="text-slate-400" />
                      Analytics
                    </Link>
                    <Link
                      to="/add-post"
                      onClick={closeDrawers}
                      className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <PlusCircle size={16} className="text-slate-400" />
                      Add Post
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    closeDrawers()
                    setShowSignOutConfirm(true)
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Desktop account drawer */}
      {user && (
        <>
          <div
            className={`fixed inset-0 z-50 hidden bg-slate-900/30 backdrop-blur-[2px] transition-opacity duration-300 sm:block ${
              accountOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
            onClick={closeDrawers}
            aria-hidden={!accountOpen}
          />

          <aside
            className={`fixed inset-y-0 right-0 z-[60] hidden w-full max-w-[300px] flex-col border-l border-slate-200 bg-white p-6 shadow-2xl transition-transform duration-300 sm:flex ${
              accountOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            aria-hidden={!accountOpen}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="font-serif text-lg font-semibold text-[#1c2b3a]">Account</span>
              <button
                type="button"
                onClick={closeDrawers}
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
                aria-label="Close account menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 flex flex-1 flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1c2b3a] text-sm font-bold text-white uppercase">
                      {userInitial}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Logged in as
                    </p>
                    <p className="truncate text-sm font-semibold text-slate-700" title={user.email ?? ''}>
                      {user.user_metadata?.display_name || user.email}
                    </p>
                  </div>
                </div>

                <nav className="flex flex-col gap-1">
                  <Link
                    to="/"
                    onClick={closeDrawers}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Home size={18} className="text-slate-400" />
                    Home
                  </Link>
                  {canPost && (
                    <Link
                      to="/profile?tab=asked-questions"
                      onClick={closeDrawers}
                      className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-2.5">
                        <PlusCircle size={18} className="text-slate-400" />
                        Asked Questions
                      </span>
                      {unreadQuestionCount > 0 && (
                        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          {unreadQuestionCount}
                        </span>
                      )}
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    onClick={closeDrawers}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <User size={18} className="text-slate-400" />
                    Profile
                  </Link>
                  {isAdmin && (
                    <>
                      <Link
                        to="/analytics"
                        onClick={closeDrawers}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <BarChart3 size={18} className="text-slate-400" />
                        Analytics
                      </Link>
                      <Link
                        to="/add-post"
                        onClick={closeDrawers}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <PlusCircle size={18} className="text-slate-400" />
                        Add Post
                      </Link>
                    </>
                  )}
                </nav>
              </div>

              <button
                type="button"
                onClick={() => {
                  closeDrawers()
                  setShowSignOutConfirm(true)
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </aside>
        </>
      )}

      <SignOutConfirmationModal
        open={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={async () => {
          setShowSignOutConfirm(false)
          await signOut()
        }}
      />
    </>
  )
}

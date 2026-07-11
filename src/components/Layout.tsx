import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AuthChrome } from './auth/AuthChrome'
import { logView } from '../lib/analytics'

export function Layout() {
  const location = useLocation()

  useEffect(() => {
    logView({ action: 'visit' })
  }, [location.pathname])

  useEffect(() => {
    // Always open pages at the top (React Router keeps prior scroll by default).
    if (location.hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname, location.hash])

  return (
    <div className="min-h-screen bg-white">
      <AuthChrome />
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  )
}

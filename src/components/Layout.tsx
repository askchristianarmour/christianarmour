import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AuthChrome } from './auth/AuthChrome'
import { logView } from '../lib/analytics'

export function Layout() {
  const location = useLocation()

  useEffect(() => {
    logView({ action: 'visit' })
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-white">
      <AuthChrome />
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  )
}

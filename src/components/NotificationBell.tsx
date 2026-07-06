import { Bell, MessageCircle, MessageSquareReply } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { getNotificationHref, markNotificationRead } from '../lib/questions'
import type { AppNotification } from '../types/database'

type Props = {
  canPost?: boolean
}

function formatNotificationTime(dateString: string) {
  const date = new Date(dateString)
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function NotificationIcon({ type }: { type: string }) {
  if (type === 'question_answered') {
    return <MessageSquareReply size={16} className="text-[#c6a14d]" />
  }

  return <MessageCircle size={16} className="text-[#c6a14d]" />
}

export function NotificationBell({ canPost = false }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { unreadCount, notifications, isLoading } = useNotifications(user?.id)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!user) return

    const href = getNotificationHref(notification, canPost)

    if (!notification.read_at) {
      await markNotificationRead(notification.id, user.id)
      queryClient.invalidateQueries({ queryKey: ['notification-count', user.id] })
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] })
    }

    setOpen(false)
    navigate(href)
  }

  if (!user) return null

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-full border border-white/20 p-2 text-white transition-colors hover:bg-white/10"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c6a14d] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[70] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <p className="text-xs text-slate-500">Questions and replies from Christian Armour</p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                        notification.read_at ? 'opacity-75' : 'bg-[#faf8f4]/70'
                      }`}
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#faf5e8]">
                        <NotificationIcon type={notification.type} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900">{notification.title}</span>
                          {!notification.read_at && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#c6a14d]" />
                          )}
                        </span>
                        <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-500">
                          {notification.body}
                        </span>
                        <span className="mt-2 block text-[11px] text-slate-400">
                          {formatNotificationTime(notification.created_at)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {canPost && (
            <div className="border-t border-slate-100 px-4 py-3">
              <Link
                to="/profile?tab=asked-questions"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-[#c6a14d] hover:text-[#a8863d]"
              >
                View asked questions panel
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

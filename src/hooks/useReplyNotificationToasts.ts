import { useCallback, useEffect, useRef } from 'react'
import { useToast } from '../contexts/ToastContext'
import { fetchUserNotifications } from '../lib/questions'
import type { AppNotification } from '../types/database'
import { useNotifications } from './useNotifications'

const STORAGE_KEY = 'ca-reply-toast-shown-ids'

function getShownIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as string[]
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function markShown(id: string) {
  const shown = getShownIds()
  shown.add(id)
  const next = Array.from(shown).slice(-100)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

function truncate(text: string, max = 120) {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 3).trimEnd()}...`
}

type Options = {
  enabled?: boolean
  userId?: string | null
}

export function useReplyNotificationToasts({ enabled = true, userId }: Options) {
  const { success } = useToast()
  const { notifications } = useNotifications(userId, enabled && !!userId)
  const toastedRef = useRef<Set<string>>(new Set())

  const showReplyToasts = useCallback(
    (items: AppNotification[]) => {
      const shown = getShownIds()

      for (const notification of items) {
        if (notification.type !== 'question_answered') continue
        if (notification.read_at) continue
        if (shown.has(notification.id) || toastedRef.current.has(notification.id)) continue

        toastedRef.current.add(notification.id)
        markShown(notification.id)

        success(
          `${notification.title} — ${truncate(notification.body)} Open the notification bell to read the full reply.`
        )
      }
    },
    [success]
  )

  useEffect(() => {
    if (!enabled || !userId) return

    fetchUserNotifications(userId)
      .then(showReplyToasts)
      .catch(() => {
        // Non-blocking if notifications are unavailable
      })
  }, [enabled, userId, showReplyToasts])

  useEffect(() => {
    if (!enabled || !userId) return
    showReplyToasts(notifications)
  }, [enabled, userId, notifications, showReplyToasts])
}

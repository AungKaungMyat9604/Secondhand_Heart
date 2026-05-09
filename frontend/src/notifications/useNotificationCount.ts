import { useCallback, useEffect, useState } from 'react'
import { apiFetch, getAuthToken } from '../api/client'
import { useAuthToken } from '../auth/useAuthToken'

type Paginated<T> = { data: T[] }
type NotificationRow = { id: number; read_at: string | null }

export function useNotificationCount() {
  const { token } = useAuthToken()
  const [unread, setUnread] = useState<number>(0)

  const refresh = useCallback(() => {
    if (!getAuthToken()) {
      setUnread(0)
      return
    }
    apiFetch<Paginated<NotificationRow>>('/api/notifications', { auth: true })
      .then((res) => setUnread(res.data.filter((n) => !n.read_at).length))
      .catch(() => {})
  }, [])

  useEffect(() => {
    refresh()
  }, [token, refresh])

  useEffect(() => {
    if (!token) return
    function onUpdated() {
      refresh()
    }
    window.addEventListener('notifications_updated', onUpdated)
    return () => window.removeEventListener('notifications_updated', onUpdated)
  }, [refresh, token])

  useEffect(() => {
    if (!token) return

    // Lightweight polling so the navbar badge updates even when notifications
    // are created elsewhere (outbid/auction ended) without a full refresh.
    const intervalMs = 15_000
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      refresh()
    }, intervalMs)

    function onFocus() {
      refresh()
    }
    function onVisibility() {
      if (document.visibilityState === 'visible') refresh()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refresh, token])

  return { unread, refresh }
}


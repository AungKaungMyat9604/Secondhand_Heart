import { useCallback, useEffect, useState } from 'react'
import { apiFetch, type ApiError } from '../api/client'
import { useAuthToken } from './useAuthToken'

export type Me = {
  id: number
  name: string
  email: string
  role: 'user' | 'admin'
  avatar_url?: string | null
}

type MeResponse = { user: Me }

export function useMe() {
  const { token } = useAuthToken()
  const [me, setMe] = useState<Me | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(() => {
    if (!token) {
      setMe(null)
      setLoaded(true)
      return
    }
    setLoaded(false)
    setError(null)
    apiFetch<MeResponse>('/api/me', { auth: true })
      .then((res) => setMe(res.user))
      .catch((e) => {
        const err = e as ApiError
        setError(err.message ?? 'Failed to load session')
      })
      .finally(() => setLoaded(true))
  }, [token])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!token) return
    function onUpdated() {
      refresh()
    }
    window.addEventListener('me_updated', onUpdated)
    return () => window.removeEventListener('me_updated', onUpdated)
  }, [refresh, token])

  return { me, error, loaded, refresh }
}


import { useEffect, useState } from 'react'
import { getAuthToken } from '../api/client'

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(() => getAuthToken())

  useEffect(() => {
    const onChange = () => setToken(getAuthToken())

    // Same-tab changes (we dispatch this in setAuthToken)
    window.addEventListener('auth_token_changed', onChange)
    // Cross-tab changes
    window.addEventListener('storage', onChange)

    return () => {
      window.removeEventListener('auth_token_changed', onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  return { token, authed: Boolean(token) }
}


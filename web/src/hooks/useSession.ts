import { useCallback, useEffect, useState } from 'react'
import { ApiRequestError, getCurrentUser, loginRequest } from '../lib/api'
import { TOKEN_STORAGE_KEY } from '../lib/config'
import type { User } from '../types'

type UseSessionOptions = {
  onRequireHomeView: () => void
}

export function useSession({ onRequireHomeView }: UseSessionOptions) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string>(() => localStorage.getItem(TOKEN_STORAGE_KEY) ?? '')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [username, setUsername] = useState('demo')
  const [password, setPassword] = useState('demo123')
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setAuthToken('')
    setCurrentUser(null)
    setIsUserPanelOpen(false)
    onRequireHomeView()
  }, [onRequireHomeView])

  useEffect(() => {
    if (!authToken) {
      onRequireHomeView()
      setCurrentUser(null)
      setIsUserPanelOpen(false)
      return
    }

    let isCancelled = false

    async function bootstrapSession() {
      setLoading(true)
      setError(null)

      try {
        const user = await getCurrentUser(authToken)
        if (isCancelled) {
          return
        }

        setCurrentUser(user)
      } catch (loadError) {
        if (isCancelled) {
          return
        }

        if (loadError instanceof ApiRequestError && loadError.status === 401) {
          logout()
          setError('Your session expired. Log in again.')
          return
        }

        setError(loadError instanceof Error ? loadError.message : 'Unknown error')
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    void bootstrapSession()

    return () => {
      isCancelled = true
    }
  }, [authToken, logout, onRequireHomeView])

  const login = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const payload = await loginRequest(username, password)
      localStorage.setItem(TOKEN_STORAGE_KEY, payload.access_token)
      setAuthToken(payload.access_token)
      setCurrentUser(payload.user)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [password, username])

  return {
    authToken,
    currentUser,
    error,
    isUserPanelOpen,
    loading,
    password,
    setError,
    setIsUserPanelOpen,
    setLoading,
    setPassword,
    setUsername,
    username,
    login,
    logout,
  }
}

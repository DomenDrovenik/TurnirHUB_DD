import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Ob zagonu preveri, ali je uporabnik že prijavljen (veljaven piškotek).
  useEffect(() => {
    api('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await api('/api/auth/login', { method: 'POST', body: { email, password } })
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (email, displayName, password) => {
    await api('/api/auth/register', { method: 'POST', body: { email, displayName, password } })
  }, [])

  const logout = useCallback(async () => {
    await api('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

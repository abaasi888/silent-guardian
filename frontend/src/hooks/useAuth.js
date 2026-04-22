import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

/**
 * Custom hook for authentication state management
 * @returns {Object} { user, loading, isAuthenticated, login, logout, refreshToken }
 */
const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Fetch current user profile using the /kyc/status endpoint (or add /me endpoint)
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setUser(null)
      setIsAuthenticated(false)
      setLoading(false)
      return
    }
    try {
      // We use /kyc/status to get user info (or you can add a dedicated /me endpoint)
      const response = await api.get('/kyc/status')
      setUser({ kycStatus: response.data.status, email: response.data.email || 'user@example.com' })
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      setUser(null)
      setIsAuthenticated(false)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { accessToken, refreshToken, user: userData } = response.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      setUser(userData)
      setIsAuthenticated(true)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Login failed' }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  const refreshToken = useCallback(async () => {
    const refresh = localStorage.getItem('refreshToken')
    if (!refresh) return false
    try {
      const response = await api.post('/auth/refresh', null, {
        headers: { Authorization: `Bearer ${refresh}` }
      })
      const newAccessToken = response.data.accessToken
      localStorage.setItem('accessToken', newAccessToken)
      return true
    } catch (error) {
      logout()
      return false
    }
  }, [logout])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return { user, loading, isAuthenticated, login, logout, refreshToken }
}

export default useAuth
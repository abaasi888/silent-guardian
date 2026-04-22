/**
 * Local storage service with type safety and error handling
 */
const storage = {
  // Auth tokens
  setAccessToken: (token) => {
    if (!token) return
    localStorage.setItem('accessToken', token)
  },
  getAccessToken: () => localStorage.getItem('accessToken'),
  removeAccessToken: () => localStorage.removeItem('accessToken'),

  setRefreshToken: (token) => {
    if (!token) return
    localStorage.setItem('refreshToken', token)
  },
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  removeRefreshToken: () => localStorage.removeItem('refreshToken'),

  // User data
  setUser: (user) => {
    if (!user) return
    localStorage.setItem('user', JSON.stringify(user))
  },
  getUser: () => {
    const user = localStorage.getItem('user')
    try {
      return user ? JSON.parse(user) : null
    } catch {
      return null
    }
  },
  removeUser: () => localStorage.removeItem('user'),

  // Device recall ID
  setDeviceRecallId: (id) => {
    if (!id) return
    localStorage.setItem('deviceRecallId', id)
  },
  getDeviceRecallId: () => localStorage.getItem('deviceRecallId'),
  removeDeviceRecallId: () => localStorage.removeItem('deviceRecallId'),

  // Generic helpers
  set: (key, value) => {
    try {
      const serialized = JSON.stringify(value)
      localStorage.setItem(key, serialized)
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error)
    }
  },
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`Failed to read ${key} from localStorage:`, error)
      return defaultValue
    }
  },
  remove: (key) => localStorage.removeItem(key),
  clear: () => localStorage.clear(),
  isAuthenticated: () => !!localStorage.getItem('accessToken')
}

export default storage
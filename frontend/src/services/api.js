import axios from 'axios'

// Base Axios instance with proxy configuration
const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' }
})

// ============================================================
// MOCK BLOCK - DELETE WHEN BACKEND IS READY
// ============================================================
api.interceptors.request.use(async (config) => {
  // Mock login (supports both user and admin)
  if (config.url === '/auth/login' && config.method === 'post') {
    const { email } = config.data
    const isAdmin = email && email.toLowerCase().includes('admin')
    const mockResponse = {
      data: {
        accessToken: 'mock-token-' + Date.now(),
        refreshToken: 'mock-refresh-' + Date.now(),
        user: {
          id: isAdmin ? 'admin-123' : 'user-456',
          email: email || 'mock@example.com',
          fullName: isAdmin ? 'Admin User' : 'Regular User',
          role: isAdmin ? 'ADMIN' : 'USER',
          kycStatus: 'APPROVED'
        }
      }
    }
    return Promise.resolve(mockResponse)
  }

  // Mock admin endpoints
  if (config.url === '/admin/users') {
    return Promise.resolve({
      data: [
        { id: '1', email: 'john@example.com', fullName: 'John Doe', kycStatus: 'APPROVED', role: 'USER' },
        { id: '2', email: 'jane@example.com', fullName: 'Jane Smith', kycStatus: 'PENDING', role: 'USER' },
        { id: '3', email: 'admin@example.com', fullName: 'Super Admin', kycStatus: 'APPROVED', role: 'ADMIN' }
      ]
    })
  }

  if (config.url === '/admin/devices') {
    return Promise.resolve({
      data: [
        { id: 'dev1', deviceName: 'iPhone 14 Pro', deviceId: 'iphone-abc123', status: 'ACTIVE', userId: '1', lastSeen: new Date().toISOString() },
        { id: 'dev2', deviceName: 'Samsung Galaxy S23', deviceId: 'samsung-def456', status: 'STOLEN', userId: '2', lastSeen: new Date().toISOString() },
        { id: 'dev3', deviceName: 'Google Pixel 7', deviceId: 'pixel-ghi789', status: 'INACTIVE', userId: '1', lastSeen: new Date(Date.now() - 86400000).toISOString() }
      ]
    })
  }

  // Mock KYC approval/rejection
  if (config.url && config.url.startsWith('/admin/users/') && config.url.includes('/kyc')) {
    return Promise.resolve({ data: { message: 'KYC status updated successfully' } })
  }

  // Mock user deletion
  if (config.url && config.url.startsWith('/admin/users/') && config.method === 'delete') {
    return Promise.resolve({ data: { message: 'User deleted successfully' } })
  }

  // Mock device status update (e.g., mark stolen)
  if (config.url && config.url.startsWith('/admin/devices/') && config.url.includes('/status')) {
    return Promise.resolve({ data: { message: 'Device status updated successfully' } })
  }

  return config
}, (error) => Promise.reject(error))
// ============================================================
// END OF MOCK BLOCK
// ============================================================

// Request interceptor: attach access token (only for real requests, mock bypasses this)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token && !config.url?.startsWith('/auth/login')) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const res = await axios.post('/api/v1/auth/refresh', null, {
            headers: { Authorization: `Bearer ${refreshToken}` }
          })
          const newAccessToken = res.data.accessToken
          localStorage.setItem('accessToken', newAccessToken)
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return api(originalRequest)
        } catch (refreshError) {
          localStorage.clear()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
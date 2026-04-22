import axios from 'axios'

// Base Axios instance with proxy configuration
const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' }
})

// ============================================================
// MOCK LOGIN - DELETE THIS BLOCK WHEN BACKEND IS READY
// ============================================================
api.interceptors.request.use(async (config) => {
  // Intercept POST /auth/login and return mock response
  if (config.url === '/auth/login' && config.method === 'post') {
    const { email, password } = config.data
    // Mock successful login with any credentials
    const mockResponse = {
      data: {
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        user: {
          id: 'mock-user-123',
          email: email || 'mock@example.com',
          fullName: 'Mock User',
          role: 'USER',
          kycStatus: 'APPROVED'
        }
      }
    }
    // Prevent actual API call and return mock
    return Promise.resolve(mockResponse)
  }
  return config
}, (error) => Promise.reject(error))
// ============================================================
// END OF MOCK BLOCK
// ============================================================

// Request interceptor: attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
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
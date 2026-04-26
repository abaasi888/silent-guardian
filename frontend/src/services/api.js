import axios from 'axios'
import * as authService from './simpleAuth'

const api = axios.create({ baseURL: '/api/v1' })

// Mock interceptor that uses our auth service
api.interceptors.request.use(async (config) => {
  console.log('API:', config.method, config.url)

  // REGISTER
  if (config.url === '/auth/register' && config.method === 'post') {
    try {
      const result = await authService.registerUser(config.data)
      return Promise.resolve({ data: result })
    } catch (err) {
      return Promise.reject({ response: { data: { message: err.message } } })
    }
  }

  // LOGIN
  if (config.url === '/auth/login' && config.method === 'post') {
    try {
      const result = await authService.loginUser(config.data.email, config.data.password)
      return Promise.resolve({ 
        data: {
          accessToken: localStorage.getItem('accessToken'),
          user: result.user
        }
      })
    } catch (err) {
      return Promise.reject({ response: { data: { message: err.message } } })
    }
  }

  // ADMIN - Get pending users
  if (config.url === '/admin/users/pending' && method === 'get') {
    return Promise.resolve({ data: [] })
  }

  // ADMIN - Approve user
  if (config.url === '/admin/users/approve' && method === 'post') {
    return Promise.resolve({ data: { success: true } })
  }

  // ADMIN - Get all users
  if (config.url === '/admin/users' && method === 'get') {
    const users = JSON.parse(localStorage.getItem('sg_auth_users') || '[]')
    return Promise.resolve({ data: users })
  }

  // ADMIN - Get organisations
  if (config.url === '/admin/organisations' && method === 'get') {
    return Promise.resolve({ data: [] })
  }

  // ADMIN - Get all devices
  if (config.url === '/admin/devices/all' && method === 'get') {
    return Promise.resolve({ data: [] })
  }

  // ADMIN - Track device
  if (config.url === '/admin/track/device' && method === 'post') {
    return Promise.resolve({ 
      data: { location: { lat: 40.7128, lng: -74.0060 }, status: 'active' } 
    })
  }

  // KYC Status
  if (config.url === '/kyc/status' && method === 'get') {
    const currentUser = authService.getCurrentUser()
    return Promise.resolve({ data: { status: currentUser?.kycStatus || 'approved' } })
  }

  // CORPORATE - Get members
  if (config.url === '/corporate/members' && method === 'get') {
    return Promise.resolve({ data: [] })
  }

  // CORPORATE - Add member
  if (config.url === '/corporate/members/add' && method === 'post') {
    return Promise.resolve({ data: { success: true } })
  }

  // CORPORATE - Get devices
  if (config.url === '/corporate/devices' && method === 'get') {
    return Promise.resolve({ data: [] })
  }

  // CORPORATE - Add device
  if (config.url === '/corporate/devices/add' && method === 'post') {
    return Promise.resolve({ data: {} })
  }

  // DEFAULT
  return Promise.resolve({ data: {} })
})

export default api
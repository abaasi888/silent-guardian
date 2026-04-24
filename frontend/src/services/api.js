// frontend/src/services/api.js – FULL MOCK MODE (no backend)
import axios from 'axios'

const api = axios.create({ baseURL: '/api/v1' })

// Mock all requests – never goes to network
api.interceptors.request.use(async (config) => {
  console.log('Mock intercepting:', config.url)

  // Mock login
  if (config.url === '/auth/login' && config.method === 'post') {
    const { email } = config.data
    const isAdmin = email && email.toLowerCase().includes('admin')
    return Promise.resolve({
      data: {
        accessToken: 'mock-admin-token',
        refreshToken: 'mock-refresh',
        user: {
          id: 'admin-123',
          email: email,
          fullName: 'Admin User',
          role: isAdmin ? 'ADMIN' : 'USER',
          kycStatus: 'APPROVED'
        }
      }
    })
  }

  // Mock admin users endpoint
  if (config.url === '/admin/users') {
    return Promise.resolve({
      data: [
        { id: '1', email: 'john@example.com', fullName: 'John Doe', phone: '1234567890', kycStatus: 'APPROVED', role: 'USER' },
        { id: '2', email: 'jane@example.com', fullName: 'Jane Smith', phone: '0987654321', kycStatus: 'PENDING', role: 'USER' },
        { id: '3', email: 'bob@example.com', fullName: 'Bob Johnson', phone: '5551234567', kycStatus: 'NOT_SUBMITTED', role: 'USER' }
      ]
    })
  }

  // Mock admin devices endpoint
  if (config.url === '/admin/devices') {
    return Promise.resolve({
      data: [
        { id: 'dev1', deviceName: 'iPhone 14 Pro', deviceId: 'iphone-abc123', status: 'ACTIVE', userId: '1', lastSeen: new Date().toISOString() },
        { id: 'dev2', deviceName: 'Samsung Galaxy S23', deviceId: 'samsung-def456', status: 'STOLEN', userId: '2', lastSeen: new Date().toISOString() }
      ]
    })
  }

  // Mock admin stats
  if (config.url === '/admin/stats') {
    return Promise.resolve({
      data: { totalUsers: 3, totalDevices: 2, totalEmployees: 0, totalCommissions: 0 }
    })
  }

  // Mock KYC approval
  if (config.url?.startsWith('/admin/users/') && config.url?.includes('/kyc')) {
    return Promise.resolve({ data: { message: 'KYC updated' } })
  }

  // Mock user deletion
  if (config.url?.startsWith('/admin/users/') && config.method === 'delete') {
    return Promise.resolve({ data: { message: 'User deleted' } })
  }

  // Mock device status update
  if (config.url?.startsWith('/admin/devices/') && config.url?.includes('/status')) {
    return Promise.resolve({ data: { message: 'Device status updated' } })
  }

  // For any other request, return empty success
  return Promise.resolve({ data: { message: 'Mock response' } })
})

export default api
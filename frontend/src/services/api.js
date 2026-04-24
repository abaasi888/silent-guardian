// frontend/src/services/api.js – FULL MOCK MODE (no backend)
import axios from 'axios'

const api = axios.create({ baseURL: '/api/v1' })

// ---------- Helper functions to manage localStorage data ----------
const getUsers = () => JSON.parse(localStorage.getItem('users') || '[]')
const saveUsers = (users) => localStorage.setItem('users', JSON.stringify(users))
const getOrganisations = () => JSON.parse(localStorage.getItem('organisations') || '[]')
const saveOrganisations = (orgs) => localStorage.setItem('organisations', JSON.stringify(orgs))
const getDevices = () => JSON.parse(localStorage.getItem('devices') || '[]')
const saveDevices = (devices) => localStorage.setItem('devices', JSON.stringify(devices))
const getChats = () => JSON.parse(localStorage.getItem('chats') || '{}')
const saveChats = (chats) => localStorage.setItem('chats', JSON.stringify(chats))

// Initialize with demo data if empty
if (getUsers().length === 0) {
  // Demo admin user
  saveUsers([{
    id: 'admin1',
    email: 'admin@silentguardian.com',
    password: 'admin123',
    fullName: 'Admin User',
    role: 'ADMIN',
    accountType: 'admin',
    kycStatus: 'approved',
    isApproved: true
  }])
  saveOrganisations([])
  saveDevices([])
  saveChats({})
}

// Mock interceptor – never goes to network
api.interceptors.request.use(async (config) => {
  console.log('Mock intercepting:', config.url, config.method)
  const { method, url, data } = config

  // ---- PUBLIC AUTH ----
  if (url === '/auth/register' && method === 'post') {
    const { email, password, fullName, phone, accountType, idDocument, selfie, businessDocs } = data
    const users = getUsers()
    if (users.find(u => u.email === email)) {
      return Promise.reject({ response: { data: { message: 'Email already exists' } } })
    }
    const newUser = {
      id: Date.now().toString(),
      email, password, fullName, phone, accountType,
      idDocument: idDocument || null,
      selfie: selfie || null,
      businessDocs: businessDocs || null,
      kycStatus: 'pending',
      isApproved: false,
      organisationId: null,
      role: null
    }
    users.push(newUser)
    saveUsers(users)
    if (accountType === 'corporate') {
      // Create organisation entry
      const orgs = getOrganisations()
      orgs.push({
        id: newUser.id,
        name: fullName,
        adminId: newUser.id,
        businessDocs: businessDocs || [],
        kycStatus: 'pending',
        members: [],
        devices: []
      })
      saveOrganisations(orgs)
    }
    return Promise.resolve({ data: { message: 'Registration submitted. Awaiting admin approval.' } })
  }

  if (url === '/auth/login' && method === 'post') {
    const { email, password } = data
    const users = getUsers()
    const user = users.find(u => u.email === email && u.password === password)
    if (!user) return Promise.reject({ response: { data: { message: 'Invalid credentials' } } })
    if (!user.isApproved && user.accountType !== 'admin') {
      return Promise.reject({ response: { data: { message: 'Account pending approval' } } })
    }
    // Add organisation info if corporate or team member
    let organisation = null
    if (user.accountType === 'corporate') {
      organisation = getOrganisations().find(o => o.adminId === user.id)
    } else if (user.organisationId) {
      organisation = getOrganisations().find(o => o.id === user.organisationId)
    }
    // Store current user in localStorage for later use
    const userCopy = { ...user, password: undefined, organisation }
    localStorage.setItem('currentUser', JSON.stringify(userCopy))
    return Promise.resolve({
      data: {
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh',
        user: userCopy
      }
    })
  }

  // ---- ADMIN ENDPOINTS ----
  if (url === '/admin/users/pending' && method === 'get') {
    const users = getUsers()
    const pending = users.filter(u => !u.isApproved && u.accountType !== 'admin')
    return Promise.resolve({ data: pending })
  }
  if (url === '/admin/users/approve' && method === 'post') {
    const { userId } = data
    const users = getUsers()
    const user = users.find(u => u.id === userId)
    if (user) {
      user.isApproved = true
      user.kycStatus = 'approved'
      if (user.accountType === 'corporate') {
        const orgs = getOrganisations()
        const org = orgs.find(o => o.adminId === user.id)
        if (org) org.kycStatus = 'approved'
        saveOrganisations(orgs)
      }
      saveUsers(users)
    }
    return Promise.resolve({ data: { success: true } })
  }
  if (url === '/admin/users/reject' && method === 'post') {
    const { userId } = data
    let users = getUsers()
    users = users.filter(u => u.id !== userId)
    saveUsers(users)
    // Also remove organisation if corporate
    let orgs = getOrganisations()
    orgs = orgs.filter(o => o.adminId !== userId)
    saveOrganisations(orgs)
    return Promise.resolve({ data: { success: true } })
  }

  // NEW: Get all users (for admin user list)
  if (url === '/admin/users' && method === 'get') {
    const users = getUsers()
    return Promise.resolve({ data: users })
  }

  // NEW: Approve KYC for a specific user
  if (url?.startsWith('/admin/users/') && url?.endsWith('/kyc/approve') && method === 'post') {
    const userId = url.split('/')[3]
    const users = getUsers()
    const user = users.find(u => u.id === userId)
    if (user) {
      user.kycStatus = 'approved'
      saveUsers(users)
    }
    return Promise.resolve({ data: { success: true } })
  }

  // NEW: Delete user
  if (url?.startsWith('/admin/users/') && method === 'delete') {
    const userId = url.split('/')[3]
    let users = getUsers()
    users = users.filter(u => u.id !== userId)
    saveUsers(users)
    // Also remove from organisations if needed
    let orgs = getOrganisations()
    orgs = orgs.filter(o => o.adminId !== userId)
    saveOrganisations(orgs)
    return Promise.resolve({ data: { success: true } })
  }

  // NEW: Update device status (stolen, etc.)
  if (url?.startsWith('/admin/devices/') && url?.endsWith('/status') && method === 'post') {
    const deviceId = url.split('/')[3]
    const { status } = data
    const devices = getDevices()
    const device = devices.find(d => d.id === deviceId)
    if (device) {
      device.status = status
      saveDevices(devices)
    }
    return Promise.resolve({ data: { success: true } })
  }

  if (url === '/admin/organisations' && method === 'get') {
    const orgs = getOrganisations()
    return Promise.resolve({ data: orgs })
  }
  if (url === '/admin/devices/all' && method === 'get') {
    const devices = getDevices()
    return Promise.resolve({ data: devices })
  }
  if (url === '/admin/track/device' && method === 'post') {
    const { deviceId } = data
    const devices = getDevices()
    const device = devices.find(d => d.id === deviceId)
    if (!device) return Promise.reject({ response: { data: { message: 'Device not found' } } })
    // Return current location (mock)
    return Promise.resolve({ data: { location: device.lastLocation || { lat: 40.7128, lng: -74.0060 }, status: device.status } })
  }

  // ---- CORPORATE (team member & device management) ----
  if (url === '/corporate/members' && method === 'get') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    if (!currentUser.id || (currentUser.accountType !== 'corporate' && !currentUser.organisationId)) {
      return Promise.reject({ response: { data: { message: 'Unauthorized' } } })
    }
    let orgId
    if (currentUser.accountType === 'corporate') {
      orgId = getOrganisations().find(o => o.adminId === currentUser.id)?.id
    } else {
      orgId = currentUser.organisationId
    }
    const members = getUsers().filter(u => u.organisationId === orgId)
    return Promise.resolve({ data: members })
  }
  if (url === '/corporate/members/add' && method === 'post') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    if (currentUser.accountType !== 'corporate') return Promise.reject({})
    const { email, fullName, phone, role, idDocument, selfie } = data
    const users = getUsers()
    if (users.find(u => u.email === email)) {
      return Promise.reject({ response: { data: { message: 'Email already exists' } } })
    }
    const org = getOrganisations().find(o => o.adminId === currentUser.id)
    if (!org) return Promise.reject({})
    const newMember = {
      id: Date.now().toString(),
      email, password: 'changeme',
      fullName, phone, accountType: 'team_member',
      idDocument, selfie,
      kycStatus: 'pending',
      isApproved: true,
      organisationId: org.id,
      role,
      approvedByCorporate: false
    }
    users.push(newMember)
    saveUsers(users)
    org.members.push(newMember.id)
    saveOrganisations(getOrganisations())
    return Promise.resolve({ data: { success: true } })
  }
  if (url === '/corporate/members/approve-kyc' && method === 'post') {
    const { memberId } = data
    const users = getUsers()
    const member = users.find(u => u.id === memberId)
    if (member) {
      member.kycStatus = 'approved'
      member.approvedByCorporate = true
      saveUsers(users)
    }
    return Promise.resolve({ data: { success: true } })
  }
  if (url === '/corporate/members/delete' && method === 'post') {
    const { memberId } = data
    let users = getUsers()
    users = users.filter(u => u.id !== memberId)
    saveUsers(users)
    // Remove from organisation members list
    const orgs = getOrganisations()
    orgs.forEach(o => {
      o.members = o.members.filter(m => m !== memberId)
    })
    saveOrganisations(orgs)
    return Promise.resolve({ data: { success: true } })
  }
  if (url === '/corporate/devices' && method === 'get') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    let orgId
    if (currentUser.accountType === 'corporate') {
      orgId = getOrganisations().find(o => o.adminId === currentUser.id)?.id
    } else if (currentUser.organisationId) {
      orgId = currentUser.organisationId
    }
    const devices = getDevices().filter(d => d.organisationId === orgId)
    return Promise.resolve({ data: devices })
  }
  if (url === '/corporate/devices/add' && method === 'post') {
    const { deviceName, deviceId, assignedToUserId } = data
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    const org = getOrganisations().find(o => o.adminId === currentUser.id)
    if (!org) return Promise.reject({})
    const newDevice = {
      id: Date.now().toString(),
      deviceName,
      deviceId,
      organisationId: org.id,
      assignedTo: assignedToUserId,
      status: 'inactive',
      lastSeen: null,
      lastLocation: null
    }
    const devices = getDevices()
    devices.push(newDevice)
    saveDevices(devices)
    org.devices.push(newDevice.id)
    saveOrganisations(getOrganisations())
    return Promise.resolve({ data: newDevice })
  }
  if (url === '/corporate/devices/delete' && method === 'post') {
    const { deviceId } = data
    let devices = getDevices()
    devices = devices.filter(d => d.id !== deviceId)
    saveDevices(devices)
    // Remove from orgs
    const orgs = getOrganisations()
    orgs.forEach(o => {
      o.devices = o.devices.filter(d => d !== deviceId)
    })
    saveOrganisations(orgs)
    return Promise.resolve({ data: { success: true } })
  }
  if (url === '/corporate/devices/update-status' && method === 'post') {
    const { deviceId, status } = data
    const devices = getDevices()
    const device = devices.find(d => d.id === deviceId)
    if (device) {
      device.status = status
      if (status === 'active') device.lastSeen = new Date().toISOString()
      saveDevices(devices)
    }
    return Promise.resolve({ data: { success: true } })
  }
  if (url?.startsWith('/corporate/devices/location/') && method === 'get') {
    const deviceId = url.split('/').pop()
    const devices = getDevices()
    const device = devices.find(d => d.id === deviceId)
    return Promise.resolve({ data: { location: device?.lastLocation || { lat: 40.7128, lng: -74.0060 } } })
  }

  // ---- LIVE CHAT ----
  if (url === '/chat/messages' && method === 'post') {
    const { organisationId, message, senderId } = data
    const chats = getChats()
    if (!chats[organisationId]) chats[organisationId] = []
    chats[organisationId].push({ senderId, message, timestamp: new Date().toISOString() })
    saveChats(chats)
    return Promise.resolve({ data: { success: true } })
  }
  if (url?.startsWith('/chat/messages/') && method === 'get') {
    const orgId = url.split('/')[3]
    const chats = getChats()
    return Promise.resolve({ data: chats[orgId] || [] })
  }

  // ---- KYC STATUS for ordinary users ----
  if (url === '/kyc/status' && method === 'get') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    return Promise.resolve({ data: { status: currentUser.kycStatus || 'pending' } })
  }

  // ---- Default catch-all ----
  return Promise.resolve({ data: { message: 'Mock response' } })
})

export default api
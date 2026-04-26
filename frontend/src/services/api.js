// frontend/src/services/api.js – COMPLETE WORKING VERSION
import axios from 'axios'

const api = axios.create({ baseURL: '/api/v1' })

// Helper functions
const getUsers = () => JSON.parse(localStorage.getItem('users') || '[]')
const saveUsers = (users) => localStorage.setItem('users', JSON.stringify(users))
const getOrganisations = () => JSON.parse(localStorage.getItem('organisations') || '[]')
const saveOrganisations = (orgs) => localStorage.setItem('organisations', JSON.stringify(orgs))
const getDevices = () => JSON.parse(localStorage.getItem('devices') || '[]')
const saveDevices = (devices) => localStorage.setItem('devices', JSON.stringify(devices))
const getChats = () => JSON.parse(localStorage.getItem('chats') || '{}')
const saveChats = (chats) => localStorage.setItem('chats', JSON.stringify(chats))

// Initialize demo data if empty
if (getUsers().length === 0) {
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

// Mock interceptor
api.interceptors.request.use(async (config) => {
  console.log('API:', config.method.toUpperCase(), config.url)
  const { method, url, data } = config

  // ========== REGISTER ==========
  if (url === '/auth/register' && method === 'post') {
    const { email, password, fullName, phone, accountType, idDocument, selfie, businessDocs } = data
    
    const users = getUsers()
    
    if (users.find(u => u.email === email)) {
      return Promise.reject({ response: { data: { message: 'Email already exists' } } })
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      fullName,
      phone: phone || '',
      accountType: accountType || 'ordinary',
      idDocument: idDocument || 'uploaded',
      selfie: selfie || 'uploaded',
      businessDocs: businessDocs || null,
      kycStatus: 'pending',
      isApproved: false,
      organisationId: null,
      role: null
    }
    
    users.push(newUser)
    saveUsers(users)

    if (accountType === 'corporate') {
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

    return Promise.resolve({ 
      data: { message: 'Registration submitted. Awaiting admin approval.' } 
    })
  }

  // ========== LOGIN ==========
  if (url === '/auth/login' && method === 'post') {
    const { email, password } = data
    const users = getUsers()
    const user = users.find(u => u.email === email && u.password === password)
    
    if (!user) {
      return Promise.reject({ response: { data: { message: 'Invalid credentials' } } })
    }
    if (!user.isApproved && user.accountType !== 'admin') {
      return Promise.reject({ response: { data: { message: 'Account pending approval' } } })
    }
    
    let organisation = null
    if (user.accountType === 'corporate') {
      organisation = getOrganisations().find(o => o.adminId === user.id)
    } else if (user.organisationId) {
      organisation = getOrganisations().find(o => o.id === user.organisationId)
    }
    
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

  // ========== ADMIN PENDING USERS ==========
  if (url === '/admin/users/pending' && method === 'get') {
    const users = getUsers()
    const pending = users.filter(u => !u.isApproved && u.accountType !== 'admin')
    return Promise.resolve({ data: pending })
  }

  // ========== ADMIN APPROVE USER ==========
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

  // ========== ADMIN REJECT USER ==========
  if (url === '/admin/users/reject' && method === 'post') {
    const { userId } = data
    let users = getUsers()
    users = users.filter(u => u.id !== userId)
    saveUsers(users)
    let orgs = getOrganisations()
    orgs = orgs.filter(o => o.adminId !== userId)
    saveOrganisations(orgs)
    return Promise.resolve({ data: { success: true } })
  }

  // ========== ADMIN GET ALL USERS ==========
  if (url === '/admin/users' && method === 'get') {
    const users = getUsers()
    return Promise.resolve({ data: users })
  }

  // ========== ADMIN APPROVE KYC ==========
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

  // ========== ADMIN DELETE USER ==========
  if (url?.startsWith('/admin/users/') && method === 'delete') {
    const userId = url.split('/')[3]
    let users = getUsers()
    users = users.filter(u => u.id !== userId)
    saveUsers(users)
    let orgs = getOrganisations()
    orgs = orgs.filter(o => o.adminId !== userId)
    saveOrganisations(orgs)
    return Promise.resolve({ data: { success: true } })
  }

  // ========== ADMIN UPDATE DEVICE STATUS ==========
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

  // ========== ADMIN GET ORGANISATIONS ==========
  if (url === '/admin/organisations' && method === 'get') {
    const orgs = getOrganisations()
    return Promise.resolve({ data: orgs })
  }

  // ========== ADMIN GET ALL DEVICES ==========
  if (url === '/admin/devices/all' && method === 'get') {
    const devices = getDevices()
    return Promise.resolve({ data: devices })
  }

  // ========== ADMIN TRACK DEVICE ==========
  if (url === '/admin/track/device' && method === 'post') {
    const { deviceId } = data
    const devices = getDevices()
    const device = devices.find(d => d.id === deviceId || d.deviceId === deviceId)
    if (!device) {
      return Promise.reject({ response: { data: { message: 'Device not found' } } })
    }
    return Promise.resolve({ 
      data: { location: device.lastLocation || { lat: 40.7128, lng: -74.0060 }, status: device.status } 
    })
  }

  // ========== CORPORATE GET MEMBERS ==========
  if (url === '/corporate/members' && method === 'get') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    let orgId
    if (currentUser.accountType === 'corporate') {
      orgId = getOrganisations().find(o => o.adminId === currentUser.id)?.id
    } else {
      orgId = currentUser.organisationId
    }
    const members = getUsers().filter(u => u.organisationId === orgId)
    return Promise.resolve({ data: members })
  }

  // ========== CORPORATE ADD MEMBER ==========
  if (url === '/corporate/members/add' && method === 'post') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    if (currentUser.accountType !== 'corporate') {
      return Promise.reject({ response: { data: { message: 'Unauthorized' } } })
    }
    const { email, fullName, phone, role, idDocument, selfie } = data
    const users = getUsers()
    if (users.find(u => u.email === email)) {
      return Promise.reject({ response: { data: { message: 'Email already exists' } } })
    }
    const org = getOrganisations().find(o => o.adminId === currentUser.id)
    if (!org) {
      return Promise.reject({ response: { data: { message: 'Organisation not found' } } })
    }
    const newMember = {
      id: Date.now().toString(),
      email,
      password: 'changeme',
      fullName,
      phone,
      accountType: 'team_member',
      idDocument: idDocument || 'uploaded',
      selfie: selfie || 'uploaded',
      kycStatus: 'pending',
      isApproved: true,
      organisationId: org.id,
      role: role || 'Member',
      approvedByCorporate: false
    }
    users.push(newMember)
    saveUsers(users)
    org.members.push(newMember.id)
    saveOrganisations(getOrganisations())
    return Promise.resolve({ data: { success: true } })
  }

  // ========== CORPORATE APPROVE MEMBER KYC ==========
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

  // ========== CORPORATE DELETE MEMBER ==========
  if (url === '/corporate/members/delete' && method === 'post') {
    const { memberId } = data
    let users = getUsers()
    users = users.filter(u => u.id !== memberId)
    saveUsers(users)
    const orgs = getOrganisations()
    orgs.forEach(o => {
      o.members = o.members.filter(m => m !== memberId)
    })
    saveOrganisations(orgs)
    return Promise.resolve({ data: { success: true } })
  }

  // ========== CORPORATE GET DEVICES ==========
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

  // ========== CORPORATE ADD DEVICE ==========
  if (url === '/corporate/devices/add' && method === 'post') {
    const { deviceName, deviceId, assignedToUserId } = data
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    const org = getOrganisations().find(o => o.adminId === currentUser.id)
    if (!org) {
      return Promise.reject({ response: { data: { message: 'Organisation not found' } } })
    }
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

  // ========== CORPORATE DELETE DEVICE ==========
  if (url === '/corporate/devices/delete' && method === 'post') {
    const { deviceId } = data
    let devices = getDevices()
    devices = devices.filter(d => d.id !== deviceId)
    saveDevices(devices)
    const orgs = getOrganisations()
    orgs.forEach(o => {
      o.devices = o.devices.filter(d => d !== deviceId)
    })
    saveOrganisations(orgs)
    return Promise.resolve({ data: { success: true } })
  }

  // ========== CORPORATE UPDATE DEVICE STATUS ==========
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

  // ========== CORPORATE GET DEVICE LOCATION ==========
  if (url?.startsWith('/corporate/devices/location/') && method === 'get') {
    const deviceId = url.split('/').pop()
    const devices = getDevices()
    const device = devices.find(d => d.id === deviceId)
    return Promise.resolve({ 
      data: { location: device?.lastLocation || { lat: 40.7128, lng: -74.0060 } } 
    })
  }

  // ========== LIVE CHAT ==========
  if (url === '/chat/messages' && method === 'post') {
    const { organisationId, message, senderId } = data
    const chats = getChats()
    if (!chats[organisationId]) chats[organisationId] = []
    chats[organisationId].push({ senderId, message, timestamp: new Date().toISOString() })
    saveChats(chats)
    return Promise.resolve({ data: { success: true } })
  }

  // ========== GET CHAT MESSAGES ==========
  if (url?.startsWith('/chat/messages/') && method === 'get') {
    const orgId = url.split('/')[3]
    const chats = getChats()
    return Promise.resolve({ data: chats[orgId] || [] })
  }

  // ========== GET KYC STATUS ==========
  if (url === '/kyc/status' && method === 'get') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    return Promise.resolve({ data: { status: currentUser.kycStatus || 'pending' } })
  }

  // Default response
  return Promise.resolve({ data: { message: 'Mock response' } })
})

export default api
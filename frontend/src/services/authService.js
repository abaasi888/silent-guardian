// AUTH SERVICE - Complete Working Version
const USERS_KEY = 'sg_users'
const DEVICES_KEY = 'sg_devices'
const COMMANDS_KEY = 'sg_commands'

// ========== USER FUNCTIONS ==========

// Get all users
export const getUsers = () => {
  const users = localStorage.getItem(USERS_KEY)
  if (!users) {
    const initialUsers = [
      {
        id: 'admin1',
        email: 'admin@silentguardian.com',
        password: 'admin123',
        fullName: 'Admin User',
        accountType: 'admin',
        isApproved: true,
        kycStatus: 'approved'
      }
    ]
    localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers))
    return initialUsers
  }
  return JSON.parse(users)
}

// Save users
export const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

// Register new user
export const registerUser = (userData) => {
  return new Promise((resolve, reject) => {
    try {
      const users = getUsers()
      
      // Check if email exists
      if (users.find(u => u.email === userData.email)) {
        reject({ message: 'Email already exists' })
        return
      }
      
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName,
        phone: userData.phone || '',
        accountType: userData.accountType || 'ordinary',
        isApproved: true,
        kycStatus: 'pending',
        createdAt: new Date().toISOString()
      }
      
      users.push(newUser)
      saveUsers(users)
      
      console.log('User registered:', newUser.email)
      resolve({ message: 'Registration successful! Please login.' })
    } catch (error) {
      console.error('Registration error:', error)
      reject({ message: 'Registration failed. Please try again.' })
    }
  })
}

// Login user
export const loginUser = (email, password) => {
  return new Promise((resolve, reject) => {
    try {
      const users = getUsers()
      const user = users.find(u => u.email === email && u.password === password)
      
      if (!user) {
        reject({ message: 'Invalid email or password' })
        return
      }
      
      if (!user.isApproved) {
        reject({ message: 'Account pending approval' })
        return
      }
      
      // Set session
      const token = 'token_' + Date.now()
      localStorage.setItem('accessToken', token)
      localStorage.setItem('currentUser', JSON.stringify(user))
      localStorage.setItem('userEmail', user.email)
      localStorage.setItem('userName', user.fullName)
      localStorage.setItem('userType', user.accountType)
      
      if (user.accountType === 'corporate') {
        localStorage.setItem('isCorporate', 'true')
      } else {
        localStorage.setItem('isCorporate', 'false')
      }
      
      console.log('User logged in:', user.email)
      resolve({ user })
    } catch (error) {
      console.error('Login error:', error)
      reject({ message: 'Login failed. Please try again.' })
    }
  })
}

// Logout user
export const logoutUser = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('currentUser')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('userName')
  localStorage.removeItem('userType')
  localStorage.removeItem('isCorporate')
}

// Check if authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('accessToken')
}

// Get current user
export const getCurrentUser = () => {
  const user = localStorage.getItem('currentUser')
  return user ? JSON.parse(user) : null
}

// ========== DEVICE FUNCTIONS ==========

// Get all devices
export const getDevices = () => {
  const devices = localStorage.getItem(DEVICES_KEY)
  if (!devices) {
    const initialDevices = []
    localStorage.setItem(DEVICES_KEY, JSON.stringify(initialDevices))
    return initialDevices
  }
  return JSON.parse(devices)
}

// Save devices
export const saveDevices = (devices) => {
  localStorage.setItem(DEVICES_KEY, JSON.stringify(devices))
}

// Add device
export const addDevice = (deviceData) => {
  return new Promise((resolve) => {
    const devices = getDevices()
    const newDevice = {
      id: Date.now().toString(),
      ...deviceData,
      status: 'inactive',
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
    devices.push(newDevice)
    saveDevices(devices)
    resolve({ device: newDevice })
  })
}

// Update device status
export const updateDeviceStatus = (deviceId, status) => {
  return new Promise((resolve) => {
    const devices = getDevices()
    const device = devices.find(d => d.id === deviceId)
    if (device) {
      device.status = status
      device.lastSeen = new Date().toISOString()
      saveDevices(devices)
    }
    resolve({ success: true })
  })
}

// Delete device
export const deleteDevice = (deviceId) => {
  return new Promise((resolve) => {
    let devices = getDevices()
    devices = devices.filter(d => d.id !== deviceId)
    saveDevices(devices)
    resolve({ success: true })
  })
}

// Get device by ID
export const getDeviceById = (deviceId) => {
  const devices = getDevices()
  return devices.find(d => d.id === deviceId || d.deviceId === deviceId)
}

// ========== COMMAND FUNCTIONS ==========

// Send remote command to device
export const sendRemoteCommand = (deviceId, commandType, deviceName) => {
  return new Promise((resolve) => {
    const commands = localStorage.getItem(COMMANDS_KEY)
    const allCommands = commands ? JSON.parse(commands) : []
    
    const newCommand = {
      id: Date.now().toString(),
      deviceId: deviceId,
      deviceName: deviceName,
      commandType: commandType,
      status: 'pending',
      sentAt: new Date().toISOString()
    }
    
    allCommands.push(newCommand)
    localStorage.setItem(COMMANDS_KEY, JSON.stringify(allCommands))
    resolve({ command: newCommand })
  })
}

// Get all commands (for admin)
export const getAllCommands = () => {
  const commands = localStorage.getItem(COMMANDS_KEY)
  return commands ? JSON.parse(commands) : []
}

// ========== ADMIN FUNCTIONS ==========

// Get all users for admin
export const getAllUsers = () => {
  return getUsers()
}

// Approve user KYC
export const approveUserKyc = (userId) => {
  return new Promise((resolve) => {
    const users = getUsers()
    const user = users.find(u => u.id === userId)
    if (user) {
      user.kycStatus = 'approved'
      saveUsers(users)
    }
    resolve({ success: true })
  })
}

// Delete user
export const deleteUser = (userId) => {
  return new Promise((resolve) => {
    let users = getUsers()
    users = users.filter(u => u.id !== userId)
    saveUsers(users)
    resolve({ success: true })
  })
}

// ========== HELPER FUNCTIONS ==========

// Generate unique device ID
export const generateDeviceId = () => {
  return 'DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase()
}

// Get device statistics
export const getDeviceStats = () => {
  const devices = getDevices()
  return {
    total: devices.length,
    active: devices.filter(d => d.status === 'active').length,
    inactive: devices.filter(d => d.status === 'inactive').length,
    stolen: devices.filter(d => d.status === 'stolen').length
  }
}

// Get user statistics
export const getUserStats = () => {
  const users = getUsers()
  const regularUsers = users.filter(u => u.accountType !== 'admin')
  return {
    total: regularUsers.length,
    approvedKyc: regularUsers.filter(u => u.kycStatus === 'approved').length,
    pendingKyc: regularUsers.filter(u => u.kycStatus === 'pending').length
  }
}
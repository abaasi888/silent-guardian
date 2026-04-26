// SINGLE STORAGE - Register and Login use the same data
const STORAGE_KEY = 'app_users_data'

// Initialize storage if empty
const initStorage = () => {
  const existing = localStorage.getItem(STORAGE_KEY)
  if (!existing) {
    const initialUsers = [
      {
        id: '1',
        email: 'admin@silentguardian.com',
        password: 'admin123',
        fullName: 'Admin User',
        accountType: 'admin'
      }
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialUsers))
  }
}
initStorage()

// Get all users
const getUsers = () => {
  const users = localStorage.getItem(STORAGE_KEY)
  return users ? JSON.parse(users) : []
}

// Save users
const saveUsers = (users) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

// REGISTER - Fixed
export const registerUser = async (userData) => {
  const users = getUsers()
  
  // Check if email exists
  if (users.find(u => u.email === userData.email)) {
    throw new Error('Email already exists')
  }
  
  // Create new user
  const newUser = {
    id: Date.now().toString(),
    email: userData.email,
    password: userData.password,
    fullName: userData.fullName,
    phone: userData.phone || '',
    accountType: userData.accountType || 'ordinary',
    createdAt: new Date().toISOString()
  }
  
  users.push(newUser)
  saveUsers(users)
  
  console.log('User registered:', newUser.email)
  console.log('All users:', users.map(u => ({ email: u.email, password: u.password })))
  
  return { message: 'Registration successful! Please login.' }
}

// LOGIN - Fixed
export const loginUser = async (email, password) => {
  const users = getUsers()
  
  console.log('Login attempt for:', email)
  console.log('Available users:', users.map(u => ({ email: u.email, password: u.password })))
  
  // Find user with matching email AND password
  const user = users.find(u => u.email === email && u.password === password)
  
  if (!user) {
    throw new Error('Invalid email or password')
  }
  
  // Store session
  const token = 'token_' + Date.now()
  localStorage.setItem('accessToken', token)
  localStorage.setItem('currentUser', JSON.stringify(user))
  localStorage.setItem('userEmail', user.email)
  localStorage.setItem('userName', user.fullName)
  localStorage.setItem('userType', user.accountType)
  
  if (user.accountType === 'corporate') {
    localStorage.setItem('isCorporate', 'true')
  }
  
  console.log('Login successful for:', email)
  
  return user
}

// LOGOUT
export const logoutUser = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('currentUser')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('userName')
  localStorage.removeItem('userType')
  localStorage.removeItem('isCorporate')
}

// CHECK AUTH
export const isAuthenticated = () => {
  return !!localStorage.getItem('accessToken')
}

// GET CURRENT USER
export const getCurrentUser = () => {
  const user = localStorage.getItem('currentUser')
  return user ? JSON.parse(user) : null
}
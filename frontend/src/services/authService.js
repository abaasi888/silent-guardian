// AUTH SERVICE - FIXED VERSION
const USERS_KEY = 'app_users_data'

// Get all users
const getUsers = () => {
  const users = localStorage.getItem(USERS_KEY)
  if (!users) {
    const initialUsers = [
      {
        id: '1',
        email: 'admin@silentguardian.com',
        password: 'admin123',
        fullName: 'Admin User',
        accountType: 'admin'
      }
    ]
    localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers))
    return initialUsers
  }
  return JSON.parse(users)
}

const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  console.log('Users saved:', users.length)
}

// REGISTER USER
export const registerUser = (userData) => {
  return new Promise((resolve, reject) => {
    const users = getUsers()
    
    console.log('=== REGISTER ===')
    console.log('Email:', userData.email)
    console.log('Password:', userData.password)
    
    if (users.find(u => u.email === userData.email)) {
      reject('Email already exists')
      return
    }
    
    const newUser = {
      id: Date.now().toString(),
      email: userData.email,
      password: userData.password,
      fullName: userData.fullName,
      phone: userData.phone || '',
      accountType: userData.accountType || 'ordinary'
    }
    
    users.push(newUser)
    saveUsers(users)
    
    console.log('User registered successfully')
    console.log('All users now:', users.map(u => ({ email: u.email, password: u.password })))
    
    resolve('Registration successful! Please login.')
  })
}

// LOGIN USER - FIXED COMPARISON
export const loginUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const users = getUsers()
    
    console.log('=== LOGIN ===')
    console.log('Login attempt email:', email)
    console.log('Login attempt password:', password)
    console.log('All users:', users.map(u => ({ email: u.email, password: u.password })))
    
    // Find user with matching email
    const user = users.find(u => u.email === email)
    
    if (!user) {
      console.log('User not found with email:', email)
      reject('Invalid email or password')
      return
    }
    
    console.log('Found user:', user.email)
    console.log('Stored password:', user.password)
    console.log('Password match:', user.password === password)
    
    // Check password
    if (user.password !== password) {
      console.log('Password mismatch!')
      reject('Invalid email or password')
      return
    }
    
    // Set session data
    const token = 'token_' + Date.now()
    localStorage.setItem('accessToken', token)
    localStorage.setItem('currentUser', JSON.stringify(user))
    localStorage.setItem('userEmail', user.email)
    localStorage.setItem('userName', user.fullName)
    localStorage.setItem('userType', user.accountType)
    
    if (user.accountType === 'corporate') {
      localStorage.setItem('isCorporate', 'true')
      localStorage.setItem('multiDeviceAllowed', 'true')
    } else {
      localStorage.setItem('isCorporate', 'false')
      localStorage.setItem('multiDeviceAllowed', 'false')
    }
    
    console.log('Login successful!')
    resolve(user)
  })
}

// LOGOUT USER
export const logoutUser = () => {
  localStorage.clear()
}

// CHECK IF AUTHENTICATED
export const isAuthenticated = () => {
  return !!localStorage.getItem('accessToken')
}

// GET CURRENT USER
export const getCurrentUser = () => {
  const user = localStorage.getItem('currentUser')
  return user ? JSON.parse(user) : null
}
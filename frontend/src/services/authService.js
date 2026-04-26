// AUTH SERVICE - COMPLETE FILE
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
}

// REGISTER USER
export const registerUser = (userData) => {
  return new Promise((resolve, reject) => {
    const users = getUsers()
    
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
    
    resolve('Registration successful! Please login.')
  })
}

// LOGIN USER
export const loginUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const users = getUsers()
    const user = users.find(u => u.email === email && u.password === password)
    
    if (!user) {
      reject('Invalid email or password')
      return
    }
    
    // Set session data
    localStorage.setItem('accessToken', 'token_' + Date.now())
    localStorage.setItem('currentUser', JSON.stringify(user))
    localStorage.setItem('userEmail', user.email)
    localStorage.setItem('userName', user.fullName)
    localStorage.setItem('userType', user.accountType)
    
    if (user.accountType === 'corporate') {
      localStorage.setItem('isCorporate', 'true')
    } else {
      localStorage.setItem('isCorporate', 'false')
    }
    
    resolve(user)
  })
}

// LOGOUT USER
export const logoutUser = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('currentUser')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('userName')
  localStorage.removeItem('userType')
  localStorage.removeItem('isCorporate')
  localStorage.removeItem('token')
  localStorage.removeItem('user')
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
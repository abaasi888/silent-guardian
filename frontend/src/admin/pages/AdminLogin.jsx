import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../admin.css'

const AdminLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const users = JSON.parse(localStorage.getItem('sg_users') || '[]')
    
    let adminUser = users.find(u => u.email === email && u.accountType === 'admin')
    
    if (!adminUser && email === 'admin@silentguardian.com' && password === 'admin123') {
      adminUser = {
        id: 'admin1',
        email: 'admin@silentguardian.com',
        password: 'admin123',
        fullName: 'Admin User',
        accountType: 'admin',
        isApproved: true,
        role: 'ADMIN'
      }
      users.push(adminUser)
      localStorage.setItem('sg_users', JSON.stringify(users))
    }

    if (adminUser && adminUser.password === password) {
      localStorage.setItem('adminToken', 'admin-token-' + Date.now())
      localStorage.setItem('adminUser', JSON.stringify(adminUser))
      localStorage.setItem('userRole', 'ADMIN')
      localStorage.setItem('userEmail', adminUser.email)
      localStorage.setItem('userName', adminUser.fullName)
      navigate('/admin/dashboard')
    } else {
      setError('Invalid email or password')
    }
    setLoading(false)
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1>Silent Guardian</h1>
          <p>Admin Portal Login</p>
        </div>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="admin-login-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="admin-login-hint">
          <p>Demo Credentials:</p>
          <p>Email: admin@silentguardian.com</p>
          <p>Password: admin123</p>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
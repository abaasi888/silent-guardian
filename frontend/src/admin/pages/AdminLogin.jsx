import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    // MOCK LOGIN – accepts any email containing "admin"
    if (email.toLowerCase().includes('admin')) {
      localStorage.setItem('accessToken', 'mock-admin-token-' + Date.now())
      localStorage.setItem('refreshToken', 'mock-refresh-token')
      localStorage.setItem('userRole', 'ADMIN')
      navigate('/admin/dashboard')
    } else {
      setError('Admin access only. Use an email with "admin"')
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 20, background: 'white', borderRadius: 8 }}>
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email (must contain 'admin')"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', marginBottom: 10, padding: 8 }}
          required
        />
        <input
          type="password"
          placeholder="Password (any)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', marginBottom: 10, padding: 8 }}
          required
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ width: '100%', padding: 10, background: '#9c27b0', color: 'white', border: 'none' }}>
          Login
        </button>
      </form>
    </div>
  )
}
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import './Login.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', { email, password })
      const { accessToken, refreshToken, user } = response.data

      // Store tokens and user info
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('currentUser', JSON.stringify(user))
      localStorage.setItem('userType', user.accountType)
      localStorage.setItem('userEmail', user.email)
      localStorage.setItem('userName', user.fullName)

      if (user.accountType === 'corporate') {
        localStorage.setItem('isCorporate', 'true')
        localStorage.setItem('multiDeviceAllowed', 'true')
      } else {
        localStorage.setItem('isCorporate', 'false')
        localStorage.setItem('multiDeviceAllowed', 'false')
      }

      // Redirect based on role
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard')
      } else {
        navigate('/')
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Silent Guardian</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="login-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
        <p className="login-footer">
          <Link to="/kyc">Submit KYC</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
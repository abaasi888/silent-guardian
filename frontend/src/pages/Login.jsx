import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Login.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // MOCK LOGIN – using localStorage as fake database
    setTimeout(() => {
      // Check if there's a pending corporate registration
      const pending = localStorage.getItem('pendingRegistration')
      if (pending) {
        const pendingUser = JSON.parse(pending)
        if (pendingUser.email === email && pendingUser.accountType === 'corporate') {
          setError('Your corporate account is pending admin approval. Please wait.')
          setLoading(false)
          return
        }
      }

      // Check registered user (approved ordinary or corporate)
      const registered = localStorage.getItem('registeredUser')
      if (!registered) {
        setError('No user found. Please register first.')
        setLoading(false)
        return
      }

      const user = JSON.parse(registered)
      if (user.email !== email) {
        setError('Invalid credentials')
        setLoading(false)
        return
      }

      // Accept any password for demo (in real app, verify hash)
      // Set session data
      localStorage.setItem('accessToken', 'mock-token-' + Date.now())
      localStorage.setItem('refreshToken', 'mock-refresh-' + Date.now())
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

      navigate('/')
      setLoading(false)
    }, 500)
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
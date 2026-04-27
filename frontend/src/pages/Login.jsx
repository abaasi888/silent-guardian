import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser, logoutUser } from '../services/authService'
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

    console.log('Login form submitted with:', email, password)

    try {
      const user = await loginUser(email, password)
      console.log('Login successful, user:', user)
      
      // Redirect based on user type
      if (user.accountType === 'corporate') {
        navigate('/corporate/dashboard', { replace: true })
      } else if (user.accountType === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err)
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
      </div>
    </div>
  )
}

export default Login
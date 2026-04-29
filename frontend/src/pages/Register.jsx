import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../services/authService'
import './Register.css'

const Register = () => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accountType, setAccountType] = useState('ordinary')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (!fullName || !email || !password) {
      setError('Please fill all required fields')
      return
    }
    
    setLoading(true)

    try {
      const response = await registerUser({
        fullName,
        email,
        phone,
        password,
        accountType
      })
      
      setSuccess(response.message || 'Registration successful! Please login.')
      
      // Clear form
      setFullName('')
      setEmail('')
      setPhone('')
      setPassword('')
      setConfirmPassword('')
      
      setTimeout(() => {
        navigate('/login')
      }, 2000)
      
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">Create Account</h1>
        <form onSubmit={handleSubmit} className="register-form">
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="register-input"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="register-input"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="register-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="register-input"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="register-input"
          />
          
          <div className="register-account-type">
            <label>Account Type:</label>
            <label>
              <input
                type="radio"
                value="ordinary"
                checked={accountType === 'ordinary'}
                onChange={(e) => setAccountType(e.target.value)}
              />
              Ordinary User
            </label>
            <label>
              <input
                type="radio"
                value="corporate"
                checked={accountType === 'corporate'}
                onChange={(e) => setAccountType(e.target.value)}
              />
              Corporate Organisation
            </label>
          </div>
          
          {error && <p className="register-error">{error}</p>}
          {success && <p className="register-success">{success}</p>}
          
          <button type="submit" disabled={loading} className="register-button">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="register-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
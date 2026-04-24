import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Register.css'

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    accountType: 'ordinary' // 'ordinary' or 'corporate'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)

    // MOCK REGISTRATION – simulate backend storage
    setTimeout(() => {
      // Check if email already used in registeredUser or pending
      const existingRegistered = localStorage.getItem('registeredUser')
      if (existingRegistered) {
        const user = JSON.parse(existingRegistered)
        if (user.email === formData.email) {
          setError('Email already registered. Please login.')
          setLoading(false)
          return
        }
      }
      const existingPending = localStorage.getItem('pendingRegistration')
      if (existingPending) {
        const pending = JSON.parse(existingPending)
        if (pending.email === formData.email) {
          setError('This email is already pending approval.')
          setLoading(false)
          return
        }
      }

      const userData = {
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        accountType: formData.accountType
      }

      if (formData.accountType === 'corporate') {
        // Corporate: store as pending for admin approval
        localStorage.setItem('pendingRegistration', JSON.stringify(userData))
        setSuccess('Corporate registration request sent to admin. You will be notified when approved.')
      } else {
        // Ordinary: immediately registered
        localStorage.setItem('registeredUser', JSON.stringify(userData))
        setSuccess('Registration successful! Redirecting to login...')
        setTimeout(() => navigate('/login'), 2000)
      }
      setLoading(false)
    }, 500)
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">Create Account</h1>
        <form onSubmit={handleSubmit} className="register-form">
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="register-input"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="register-input"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
            className="register-input"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="register-input"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="register-input"
          />
          <div className="register-account-type">
            <label>Account Type:</label>
            <label>
              <input
                type="radio"
                name="accountType"
                value="ordinary"
                checked={formData.accountType === 'ordinary'}
                onChange={handleChange}
              /> Ordinary User (one device)
            </label>
            <label>
              <input
                type="radio"
                name="accountType"
                value="corporate"
                checked={formData.accountType === 'corporate'}
                onChange={handleChange}
              /> Corporate (multiple devices, requires approval)
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
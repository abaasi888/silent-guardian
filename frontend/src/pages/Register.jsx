import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import './Register.css'

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    accountType: 'ordinary',
    idDocument: null,
    selfie: null,
    businessDocs: null
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (files && files.length > 0) {
      setFormData({ ...formData, [name]: files[0].name })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (!formData.idDocument || !formData.selfie) {
      setError('Please upload ID document and a selfie picture')
      return
    }
    
    setLoading(true)

    try {
      const response = await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        accountType: formData.accountType,
        idDocument: formData.idDocument,
        selfie: formData.selfie,
        businessDocs: formData.businessDocs
      })
      
      setSuccess(response.data.message)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
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
              />
              Ordinary User
            </label>
            <label>
              <input
                type="radio"
                name="accountType"
                value="corporate"
                checked={formData.accountType === 'corporate'}
                onChange={handleChange}
              />
              Corporate Organisation
            </label>
          </div>

          <div className="register-file-upload">
            <label>ID Document (image/PDF):</label>
            <input type="file" name="idDocument" onChange={handleChange} required />
          </div>
          
          <div className="register-file-upload">
            <label>Selfie Picture:</label>
            <input type="file" name="selfie" onChange={handleChange} required />
          </div>
          
          {formData.accountType === 'corporate' && (
            <div className="register-file-upload">
              <label>Business Registration Documents:</label>
              <input type="file" name="businessDocs" onChange={handleChange} required />
            </div>
          )}
          
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
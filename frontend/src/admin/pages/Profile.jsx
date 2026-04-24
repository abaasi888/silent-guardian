// frontend/src/admin/pages/Profile.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './Profile.css'

export default function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: '',
    kycStatus: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Fetch user details (add `/auth/me` endpoint if missing, or use combined data)
        const userRes = await api.get('/auth/me') // assumes endpoint exists
        const kycRes = await api.get('/kyc/status')
        setProfile({
          fullName: userRes.data.fullName || '',
          email: userRes.data.email || '',
          phone: userRes.data.phone || '',
          role: userRes.data.role || '',
          kycStatus: kycRes.data.status || ''
        })
      } catch (err) {
        console.error('Failed to load profile', err)
        setMessage('Could not load profile data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await api.put('/auth/profile', {
        fullName: profile.fullName,
        phone: profile.phone
      })
      setMessage('Profile updated successfully')
    } catch (err) {
      setMessage('Update failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/admin/login')
  }

  if (loading) return <div className="admin-container profile-container">Loading profile...</div>

  return (
    <div className="admin-container profile-container">
      <div className="admin-header">
        <h1>My Profile</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" name="fullName" value={profile.fullName} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" name="email" value={profile.email} disabled />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input type="tel" name="phone" value={profile.phone} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Role</label>
          <input type="text" value={profile.role} disabled />
        </div>
        <div className="form-group">
          <label>KYC Status</label>
          <input type="text" value={profile.kycStatus} disabled />
        </div>
        <button type="submit" disabled={saving} className="btn-admin">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../services/authService'
import './Profile.css'

const Profile = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      setFormData({
        fullName: currentUser.fullName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } else {
      navigate('/login')
    }
  }, [navigate])

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setMessage('')
    
    // Check if new passwords match
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match!' })
      return
    }
    
    // Simulate profile update
    setTimeout(() => {
      // Update user in localStorage
      const updatedUser = { ...user, ...formData }
      localStorage.setItem('currentUser', JSON.stringify(updatedUser))
      localStorage.setItem('userName', formData.fullName)
      setUser(updatedUser)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setIsEditing(false)
      
      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    }, 500)
  }

  if (!user) {
    return <div className="profile-container">Loading...</div>
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
      </div>

      <div className="profile-content">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <h2>{user?.fullName}</h2>
            <p className="user-email">{user?.email}</p>
            <span className={`account-badge ${user?.accountType}`}>
              {user?.accountType === 'corporate' ? 'Corporate Account' : 'Ordinary User'}
            </span>
          </div>

          <div className="profile-details">
            <div className="info-section">
              <h3>Account Information</h3>
              <div className="info-row">
                <span className="info-label">Member Since:</span>
                <span className="info-value">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="info-row">
                <span className="info-label">KYC Status:</span>
                <span className="info-value badge-approved">Approved</span>
              </div>
              <div className="info-row">
                <span className="info-label">Account Type:</span>
                <span className="info-value">{user?.accountType === 'corporate' ? 'Corporate' : 'Ordinary'}</span>
              </div>
            </div>

            {!isEditing ? (
              <>
                <div className="info-section">
                  <h3>Personal Information</h3>
                  <div className="info-row">
                    <span className="info-label">Full Name:</span>
                    <span className="info-value">{user?.fullName}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email Address:</span>
                    <span className="info-value">{user?.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Phone Number:</span>
                    <span className="info-value">{user?.phone || 'Not provided'}</span>
                  </div>
                </div>
                
                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                  ✏️ Edit Profile
                </button>
              </>
            ) : (
              <form onSubmit={handleUpdateProfile} className="edit-form">
                <h3>Edit Profile</h3>
                
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-divider"></div>

                <h3>Change Password (Optional)</h3>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    placeholder="Enter current password"
                  />
                </div>
                
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter new password"
                  />
                </div>
                
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm new password"
                  />
                </div>

                {message && <div className={`message ${message.type}`}>{message.text}</div>}
                
                <div className="form-actions">
                  <button type="submit" className="save-btn">Save Changes</button>
                  <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
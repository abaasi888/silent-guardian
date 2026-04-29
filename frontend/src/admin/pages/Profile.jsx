import React, { useState, useEffect } from 'react'
import '../admin.css'

const Profile = () => {
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: ''
  })
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')
    setProfile({
      fullName: adminUser.fullName || localStorage.getItem('userName') || 'Admin User',
      email: adminUser.email || localStorage.getItem('userEmail') || 'admin@silentguardian.com',
      phone: '+1 234 567 8900',
      role: 'Super Admin'
    })
  }, [])

  const handleSave = () => {
    localStorage.setItem('userName', profile.fullName)
    localStorage.setItem('userEmail', profile.email)
    
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')
    adminUser.fullName = profile.fullName
    adminUser.email = profile.email
    localStorage.setItem('adminUser', JSON.stringify(adminUser))
    
    const allUsers = JSON.parse(localStorage.getItem('sg_users') || '[]')
    const updatedUsers = allUsers.map(u => 
      u.id === 'admin1' ? { ...u, fullName: profile.fullName, email: profile.email } : u
    )
    localStorage.setItem('sg_users', JSON.stringify(updatedUsers))
    
    setIsEditing(false)
    alert('Profile updated successfully!')
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Profile</h1>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          <div className="avatar-circle">{profile.fullName.charAt(0)}</div>
        </div>
        
        <div className="profile-info">
          {isEditing ? (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={profile.fullName} onChange={(e) => setProfile({...profile, fullName: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} />
              </div>
              <div className="form-actions">
                <button className="save-btn" onClick={handleSave}>Save</button>
                <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div className="info-row"><strong>Full Name:</strong> {profile.fullName}</div>
              <div className="info-row"><strong>Email:</strong> {profile.email}</div>
              <div className="info-row"><strong>Phone:</strong> {profile.phone}</div>
              <div className="info-row"><strong>Role:</strong> {profile.role}</div>
              <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
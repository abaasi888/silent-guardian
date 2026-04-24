import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import '../admin.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [pendingUsers, setPendingUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [organisations, setOrganisations] = useState([])
  const [allDevices, setAllDevices] = useState([])
  const [trackDeviceId, setTrackDeviceId] = useState('')
  const [trackLocation, setTrackLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deviceSearch, setDeviceSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')

  // Load all data from API
  const loadData = async () => {
    setLoading(true)
    try {
      const [pendingRes, usersRes, orgRes, devicesRes] = await Promise.all([
        api.get('/admin/users/pending'),
        api.get('/admin/users'),
        api.get('/admin/organisations'),
        api.get('/admin/devices/all')
      ])
      setPendingUsers(pendingRes.data)
      setAllUsers(usersRes.data)
      setOrganisations(orgRes.data)
      setAllDevices(devicesRes.data)
    } catch (error) {
      console.error('Failed to load admin data', error)
      alert('Error loading dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleApprove = async (userId) => {
    try {
      await api.post('/admin/users/approve', { userId })
      loadData()
    } catch (error) {
      alert('Approval failed')
    }
  }

  const handleReject = async (userId) => {
    if (window.confirm('Reject this user? This will delete the registration.')) {
      try {
        await api.post('/admin/users/reject', { userId })
        loadData()
      } catch (error) {
        alert('Rejection failed')
      }
    }
  }

  const approveKyc = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/kyc/approve`)
      loadData()
    } catch (error) {
      alert('KYC approval failed')
    }
  }

  const deleteUser = async (userId) => {
    if (window.confirm('Delete this user permanently?')) {
      try {
        await api.delete(`/admin/users/${userId}`)
        loadData()
      } catch (error) {
        alert('Delete failed')
      }
    }
  }

  const updateDeviceStatus = async (deviceId, newStatus) => {
    try {
      await api.post(`/admin/devices/${deviceId}/status`, { status: newStatus })
      loadData()
    } catch (error) {
      alert('Failed to update device status')
    }
  }

  const handleTrackDevice = async () => {
    if (!trackDeviceId.trim()) {
      alert('Please enter a Device ID (the unique identifier, e.g., van101)')
      return
    }
    try {
      const res = await api.post('/admin/track/device', { deviceId: trackDeviceId })
      setTrackLocation(res.data.location)
    } catch (error) {
      alert('Device not found or tracking failed')
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/admin/login')
  }

  // Helper: get user name by id
  const getUserName = (userId) => {
    const user = allUsers.find(u => u.id === userId)
    return user ? user.fullName : userId
  }

  // Filter devices based on search (by device name, deviceId, or assigned user)
  const filteredDevices = allDevices.filter(device =>
    device.deviceName?.toLowerCase().includes(deviceSearch.toLowerCase()) ||
    device.deviceId?.toLowerCase().includes(deviceSearch.toLowerCase()) ||
    getUserName(device.assignedTo).toLowerCase().includes(deviceSearch.toLowerCase())
  )

  // Filter users
  const filteredUsers = allUsers.filter(u =>
    u.isApproved && (
      u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
    )
  )

  if (loading) return <div className="admin-loading">Loading dashboard...</div>

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div>
          <button onClick={loadData} className="refresh-btn">🔄 Refresh</button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      {/* Pending Approvals Section */}
      <div className="admin-section">
        <h2>Pending Approvals (Ordinary & Corporate)</h2>
        {pendingUsers.length === 0 && <p>No pending registrations.</p>}
        <div className="admin-grid">
          {pendingUsers.map(user => (
            <div key={user.id} className="admin-card">
              <div className="admin-card-header">{user.fullName}</div>
              <div className="admin-card-body">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Phone:</strong> {user.phone}</p>
                <p><strong>Account Type:</strong> {user.accountType === 'corporate' ? '🏢 Corporate' : '👤 Ordinary'}</p>
                <p><strong>ID Document:</strong> {user.idDocument || 'Uploaded'}</p>
                <p><strong>Selfie:</strong> {user.selfie || 'Uploaded'}</p>
                {user.accountType === 'corporate' && <p><strong>Business Docs:</strong> {user.businessDocs || 'Uploaded'}</p>}
              </div>
              <div className="admin-card-footer">
                <button onClick={() => handleApprove(user.id)} className="btn-admin">Approve</button>
                <button onClick={() => handleReject(user.id)} className="btn-admin btn-danger">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Users Section with Search */}
      <div className="admin-section">
        <h2>All Users (Approved)</h2>
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          className="search-input"
        />
        <div className="admin-grid">
          {filteredUsers.map(user => (
            <div key={user.id} className="admin-card">
              <div className="admin-card-header">{user.fullName}</div>
              <div className="admin-card-body">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Phone:</strong> {user.phone}</p>
                <p><strong>Role:</strong> {user.accountType === 'corporate' ? 'Corporate Admin' : (user.accountType === 'team_member' ? 'Team Member' : 'Ordinary User')}</p>
                <p><strong>KYC:</strong> <span className={`status-badge ${user.kycStatus?.toLowerCase() || 'pending'}`}>{user.kycStatus || 'PENDING'}</span></p>
                {user.organisationId && <p><strong>Organisation ID:</strong> {user.organisationId}</p>}
              </div>
              <div className="admin-card-footer">
                {user.kycStatus !== 'approved' && (
                  <button onClick={() => approveKyc(user.id)} className="btn-admin btn-sm">Approve KYC</button>
                )}
                <button onClick={() => deleteUser(user.id)} className="btn-admin btn-danger btn-sm">Delete User</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Organisations Section */}
      <div className="admin-section">
        <h2>Corporate Organisations</h2>
        <div className="admin-grid">
          {organisations.map(org => {
            const orgDevices = allDevices.filter(d => d.organisationId === org.id)
            const orgMembers = allUsers.filter(u => u.organisationId === org.id)
            return (
              <div key={org.id} className="admin-card org-card">
                <div className="admin-card-header">{org.name}</div>
                <div className="admin-card-body">
                  <p><strong>Admin:</strong> {getUserName(org.adminId)}</p>
                  <p><strong>KYC Status:</strong> {org.kycStatus}</p>
                  <p><strong>Members:</strong> {orgMembers.length}</p>
                  <p><strong>Devices:</strong> {orgDevices.length}</p>
                  <details>
                    <summary>View Devices</summary>
                    <ul>
                      {orgDevices.map(d => (
                        <li key={d.id}>{d.deviceName} ({d.deviceId}) - Status: {d.status}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* All Devices Section with Search */}
      <div className="admin-section">
        <h2>All Platform Devices</h2>
        <input
          type="text"
          placeholder="Search by device name, ID, or assigned user..."
          value={deviceSearch}
          onChange={(e) => setDeviceSearch(e.target.value)}
          className="search-input"
        />
        <div className="admin-grid">
          {filteredDevices.map(device => {
            const org = organisations.find(o => o.id === device.organisationId)
            return (
              <div key={device.id} className="admin-card">
                <div className="admin-card-header">{device.deviceName}</div>
                <div className="admin-card-body">
                  <p><strong>Device ID:</strong> {device.deviceId}</p>
                  <p><strong>Status:</strong>
                    <select
                      value={device.status || 'inactive'}
                      onChange={(e) => updateDeviceStatus(device.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="offline">Offline</option>
                      <option value="removed">Removed</option>
                      <option value="STOLEN">Stolen</option>
                    </select>
                  </p>
                  <p><strong>Organisation:</strong> {org?.name || 'Ordinary User'}</p>
                  <p><strong>Assigned To:</strong> {getUserName(device.assignedTo)}</p>
                  <p><strong>Last Seen:</strong> {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}</p>
                </div>
                <div className="admin-card-footer">
                  {device.status !== 'STOLEN' && (
                    <button onClick={() => updateDeviceStatus(device.id, 'STOLEN')} className="btn-admin btn-danger btn-sm">
                      Mark Stolen
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Emergency Device Tracking Section */}
      <div className="admin-section emergency-tracking">
        <h2>🚨 Emergency Device Tracking</h2>
        <div className="tracking-form">
          <input
            type="text"
            placeholder="Enter Device ID (e.g., van101, iphone-abc123)"
            value={trackDeviceId}
            onChange={(e) => setTrackDeviceId(e.target.value)}
          />
          <button onClick={handleTrackDevice} className="btn-admin">Track Now</button>
        </div>
        {trackLocation && (
          <div className="tracking-result">
            <p>📍 Current Location: <strong>{trackLocation.lat}, {trackLocation.lng}</strong></p>
            <p><small>Mock location – integrate real maps for live view</small></p>
          </div>
        )}
      </div>
    </div>
  )
}
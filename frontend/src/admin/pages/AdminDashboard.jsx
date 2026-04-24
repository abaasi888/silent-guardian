import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../admin.css'

export default function AdminDashboard() {
  const navigate = useNavigate()

  // Mock data (internal only – no visible "mock" text)
  const [users, setUsers] = useState([
    { id: '1', email: 'john@example.com', fullName: 'John Doe', phone: '1234567890', kycStatus: 'APPROVED', role: 'USER' },
    { id: '2', email: 'jane@example.com', fullName: 'Jane Smith', phone: '0987654321', kycStatus: 'PENDING', role: 'USER' },
    { id: '3', email: 'bob@example.com', fullName: 'Bob Johnson', phone: '5551234567', kycStatus: 'NOT_SUBMITTED', role: 'USER' }
  ])

  const [devices, setDevices] = useState([
    { id: 'dev1', deviceName: 'iPhone 14 Pro', deviceId: 'iphone-abc123', status: 'ACTIVE', userId: '1', lastSeen: new Date().toISOString() },
    { id: 'dev2', deviceName: 'Samsung Galaxy S23', deviceId: 'samsung-def456', status: 'STOLEN', userId: '2', lastSeen: new Date().toISOString() },
    { id: 'dev3', deviceName: 'Google Pixel 7', deviceId: 'pixel-ghi789', status: 'INACTIVE', userId: '1', lastSeen: new Date(Date.now() - 86400000).toISOString() }
  ])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/admin/login')
  }

  const approveKyc = (userId) => {
    setUsers(users.map(u => u.id === userId ? { ...u, kycStatus: 'APPROVED' } : u))
  }

  const deleteUser = (userId) => {
    if (window.confirm('Delete this user?')) {
      setUsers(users.filter(u => u.id !== userId))
    }
  }

  const markStolen = (deviceId) => {
    setDevices(devices.map(d => d.deviceId === deviceId ? { ...d, status: 'STOLEN' } : d))
  }

  return (
    <>
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {/* Users Section */}
      <div className="admin-section">
        <h2>Users</h2>
        <div className="admin-grid">
          {users.map(user => (
            <div key={user.id} className="admin-card">
              <div className="admin-card-header">{user.fullName}</div>
              <div className="admin-card-body">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Phone:</strong> {user.phone}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>KYC Status:</strong> <span className={`status-badge ${user.kycStatus.toLowerCase()}`}>{user.kycStatus}</span></p>
              </div>
              <div className="admin-card-footer">
                {user.kycStatus !== 'APPROVED' && (
                  <button onClick={() => approveKyc(user.id)} className="btn-admin btn-sm">Approve KYC</button>
                )}
                <button onClick={() => deleteUser(user.id)} className="btn-admin btn-danger btn-sm">Delete User</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Devices Section */}
      <div className="admin-section">
        <h2>Devices</h2>
        <div className="admin-grid">
          {devices.map(device => (
            <div key={device.id} className="admin-card">
              <div className="admin-card-header">{device.deviceName}</div>
              <div className="admin-card-body">
                <p><strong>Device ID:</strong> {device.deviceId}</p>
                <p><strong>Status:</strong> <span className={`device-status ${device.status.toLowerCase()}`}>{device.status}</span></p>
                <p><strong>User ID:</strong> {device.userId}</p>
                <p><strong>Last Seen:</strong> {new Date(device.lastSeen).toLocaleString()}</p>
              </div>
              <div className="admin-card-footer">
                {device.status !== 'STOLEN' && (
                  <button onClick={() => markStolen(device.deviceId)} className="btn-admin btn-danger btn-sm">Mark Stolen</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
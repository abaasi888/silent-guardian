import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import StatsCards from '../components/StatsCards'
import '../admin.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [devices, setDevices] = useState([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDevices: 0,
    totalEmployees: 0,
    totalCommissions: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usersRes, devicesRes, statsRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/devices'),
          api.get('/admin/stats')
        ])
        setUsers(usersRes.data)
        setDevices(devicesRes.data)
        setStats(statsRes.data)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
        setError('Failed to load dashboard data. Please check your connection.')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/admin/login')
  }

  const approveKyc = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/kyc?status=APPROVED`)
      setUsers(users.map(u => 
        u.id === userId ? { ...u, kycStatus: 'APPROVED' } : u
      ))
    } catch (err) {
      console.error('KYC approval failed:', err)
      alert('Failed to approve KYC. Please try again.')
    }
  }

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      await api.delete(`/admin/users/${userId}`)
      setUsers(users.filter(u => u.id !== userId))
    } catch (err) {
      console.error('User deletion failed:', err)
      alert('Failed to delete user. Please try again.')
    }
  }

  const markStolen = async (deviceId) => {
    try {
      await api.put(`/admin/devices/${deviceId}/status?status=STOLEN`)
      setDevices(devices.map(d => 
        d.deviceId === deviceId ? { ...d, status: 'STOLEN' } : d
      ))
    } catch (err) {
      console.error('Failed to mark device stolen:', err)
      alert('Failed to update device status. Please try again.')
    }
  }

  if (loading) {
    return <div className="admin-container" style={{ textAlign: 'center', padding: '3rem' }}>Loading dashboard...</div>
  }

  if (error) {
    return <div className="admin-container" style={{ textAlign: 'center', padding: '3rem', color: 'red' }}>{error}</div>
  }

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {/* Statistics Cards */}
      <StatsCards
        totalUsers={stats.totalUsers}
        totalDevices={stats.totalDevices}
        pendingKyc={users.filter(u => u.kycStatus === 'PENDING').length}
        activeSubscriptions={users.filter(u => u.subscriptionActive).length}
      />

      {/* Users Section */}
      <div className="admin-section">
        <h2>Users</h2>
        <div className="admin-grid">
          {users.slice(0, 6).map(user => (
            <div key={user.id} className="admin-card">
              <div className="admin-card-header">
                {user.fullName}
              </div>
              <div className="admin-card-body">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Phone:</strong> {user.phone}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p>
                  <strong>KYC Status:</strong>{' '}
                  <span className={`status-badge ${user.kycStatus.toLowerCase()}`}>
                    {user.kycStatus}
                  </span>
                </p>
              </div>
              <div className="admin-card-footer">
                {user.kycStatus !== 'APPROVED' && (
                  <button onClick={() => approveKyc(user.id)} className="btn-admin btn-sm">
                    Approve KYC
                  </button>
                )}
                <button onClick={() => deleteUser(user.id)} className="btn-admin btn-danger btn-sm">
                  Delete User
                </button>
              </div>
            </div>
          ))}
        </div>
        {users.length > 6 && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button onClick={() => navigate('/admin/users')} className="btn-admin">
              View All Users ({users.length})
            </button>
          </div>
        )}
      </div>

      {/* Devices Section */}
      <div className="admin-section">
        <h2>Devices</h2>
        <div className="admin-grid">
          {devices.slice(0, 6).map(device => (
            <div key={device.id} className="admin-card">
              <div className="admin-card-header">
                {device.deviceName}
              </div>
              <div className="admin-card-body">
                <p><strong>Device ID:</strong> {device.deviceId}</p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span className={`device-status ${device.status.toLowerCase()}`}>
                    {device.status}
                  </span>
                </p>
                <p><strong>User ID:</strong> {device.userId}</p>
                <p><strong>Last Seen:</strong> {new Date(device.lastSeen).toLocaleString()}</p>
              </div>
              <div className="admin-card-footer">
                {device.status !== 'STOLEN' && (
                  <button onClick={() => markStolen(device.deviceId)} className="btn-admin btn-danger btn-sm">
                    Mark Stolen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {devices.length > 6 && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button onClick={() => navigate('/admin/devices')} className="btn-admin">
              View All Devices ({devices.length})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
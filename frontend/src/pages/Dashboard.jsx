import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../services/authService'
import LiveChat from '../components/LiveChat'
import './Dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalDevices: 0,
    activeDevices: 0,
    activeSubscriptions: 0
  })

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      loadStats()
    } else {
      navigate('/login')
    }
  }, [navigate])

  const loadStats = () => {
    const devices = JSON.parse(localStorage.getItem('user_devices') || '[]')
    setStats({
      totalDevices: devices.length,
      activeDevices: devices.filter(d => d.status === 'active').length,
      activeSubscriptions: devices.filter(d => d.subscription?.active).length
    })
    setLoading(false)
  }

  if (loading) {
    return <div className="dashboard-container">Loading dashboard...</div>
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Header */}
      <div className="welcome-header">
        <h1>Welcome back, {user?.fullName?.split(' ')[0] || 'User'}!</h1>
        <p>Track and manage all your devices from one place</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/devices')}>
          <div className="stat-icon">📱</div>
          <div className="stat-info">
            <h3>{stats.totalDevices}</h3>
            <p>Total Devices</p>
          </div>
        </div>
        <div className="stat-card" onClick={() => navigate('/devices')}>
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <h3>{stats.activeDevices}</h3>
            <p>Active Devices</p>
          </div>
        </div>
        <div className="stat-card" onClick={() => navigate('/subscriptions')}>
          <div className="stat-icon">💎</div>
          <div className="stat-info">
            <h3>{stats.activeSubscriptions}</h3>
            <p>Active Plans</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-grid">
        <div className="quick-action-card" onClick={() => navigate('/devices')}>
          <div className="action-icon">📱</div>
          <h4>Manage Devices</h4>
          <p>Add, remove, or view your devices</p>
        </div>
        <div className="quick-action-card" onClick={() => navigate('/subscriptions')}>
          <div className="action-icon">💳</div>
          <h4>Subscriptions</h4>
          <p>Manage your device plans</p>
        </div>
        <div className="quick-action-card" onClick={() => navigate('/location-history')}>
          <div className="action-icon">📍</div>
          <h4>Location History</h4>
          <p>View tracking history</p>
        </div>
        <div className="quick-action-card" onClick={() => navigate('/kyc')}>
          <div className="action-icon">📄</div>
          <h4>KYC Verification</h4>
          <p>Update your documents</p>
        </div>
      </div>

      {/* Live Chat */}
      <LiveChat />
    </div>
  )
}

export default Dashboard
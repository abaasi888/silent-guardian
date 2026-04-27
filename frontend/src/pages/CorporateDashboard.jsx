import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../services/authService'
import './CorporateDashboard.css'

const CorporateDashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalDevices: 0,
    activeDevices: 0,
    totalEmployees: 0,
    activeGeofences: 0,
    alertsToday: 0
  })
  const [recentAlerts, setRecentAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser && currentUser.accountType === 'corporate') {
      setUser(currentUser)
      loadCorporateData()
    } else {
      navigate('/login')
    }
  }, [navigate])

  const loadCorporateData = () => {
    // Load devices for corporate
    const devices = JSON.parse(localStorage.getItem('corporate_devices') || '[]')
    
    setStats({
      totalDevices: devices.length,
      activeDevices: devices.filter(d => d.status === 'active').length,
      totalEmployees: 12,
      activeGeofences: 3,
      alertsToday: 2
    })
    
    setRecentAlerts([
      { id: 1, device: 'Truck #101', message: 'Entered geofence zone A', time: '5 min ago', type: 'info' },
      { id: 2, device: 'Van #205', message: 'Speed limit exceeded', time: '15 min ago', type: 'warning' },
      { id: 3, device: 'Car #309', message: 'Device offline', time: '1 hour ago', type: 'danger' }
    ])
    
    setLoading(false)
  }

  if (loading) {
    return <div className="corporate-dashboard">Loading corporate dashboard...</div>
  }

  return (
    <div className="corporate-dashboard">
      {/* Welcome Section */}
      <div className="corporate-welcome">
        <h1>Welcome back, {user?.fullName?.split(' ')[0] || 'Admin'}!</h1>
        <p>Silent Guardian Corporate Fleet Management</p>
      </div>

      {/* Stats Cards */}
      <div className="corporate-stats-grid">
        <div className="corporate-stat-card">
          <div className="stat-icon">🚚</div>
          <div className="stat-content">
            <h3>{stats.totalDevices}</h3>
            <p>Total Vehicles</p>
          </div>
        </div>
        <div className="corporate-stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <h3>{stats.activeDevices}</h3>
            <p>Active Vehicles</p>
          </div>
        </div>
        <div className="corporate-stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalEmployees}</h3>
            <p>Team Members</p>
          </div>
        </div>
        <div className="corporate-stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <h3>{stats.activeGeofences}</h3>
            <p>Active Geofences</p>
          </div>
        </div>
        <div className="corporate-stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>{stats.alertsToday}</h3>
            <p>Alerts Today</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="corporate-quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <div className="action-card" onClick={() => navigate('/corporate/fleet')}>
            <div className="action-icon">🚚</div>
            <h4>View Fleet</h4>
            <p>See all vehicles in real-time</p>
          </div>
          <div className="action-card" onClick={() => navigate('/corporate/geofences')}>
            <div className="action-icon">📍</div>
            <h4>Create Geofence</h4>
            <p>Set virtual boundaries</p>
          </div>
          <div className="action-card" onClick={() => navigate('/corporate/team')}>
            <div className="action-icon">👥</div>
            <h4>Manage Team</h4>
            <p>Add or remove members</p>
          </div>
          <div className="action-card" onClick={() => navigate('/corporate/reports')}>
            <div className="action-icon">📊</div>
            <h4>Generate Report</h4>
            <p>View analytics & insights</p>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="corporate-alerts">
        <h2>Recent Alerts</h2>
        <div className="alerts-list">
          {recentAlerts.map(alert => (
            <div key={alert.id} className={`alert-item ${alert.type}`}>
              <div className="alert-icon">
                {alert.type === 'danger' && '🚨'}
                {alert.type === 'warning' && '⚠️'}
                {alert.type === 'info' && 'ℹ️'}
              </div>
              <div className="alert-content">
                <strong>{alert.device}</strong>
                <span>{alert.message}</span>
              </div>
              <div className="alert-time">{alert.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Preview */}
      <div className="corporate-map-preview">
        <h2>Live Fleet Map</h2>
        <div className="map-placeholder">
          <div className="map-mock">
            <div className="vehicle-marker truck">🚚</div>
            <div className="vehicle-marker van">🚐</div>
            <div className="vehicle-marker car">🚗</div>
            <div className="geofence-zone">Zone A</div>
            <div className="geofence-zone zone-b">Zone B</div>
            <p className="map-note">Interactive map would display all fleet vehicles in real-time</p>
          </div>
        </div>
        <button className="view-map-btn" onClick={() => navigate('/corporate/fleet')}>
          View Full Fleet Map →
        </button>
      </div>
    </div>
  )
}

export default CorporateDashboard
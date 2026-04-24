import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import TrackingMap from '../components/TrackingMap'
import LoadingSpinner from '../components/LoadingSpinner'
import './CorporateDashboard.css'

const CorporateDashboard = () => {
  const navigate = useNavigate()
  const [devices, setDevices] = useState([])
  const [locations, setLocations] = useState([])
  const [members, setMembers] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [trackingDeviceId, setTrackingDeviceId] = useState(null)
  const [trackedLocation, setTrackedLocation] = useState(null)

  // Get current user from localStorage (set by login)
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
  const userName = currentUser.fullName || localStorage.getItem('userName') || 'Corporate User'
  const isCorporate = currentUser.accountType === 'corporate'

  // Redirect if not corporate
  useEffect(() => {
    if (!isCorporate && localStorage.getItem('userType') !== 'corporate') {
      navigate('/')
    }
  }, [isCorporate, navigate])

  const loadData = async () => {
    setLoading(true)
    try {
      const [devicesRes, membersRes] = await Promise.all([
        api.get('/corporate/devices'),
        api.get('/corporate/members')
      ])
      setDevices(devicesRes.data)
      setMembers(membersRes.data)

      // Build locations from active devices (mock: use lastLocation or random)
      const activeDevices = devicesRes.data.filter(d => d.status === 'active')
      const mockLocations = activeDevices.map(device => ({
        deviceId: device.deviceId,
        lat: device.lastLocation?.lat || (40.7128 + Math.random() * 0.1),
        lng: device.lastLocation?.lng || (-74.0060 + Math.random() * 0.1),
        timestamp: device.lastSeen || new Date().toISOString()
      }))
      setLocations(mockLocations)

      // Mock subscription data (can be replaced with real endpoint later)
      setSubscription({
        active: true,
        endDate: new Date(2025, 5, 30),
        amountPaid: 5000
      })
    } catch (error) {
      console.error('Failed to load corporate data', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleViewHistory = (deviceId) => {
    navigate(`/location-history?deviceId=${deviceId}`)
  }

  const handleTrackDevice = async (deviceId) => {
    setTrackingDeviceId(deviceId)
    try {
      const res = await api.get(`/corporate/devices/location/${deviceId}`)
      setTrackedLocation(res.data.location)
      setTimeout(() => setTrackedLocation(null), 5000)
    } catch (error) {
      alert('Could not fetch location')
    } finally {
      setTrackingDeviceId(null)
    }
  }

  if (loading) return <LoadingSpinner message="Loading corporate dashboard..." />

  return (
    <div className="corporate-dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {userName.split(' ')[0]} (Corporate)</h1>
        <div className="header-actions">
          <button onClick={() => setChatOpen(!chatOpen)} className="chat-toggle-btn">💬 Support</button>
          <button onClick={() => { localStorage.clear(); navigate('/login') }} className="logout-btn">Logout</button>
        </div>
      </div>

      {/* Corporate summary stats */}
      <div className="corporate-stats">
        <div className="stat-card">📱 Total Devices: {devices.length}</div>
        <div className="stat-card">🟢 Active Devices: {devices.filter(d => d.status === 'active').length}</div>
        <div className="stat-card">👥 Team Members: {members.length}</div>
        <div className="stat-card">📄 Pending KYC: {members.filter(m => m.kycStatus === 'pending').length}</div>
      </div>

      {/* Corporate subscription status */}
      <div className="corporate-subscription-card">
        <h3>Corporate Account Status</h3>
        {subscription?.active ? (
          <>
            <p>✅ Active until <strong>{new Date(subscription.endDate).toLocaleDateString()}</strong></p>
            <p>Amount paid: ${subscription.amountPaid}</p>
            <button className="action-btn" onClick={() => alert('Contact admin for renewal')}>Request Renewal</button>
          </>
        ) : (
          <>
            <p>⚠️ Account inactive. Please contact your account manager.</p>
            <button className="action-btn" onClick={() => alert('Contact admin')}>Request Activation</button>
          </>
        )}
      </div>

      <div className="corporate-grid">
        {/* Left column – corporate management tools */}
        <div className="corporate-left">
          <div className="corporate-card">
            <h3>📦 Fleet Management</h3>
            <p>View all vehicles and assets.</p>
            <button onClick={() => navigate('/corporate/fleet')} className="action-btn">Go to Fleet</button>
          </div>
          <div className="corporate-card">
            <h3>📍 Geofences</h3>
            <p>Create virtual boundaries.</p>
            <button onClick={() => navigate('/corporate/geofences')} className="action-btn">Manage Geofences</button>
          </div>
          <div className="corporate-card">
            <h3>📊 Reports</h3>
            <p>Activity and compliance reports.</p>
            <button onClick={() => navigate('/corporate/reports')} className="action-btn">View Reports</button>
          </div>
          <div className="corporate-card">
            <h3>👥 Team Members</h3>
            <p>Manage sub‑accounts.</p>
            <button onClick={() => navigate('/corporate/team')} className="action-btn">Manage Team</button>
          </div>
          <div className="corporate-card">
            <h3>➕ Manage Devices</h3>
            <p>Add, remove or update device status.</p>
            <button onClick={() => navigate('/corporate/devices')} className="action-btn">Device Manager</button>
          </div>
        </div>

        {/* Right column – live tracking */}
        <div className="corporate-right">
          <div className="dashboard-section">
            <h2>Live Fleet Location</h2>
            <TrackingMap locations={locations} />
          </div>

          <div className="devices-section">
            <h2>All Devices ({devices.length})</h2>
            <div className="devices-grid">
              {devices.map(device => (
                <div key={device.id} className="device-card-simple">
                  <h4>{device.deviceName}</h4>
                  <p>ID: {device.deviceId}</p>
                  <p>Status: <span className={`status-badge ${device.status?.toLowerCase()}`}>{device.status || 'UNKNOWN'}</span></p>
                  <div className="device-actions">
                    <button onClick={() => handleViewHistory(device.deviceId)} className="action-btn-sm">History</button>
                    <button onClick={() => handleTrackDevice(device.id)} className="action-btn-sm" disabled={trackingDeviceId === device.id}>
                      {trackingDeviceId === device.id ? 'Tracking...' : 'Track Live'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live location popup */}
      {trackedLocation && (
        <div className="location-popup">
          <p>📍 Device location: {trackedLocation.lat}, {trackedLocation.lng}</p>
          <button onClick={() => setTrackedLocation(null)}>Close</button>
        </div>
      )}

      {/* Chat sidebar */}
      {chatOpen && (
        <div className="chat-sidebar">
          <div className="chat-header">
            <h3>Support Chat</h3>
            <button onClick={() => setChatOpen(false)}>✕</button>
          </div>
          <div className="chat-messages">
            <div className="message system">Chat with Silent Guardian support</div>
            <div className="message user">Hello, we need assistance with device tracking.</div>
          </div>
          <div className="chat-input">
            <input type="text" placeholder="Type message..." />
            <button>Send</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CorporateDashboard
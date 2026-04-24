import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'   // only useNavigate, not BrowserRouter etc.
import TrackingMap from '../components/TrackingMap'
import LoadingSpinner from '../components/LoadingSpinner'
import './CorporateDashboard.css'

const CorporateDashboard = () => {
  const navigate = useNavigate()
  const [devices, setDevices] = useState([])
  const [locations, setLocations] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const userName = localStorage.getItem('userName') || 'Corporate User'
  const userEmail = localStorage.getItem('userEmail') || ''

  useEffect(() => {
    // Mock data for corporate – multiple devices allowed
    const fetchMockData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setDevices([
        { id: 'dev1', deviceName: 'Truck #101', deviceId: 'trk101', status: 'ACTIVE', lastSeen: new Date().toISOString() },
        { id: 'dev2', deviceName: 'Van #205', deviceId: 'van205', status: 'ACTIVE', lastSeen: new Date().toISOString() },
        { id: 'dev3', deviceName: 'Car #309', deviceId: 'car309', status: 'INACTIVE', lastSeen: new Date().toISOString() }
      ])
      setLocations([
        { deviceId: 'trk101', lat: 40.7128, lng: -74.0060, timestamp: new Date().toISOString() },
        { deviceId: 'van205', lat: 40.7580, lng: -73.9855, timestamp: new Date().toISOString() }
      ])
      setSubscription({ active: true, endDate: new Date(2025, 5, 30), amountPaid: 5000 })
      setLoading(false)
    }
    fetchMockData()
  }, [])

  const handleViewHistory = (deviceId) => {
    navigate(`/location-history?deviceId=${deviceId}`)
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
                  <p>Status: <span className={`status-badge ${device.status.toLowerCase()}`}>{device.status}</span></p>
                  <button onClick={() => handleViewHistory(device.deviceId)} className="action-btn-sm">History</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat sidebar */}
      {chatOpen && (
        <div className="chat-sidebar">
          <div className="chat-header">
            <h3>Support Chat</h3>
            <button onClick={() => setChatOpen(false)}>✕</button>
          </div>
          <div className="chat-messages"><div className="message system">Contact support...</div></div>
          <div className="chat-input"><input type="text" placeholder="Message" /><button>Send</button></div>
        </div>
      )}
    </div>
  )
}

export default CorporateDashboard
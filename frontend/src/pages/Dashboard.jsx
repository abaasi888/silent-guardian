import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import DeviceCard from '../components/DeviceCard'
import TrackingMap from '../components/TrackingMap'
import LoadingSpinner from '../components/LoadingSpinner'
import './Dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [devices, setDevices] = useState([])
  const [locations, setLocations] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const wsRef = useRef(null)

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // User profile (assuming /auth/me exists – if not, use /kyc/status + stored data)
        let userRes
        try {
          userRes = await api.get('/auth/me')
        } catch {
          // Fallback: use data from localStorage or /kyc/status
          userRes = { data: { fullName: 'User', email: localStorage.getItem('userEmail') || '', phone: '', role: 'USER' } }
        }
        const kycRes = await api.get('/kyc/status')
        setUser({
          fullName: userRes.data.fullName || 'User',
          email: userRes.data.email || '',
          phone: userRes.data.phone || '',
          kycStatus: kycRes.data.status || 'NOT_SUBMITTED',
          role: userRes.data.role || 'USER'
        })

        // Devices
        const devicesRes = await api.get('/devices')
        setDevices(devicesRes.data)

        // Current subscription
        try {
          const subRes = await api.get('/subscriptions/current')
          setSubscription(subRes.data)
        } catch {
          setSubscription(null)
        }

        // Latest device locations
        if (devicesRes.data.length > 0) {
          const latestLocations = await Promise.all(
            devicesRes.data.map(device =>
              api.get(`/devices/history?deviceId=${device.deviceId}&limit=1`)
                .then(res => ({ deviceId: device.deviceId, ...res.data[0] }))
                .catch(() => null)
            )
          )
          setLocations(latestLocations.filter(loc => loc !== null && loc.lat))
        }
      } catch (err) {
        console.error('Dashboard error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // WebSocket for live chat
  useEffect(() => {
    if (chatOpen && !wsRef.current) {
      const ws = new WebSocket(`ws://${window.location.hostname}:5000/ws/chat`)
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          setChatMessages(prev => [...prev, { text: msg.message, from: 'support', timestamp: new Date() }])
        } catch (e) {
          setChatMessages(prev => [...prev, { text: event.data, from: 'support', timestamp: new Date() }])
        }
      }
      ws.onopen = () => {
        setChatMessages(prev => [...prev, { text: 'Connected to support. How can we help?', from: 'system', timestamp: new Date() }])
      }
      wsRef.current = ws
    }
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [chatOpen])

  const sendChatMessage = () => {
    if (!chatInput.trim() || !wsRef.current) return
    wsRef.current.send(JSON.stringify({ to: 'admin', message: chatInput }))
    setChatMessages(prev => [...prev, { text: chatInput, from: 'me', timestamp: new Date() }])
    setChatInput('')
  }

  const handleViewHistory = (deviceId) => {
    navigate(`/location-history?deviceId=${deviceId}`)
  }

  if (loading) return <LoadingSpinner message="Loading dashboard..." />

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.fullName?.split(' ')[0] || 'User'}!</h1>
        <div className="header-actions">
          <button onClick={() => setChatOpen(!chatOpen)} className="chat-toggle-btn">
            💬 Chat
          </button>
          <button onClick={() => { localStorage.clear(); navigate('/login') }} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        <h3>Profile</h3>
        <p><strong>Name:</strong> {user?.fullName}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Phone:</strong> {user?.phone}</p>
        <p><strong>KYC Status:</strong> <span className={`status-badge ${user?.kycStatus?.toLowerCase()}`}>{user?.kycStatus || 'Not Submitted'}</span></p>
        <button onClick={() => navigate('/kyc')} className="action-btn">Update KYC</button>
      </div>

      {/* Subscription Card */}
      <div className="subscription-card">
        <h3>Your Plan</h3>
        {subscription ? (
          <>
            <p><strong>Plan:</strong> {subscription.planId}</p>
            <p><strong>Device Tier:</strong> <span className={`tier-badge ${subscription.deviceTier?.toLowerCase()}`}>{subscription.deviceTier === 'CHEAP' ? 'Basic' : 'Premium'}</span></p>
            <p><strong>Expires:</strong> {new Date(subscription.endDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {subscription.active ? 'Active' : 'Inactive'}</p>
            {!subscription.active && (
              <button onClick={() => navigate('/subscriptions')} className="action-btn">Renew Now</button>
            )}
          </>
        ) : (
          <>
            <p>No active subscription</p>
            <button onClick={() => navigate('/subscriptions')} className="action-btn">Buy a Plan</button>
          </>
        )}
      </div>

      {/* Live Chat Sidebar */}
      {chatOpen && (
        <div className="chat-sidebar">
          <div className="chat-header">
            <h3>Support Chat</h3>
            <button onClick={() => setChatOpen(false)}>✕</button>
          </div>
          <div className="chat-messages">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.from}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Type your message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
            />
            <button onClick={sendChatMessage}>Send</button>
          </div>
        </div>
      )}

      {/* Live Map Section */}
      <div className="dashboard-section">
        <h2>Live Location</h2>
        <TrackingMap locations={locations} />
      </div>

      {/* Devices Section */}
      {devices.length > 0 && (
        <div className="devices-section">
          <h2>Your Devices</h2>
          <div className="devices-grid">
            {devices.map(device => (
              <DeviceCard key={device.id} device={device} onViewHistory={handleViewHistory} />
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-footer">
        <button onClick={() => navigate('/tracking')} className="action-btn">
          Open Full‑Screen Map
        </button>
      </div>
    </div>
  )
}

export default Dashboard
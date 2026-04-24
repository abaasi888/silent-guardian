import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import DeviceCard from '../components/DeviceCard'
import TrackingMap from '../components/TrackingMap'
import LoadingSpinner from '../components/LoadingSpinner'
import './Dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const [devices, setDevices] = useState([])
  const [locations, setLocations] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)

  // Get user type from localStorage
  const isCorporate = localStorage.getItem('isCorporate') === 'true'
  const userName = localStorage.getItem('userName') || 'User'
  const userEmail = localStorage.getItem('userEmail') || ''

  useEffect(() => {
    // Simulate API fetch (mock data)
    const fetchData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      // For corporate, show more devices (mock many devices)
      if (isCorporate) {
        setDevices([
          { id: 'dev1', deviceName: 'Van #101', deviceId: 'van101', status: 'ACTIVE', lastSeen: new Date().toISOString() },
          { id: 'dev2', deviceName: 'Van #102', deviceId: 'van102', status: 'ACTIVE', lastSeen: new Date().toISOString() },
          { id: 'dev3', deviceName: 'Truck #205', deviceId: 'truck205', status: 'INACTIVE', lastSeen: new Date().toISOString() }
        ])
        setLocations([
          { deviceId: 'van101', lat: 40.7128, lng: -74.0060, timestamp: new Date().toISOString() },
          { deviceId: 'van102', lat: 40.7140, lng: -74.0080, timestamp: new Date().toISOString() }
        ])
        setSubscription(null) // corporate has no subscription plan
      } else {
        setDevices([
          { id: 'dev1', deviceName: 'My iPhone', deviceId: 'abc123', status: 'ACTIVE', lastSeen: new Date().toISOString() }
        ])
        setLocations([
          { deviceId: 'abc123', lat: 40.7128, lng: -74.0060, timestamp: new Date().toISOString() }
        ])
        setSubscription({ planId: 'Premium', deviceTier: 'EXPENSIVE', endDate: new Date(2025, 0, 1), active: true })
      }
      setLoading(false)
    }
    fetchData()
  }, [isCorporate])

  const handleViewHistory = (deviceId) => {
    navigate(`/location-history?deviceId=${deviceId}`)
  }

  if (loading) return <LoadingSpinner message="Loading dashboard..." />

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {userName.split(' ')[0]}!</h1>
        <div className="header-actions">
          <button onClick={() => setChatOpen(!chatOpen)} className="chat-toggle-btn">💬 Chat</button>
          <button onClick={() => { localStorage.clear(); navigate('/login') }} className="logout-btn">Logout</button>
        </div>
      </div>

      {/* Corporate banner – only visible for corporate users */}
      {isCorporate && (
        <div className="corporate-banner">
          <span>🏢 Corporate Account – Unlimited devices | Custom agreement</span>
          <button onClick={() => navigate('/corporate/dashboard')} className="action-btn">
            Corporate Dashboard
          </button>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Left column */}
        <div className="dashboard-left">
          <div className="profile-card">
            <h3>Profile</h3>
            <p><strong>Name:</strong> {userName}</p>
            <p><strong>Email:</strong> {userEmail}</p>
            <p><strong>Account Type:</strong> {isCorporate ? 'Corporate' : 'Ordinary'}</p>
            <button onClick={() => navigate('/kyc')} className="action-btn">Update KYC</button>
          </div>

          {/* Subscription Card – only for ordinary users */}
          {!isCorporate && (
            <div className="subscription-card">
              <h3>Your Plan</h3>
              {subscription ? (
                <>
                  <p><strong>Plan:</strong> {subscription.planId}</p>
                  <p><strong>Device Tier:</strong>
                    <span className={`tier-badge ${subscription.deviceTier?.toLowerCase()}`}>
                      {subscription.deviceTier === 'CHEAP' ? 'Basic' : 'Premium'}
                    </span>
                  </p>
                  <p><strong>Expires:</strong> {new Date(subscription.endDate).toLocaleDateString()}</p>
                  <p><strong>Status:</strong> {subscription.active ? 'Active' : 'Inactive'}</p>
                  {!subscription.active && (
                    <button onClick={() => navigate('/subscriptions')} className="action-btn">Renew Now</button>
                  )}
                </>
              ) : (
                <>
                  <p>No active subscription</p>
                  <button onClick={() => navigate('/subscriptions')} className="action-btn">Buy Plan</button>
                </>
              )}
            </div>
          )}

          {/* Corporate quick links – only for corporate */}
          {isCorporate && (
            <div className="corporate-quick-links">
              <h3>Corporate Services</h3>
              <div className="quick-links-grid">
                <button onClick={() => navigate('/corporate/fleet')} className="quick-link">🚛 Fleet View</button>
                <button onClick={() => navigate('/corporate/geofences')} className="quick-link">📍 Geofences</button>
                <button onClick={() => navigate('/corporate/reports')} className="quick-link">📊 Reports</button>
                <button onClick={() => navigate('/corporate/team')} className="quick-link">👥 Team Members</button>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Map + Devices */}
        <div className="dashboard-right">
          <div className="dashboard-section">
            <h2>Live Location</h2>
            <TrackingMap locations={locations} />
          </div>

          <div className="devices-section">
            <h2>{isCorporate ? 'Fleet Devices' : 'Your Devices'}</h2>
            <div className="devices-grid">
              {devices.map(device => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onViewHistory={handleViewHistory}
                />
              ))}
            </div>
            {isCorporate && (
              <button className="action-btn" style={{ marginTop: '1rem' }} onClick={() => alert('Register new device via Android app')}>
                + Add New Device
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      {chatOpen && (
        <div className="chat-sidebar">
          <div className="chat-header">
            <h3>Support Chat</h3>
            <button onClick={() => setChatOpen(false)}>✕</button>
          </div>
          <div className="chat-messages">
            <div className="message system">Connect with an agent...</div>
          </div>
          <div className="chat-input">
            <input type="text" placeholder="Type your message..." />
            <button>Send</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
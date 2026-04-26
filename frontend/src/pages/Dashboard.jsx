import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TrackingMap from '../components/TrackingMap'
import DeviceCard from '../components/DeviceCard'
import './Dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [devices, setDevices] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser')
    if (currentUser) {
      const userData = JSON.parse(currentUser)
      setUser(userData)
      loadUserData(userData)
    } else {
      navigate('/login')
    }
  }, [navigate])

  const loadUserData = async (userData) => {
    setLoading(true)
    
    setTimeout(() => {
      if (userData.accountType === 'corporate') {
        setDevices([
          { id: 'dev1', deviceName: 'Truck #101', deviceId: 'trk101', status: 'ACTIVE', lastSeen: new Date().toISOString() },
          { id: 'dev2', deviceName: 'Van #205', deviceId: 'van205', status: 'ACTIVE', lastSeen: new Date().toISOString() },
          { id: 'dev3', deviceName: 'Car #309', deviceId: 'car309', status: 'INACTIVE', lastSeen: new Date().toISOString() }
        ])
        setLocations([
          { deviceId: 'trk101', lat: 40.7128, lng: -74.0060, timestamp: new Date().toISOString() },
          { deviceId: 'van205', lat: 40.7580, lng: -73.9855, timestamp: new Date().toISOString() }
        ])
      } else {
        setDevices([
          { id: 'dev1', deviceName: 'My iPhone', deviceId: 'iphone123', status: 'ACTIVE', lastSeen: new Date().toISOString() }
        ])
        setLocations([
          { deviceId: 'iphone123', lat: 40.7128, lng: -74.0060, timestamp: new Date().toISOString() }
        ])
      }
      
      setSubscription({
        active: true,
        planId: 'Premium',
        deviceTier: 'PREMIUM',
        endDate: new Date(2025, 0, 1),
        amountPaid: 5000
      })
      
      setLoading(false)
    }, 500)
  }

  const handleViewHistory = (deviceId) => {
    navigate(`/location-history?deviceId=${deviceId}`)
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  if (loading) {
    return <div className="dashboard-container">Loading your dashboard...</div>
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.fullName || user?.email}!</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Profile</h2>
          <div className="profile-info">
            <p><strong>Name:</strong> {user?.fullName}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Phone:</strong> {user?.phone || 'Not provided'}</p>
            <p><strong>Account Type:</strong> {user?.accountType === 'corporate' ? 'Corporate' : 'Ordinary'}</p>
            <p><strong>KYC Status:</strong> {user?.kycStatus || 'Approved'}</p>
          </div>
          <button className="action-btn" onClick={() => navigate('/kyc')}>Update KYC</button>
        </div>

        <div className="dashboard-card">
          <h2>Live Location</h2>
          <TrackingMap locations={locations} />
          {locations.length > 0 && (
            <div className="location-list">
              {locations.map((loc, idx) => (
                <div key={idx} className="location-item">
                  📍 {loc.deviceId}: {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-card">
          <h2>Your Plan</h2>
          {subscription?.active ? (
            <div className="plan-info">
              <p><strong>Plan:</strong> {subscription.planId}</p>
              <p><strong>Device Tier:</strong> {subscription.deviceTier}</p>
              <p><strong>Expires:</strong> {new Date(subscription.endDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> Active</p>
              <button className="action-btn" onClick={() => navigate('/subscriptions')}>Manage Subscription</button>
            </div>
          ) : (
            <p>No active subscription. <button className="action-btn" onClick={() => navigate('/subscriptions')}>Buy Plan</button></p>
          )}
        </div>

        <div className="dashboard-card devices-section">
          <h2>Your Devices</h2>
          <div className="devices-grid">
            {devices.map(device => (
              <DeviceCard key={device.id} device={device} onViewHistory={handleViewHistory} />
            ))}
          </div>
          <button className="action-btn" onClick={() => navigate('/tracking')}>View All Devices</button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
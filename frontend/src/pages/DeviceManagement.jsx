import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../services/authService'
import './DeviceManagement.css'

const DeviceManagement = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newDevice, setNewDevice] = useState({
    name: '',
    deviceId: '',
    plan: 'Basic'
  })

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      loadDevices()
    } else {
      navigate('/login')
    }
  }, [navigate])

  const loadDevices = () => {
    const savedDevices = localStorage.getItem('user_devices')
    if (savedDevices) {
      setDevices(JSON.parse(savedDevices))
    } else {
      const mockDevices = [
        {
          id: '1',
          name: 'My iPhone',
          deviceId: 'iphone123',
          status: 'active',
          lastSeen: new Date().toISOString(),
          lastLocation: { lat: 40.7128, lng: -74.0060 },
          subscription: {
            plan: 'Premium',
            tier: 'PREMIUM',
            expires: new Date(2025, 0, 1),
            active: true
          },
          battery: 87,
          firmware: 'v2.1.0'
        },
        {
          id: '2',
          name: 'Samsung Tablet',
          deviceId: 'samsung456',
          status: 'active',
          lastSeen: new Date().toISOString(),
          lastLocation: { lat: 40.7580, lng: -73.9855 },
          subscription: {
            plan: 'Basic',
            tier: 'STANDARD',
            expires: new Date(2024, 11, 31),
            active: true
          },
          battery: 62,
          firmware: 'v1.8.0'
        }
      ]
      setDevices(mockDevices)
      localStorage.setItem('user_devices', JSON.stringify(mockDevices))
    }
    setLoading(false)
  }

  const saveDevices = (updatedDevices) => {
    localStorage.setItem('user_devices', JSON.stringify(updatedDevices))
    setDevices(updatedDevices)
  }

  const handleAddDevice = () => {
    if (!newDevice.name || !newDevice.deviceId) {
      alert('Please fill all fields')
      return
    }

    const device = {
      id: Date.now().toString(),
      name: newDevice.name,
      deviceId: newDevice.deviceId,
      status: 'inactive',
      lastSeen: new Date().toISOString(),
      lastLocation: null,
      subscription: {
        plan: newDevice.plan,
        tier: newDevice.plan === 'Premium' ? 'PREMIUM' : 'STANDARD',
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        active: true
      },
      battery: 100,
      firmware: 'v1.0.0'
    }

    const updatedDevices = [...devices, device]
    saveDevices(updatedDevices)
    setShowAddModal(false)
    setNewDevice({ name: '', deviceId: '', plan: 'Basic' })
  }

  const handleRemoveDevice = (deviceId) => {
    if (window.confirm('Are you sure you want to remove this device?')) {
      const updatedDevices = devices.filter(d => d.id !== deviceId)
      saveDevices(updatedDevices)
    }
  }

  const handleReportStolen = (device) => {
    const updatedDevices = devices.map(d => 
      d.id === device.id ? { ...d, status: 'stolen' } : d
    )
    saveDevices(updatedDevices)
    
    // Store stolen report
    const stolenReports = JSON.parse(localStorage.getItem('stolen_reports') || '[]')
    stolenReports.push({
      deviceId: device.deviceId,
      deviceName: device.name,
      reportedAt: new Date().toISOString(),
      status: 'pending'
    })
    localStorage.setItem('stolen_reports', JSON.stringify(stolenReports))
    alert(`${device.name} has been reported as stolen. Recovery commands will be sent when the device comes online.`)
  }

  const handleTrackLocation = (deviceId) => {
    navigate(`/location-history?deviceId=${deviceId}`)
  }

  const handleManageSubscription = (deviceId) => {
    navigate(`/subscriptions?deviceId=${deviceId}`)
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return <span className="status-badge active">● Active</span>
      case 'inactive': return <span className="status-badge inactive">○ Inactive</span>
      case 'stolen': return <span className="status-badge stolen">⚠ Stolen</span>
      default: return <span className="status-badge unknown">? Unknown</span>
    }
  }

  if (loading) {
    return <div className="device-container">Loading devices...</div>
  }

  return (
    <div className="device-container">
      <div className="device-header">
        <h1>My Devices</h1>
        <p>Manage all your devices in one place</p>
        <button className="add-device-btn" onClick={() => setShowAddModal(true)}>
          + Add New Device
        </button>
      </div>

      {/* Devices List */}
      <div className="devices-list">
        {devices.length === 0 ? (
          <div className="no-devices">
            <p>You don't have any devices yet.</p>
            <button onClick={() => setShowAddModal(true)}>Add Your First Device</button>
          </div>
        ) : (
          devices.map(device => (
            <div key={device.id} className="device-item">
              <div className="device-icon">📱</div>
              <div className="device-details">
                <div className="device-name-row">
                  <h3>{device.name}</h3>
                  {getStatusBadge(device.status)}
                </div>
                <p className="device-id-text">Device ID: {device.deviceId}</p>
                <div className="device-specs">
                  <span>🔋 {device.battery}%</span>
                  <span>📡 {device.firmware}</span>
                  <span>📅 Last seen: {new Date(device.lastSeen).toLocaleDateString()}</span>
                </div>
                {device.lastLocation && (
                  <p className="device-location">📍 {device.lastLocation.lat.toFixed(4)}, {device.lastLocation.lng.toFixed(4)}</p>
                )}
                <div className="device-subscription-info">
                  <span className={`plan-badge ${device.subscription.plan.toLowerCase()}`}>
                    {device.subscription.plan} • {device.subscription.tier}
                  </span>
                  <span>Expires: {new Date(device.subscription.expires).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="device-actions">
                <button className="action-track" onClick={() => handleTrackLocation(device.deviceId)}>
                  📍 Track
                </button>
                <button className="action-subscribe" onClick={() => handleManageSubscription(device.deviceId)}>
                  💳 Plan
                </button>
                {device.status !== 'stolen' && (
                  <button className="action-stolen" onClick={() => handleReportStolen(device)}>
                    🚨 Stolen
                  </button>
                )}
                <button className="action-remove" onClick={() => handleRemoveDevice(device.id)}>
                  🗑 Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Device</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Device Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., My iPhone, Work Laptop"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Device ID (from app)</label>
                <input 
                  type="text" 
                  placeholder="Enter the device ID from your app"
                  value={newDevice.deviceId}
                  onChange={(e) => setNewDevice({...newDevice, deviceId: e.target.value})}
                />
                <small>Find this in your Silent Guardian app under Settings</small>
              </div>
              <div className="form-group">
                <label>Subscription Plan</label>
                <select 
                  value={newDevice.plan}
                  onChange={(e) => setNewDevice({...newDevice, plan: e.target.value})}
                >
                  <option value="Basic">Basic - $4.99/month</option>
                  <option value="Premium">Premium - $9.99/month</option>
                  <option value="Family">Family - $14.99/month (up to 5 devices)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="submit-btn" onClick={handleAddDevice}>Add Device</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeviceManagement
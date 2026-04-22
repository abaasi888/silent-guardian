import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import './Dashboard.css'

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user info from /api/v1/auth/me (we need to add that endpoint? Or use /kyc/status as proxy)
        // We'll fetch KYC status to get user basic info. Alternatively add /me endpoint.
        const kycRes = await api.get('/kyc/status')
        setUser({ kycStatus: kycRes.data.status })
        // Fetch devices
        // Note: DeviceController has /devices/register and /devices/location, but no GET all devices.
        // We'll assume there's an endpoint /devices (not yet written). For demo, we'll use a placeholder.
        // In a real project, implement GET /devices in DeviceController.
        const devicesRes = await api.get('/devices') // This endpoint needs to be added in backend
        setDevices(devicesRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  if (loading) return <div className="loading">Loading dashboard...</div>

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back!</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>KYC Status</h3>
          <p className={`status-badge ${user?.kycStatus?.toLowerCase()}`}>{user?.kycStatus || 'Unknown'}</p>
          <button onClick={() => navigate('/kyc')} className="action-btn">Update KYC</button>
        </div>
        <div className="stat-card">
          <h3>Registered Devices</h3>
          <p className="device-count">{devices.length}</p>
          <button onClick={() => alert('Register device via Android app')} className="action-btn">Add Device</button>
        </div>
        <div className="stat-card">
          <h3>Subscription</h3>
          <p>Premium plan available</p>
          <button onClick={() => navigate('/checkout/premium/19.99')} className="action-btn">Buy Premium (USDT)</button>
        </div>
      </div>
      {devices.length > 0 && (
        <div className="devices-list">
          <h2>Your Devices</h2>
          <ul>
            {devices.map(device => (
              <li key={device.id} className="device-item">
                <span>{device.deviceName}</span>
                <span className={`device-status ${device.status.toLowerCase()}`}>{device.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default Dashboard
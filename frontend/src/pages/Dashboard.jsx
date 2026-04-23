import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import DeviceCard from '../components/DeviceCard'
import TrackingMap from '../components/TrackingMap'     // <-- import TrackingMap
import LoadingSpinner from '../components/LoadingSpinner'
import './Dashboard.css'

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [devices, setDevices] = useState([])
  const [locations, setLocations] = useState([])      // For map
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const kycRes = await api.get('/kyc/status')
        setUser({ kycStatus: kycRes.data.status })
        
        // Fetch user's devices
        const devicesRes = await api.get('/devices')
        setDevices(devicesRes.data)
        
        // Fetch latest locations for map (optional)
        if (devicesRes.data.length > 0) {
          const latestLocations = await Promise.all(
            devicesRes.data.map(device => 
              api.get(`/devices/history?deviceId=${device.deviceId}&limit=1`)
                .then(res => ({ deviceId: device.deviceId, ...res.data[0] }))
                .catch(() => null)
            )
          )
          setLocations(latestLocations.filter(loc => loc !== null))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleViewHistory = (deviceId) => {
    navigate(`/location-history?deviceId=${deviceId}`)
  }

  if (loading) return <LoadingSpinner message="Loading dashboard..." />

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back!</h1>
        <button onClick={() => { localStorage.clear(); navigate('/login') }} className="logout-btn">
          Logout
        </button>
      </div>

      {/* Tracking Map Section */}
      <div className="dashboard-section">
        <h2>Live Location</h2>
        <TrackingMap locations={locations} />
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
          <button onClick={() => alert('Register device via Android app')} className="action-btn">
            Add Device
          </button>
        </div>
        <div className="stat-card">
          <h3>Subscription</h3>
          <p>Premium plan available</p>
          <button onClick={() => navigate('/checkout/premium/19.99')} className="action-btn">
            Buy Premium (USDT)
          </button>
        </div>
      </div>

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
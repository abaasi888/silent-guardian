import React, { useState, useEffect } from 'react'
import './CorporatePages.css'

export default function CorporateFleet() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)

  // Mock fleet data (replace with API call later)
  const mockDevices = [
    { id: '1', deviceName: 'Van #101', status: 'ACTIVE', lastLocation: { lat: 40.7128, lng: -74.0060 }, lastSeen: new Date().toISOString() },
    { id: '2', deviceName: 'Van #102', status: 'ACTIVE', lastLocation: { lat: 40.7140, lng: -74.0080 }, lastSeen: new Date().toISOString() },
    { id: '3', deviceName: 'Truck #205', status: 'INACTIVE', lastLocation: { lat: 40.7100, lng: -74.0100 }, lastSeen: new Date(Date.now() - 86400000).toISOString() },
    { id: '4', deviceName: 'Car #CEO', status: 'STOLEN', lastLocation: { lat: 40.7200, lng: -74.0200 }, lastSeen: new Date(Date.now() - 3600000).toISOString() }
  ]

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setDevices(mockDevices)
      setLoading(false)
    }, 500)
  }, [])

  if (loading) return <div className="corporate-page">Loading fleet data...</div>

  return (
    <div className="corporate-page">
      <h1>Fleet Management</h1>
      <div className="fleet-grid">
        {devices.map(device => (
          <div key={device.id} className="fleet-card">
            <h3>{device.deviceName}</h3>
            <p>Status: <span className={`status ${device.status.toLowerCase()}`}>{device.status}</span></p>
            <p>Last Location: {device.lastLocation?.lat || 'N/A'}, {device.lastLocation?.lng || 'N/A'}</p>
            <p>Last Seen: {new Date(device.lastSeen).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
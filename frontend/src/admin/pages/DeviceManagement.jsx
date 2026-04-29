import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../admin.css'

const DeviceManagement = () => {
  const navigate = useNavigate()
  const [devices, setDevices] = useState([])
  const [filteredDevices, setFilteredDevices] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [showTrackModal, setShowTrackModal] = useState(false)
  const [trackingLocation, setTrackingLocation] = useState(null)
  const [locationHistory, setLocationHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDevices()
  }, [])

  const loadDevices = () => {
    const allDevices = JSON.parse(localStorage.getItem('sg_devices') || '[]')
    setDevices(allDevices)
    setFilteredDevices(allDevices)
    setLoading(false)
  }

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase()
    setSearchTerm(term)
    const filtered = devices.filter(device => 
      device.name?.toLowerCase().includes(term) ||
      device.deviceId?.toLowerCase().includes(term)
    )
    setFilteredDevices(filtered)
  }

  const updateDeviceStatus = (deviceId, status) => {
    const allDevices = JSON.parse(localStorage.getItem('sg_devices') || '[]')
    const updatedDevices = allDevices.map(device => 
      device.id === deviceId ? { ...device, status: status, lastSeen: new Date().toISOString() } : device
    )
    localStorage.setItem('sg_devices', JSON.stringify(updatedDevices))
    loadDevices()
    alert(`Device status updated to ${status}`)
  }

  const deleteDevice = (deviceId) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      const allDevices = JSON.parse(localStorage.getItem('sg_devices') || '[]')
      const updatedDevices = allDevices.filter(device => device.id !== deviceId)
      localStorage.setItem('sg_devices', JSON.stringify(updatedDevices))
      loadDevices()
      alert('Device deleted successfully!')
    }
  }

  const trackDevice = (device) => {
    setSelectedDevice(device)
    setTrackingLocation(device.lastLocation || { lat: 40.7128, lng: -74.0060 })
    // Load location history for this device
    const history = JSON.parse(localStorage.getItem(`location_history_${device.deviceId}`) || '[]')
    setLocationHistory(history.slice(-10).reverse())
    setShowTrackModal(true)
  }

  const refreshLocation = () => {
    // Simulate getting new location
    const newLocation = {
      lat: 40.7128 + (Math.random() - 0.5) * 0.05,
      lng: -74.0060 + (Math.random() - 0.5) * 0.05,
      timestamp: new Date().toISOString()
    }
    setTrackingLocation(newLocation)
    
    // Update device location
    const allDevices = JSON.parse(localStorage.getItem('sg_devices') || '[]')
    const updatedDevices = allDevices.map(device => 
      device.id === selectedDevice.id ? { 
        ...device, 
        lastLocation: newLocation, 
        lastSeen: new Date().toISOString() 
      } : device
    )
    localStorage.setItem('sg_devices', JSON.stringify(updatedDevices))
    
    // Add to location history
    const history = JSON.parse(localStorage.getItem(`location_history_${selectedDevice.deviceId}`) || '[]')
    history.push(newLocation)
    localStorage.setItem(`location_history_${selectedDevice.deviceId}`, JSON.stringify(history.slice(-50)))
    setLocationHistory(history.slice(-10).reverse())
    
    alert('Location updated!')
  }

  const sendRecoveryCommand = () => {
    alert(`🚨 Emergency recovery command sent to ${selectedDevice.name}!\n\nThe device will respond with its location when it comes online.`)
    // Store command in pending commands
    const pendingCommands = JSON.parse(localStorage.getItem('pending_commands') || '[]')
    pendingCommands.push({
      deviceId: selectedDevice.deviceId,
      deviceName: selectedDevice.name,
      command: 'recovery',
      sentAt: new Date().toISOString(),
      status: 'pending'
    })
    localStorage.setItem('pending_commands', JSON.stringify(pendingCommands))
  }

  const sendSmsCommand = () => {
    const phone = prompt('Enter phone number to receive SMS alerts:', '+2567XXXXXXXX')
    if (phone) {
      alert(`📱 SMS alert will be sent to ${phone} when device is located.`)
    }
  }

  const viewFullHistory = () => {
    navigate(`/location-history?deviceId=${selectedDevice.deviceId}`)
  }

  if (loading) {
    return <div className="admin-loading">Loading devices...</div>
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Device Management</h1>
        <button onClick={loadDevices} className="refresh-btn">🔄 Refresh</button>
      </div>

      <div className="admin-search">
        <input
          type="text"
          placeholder="Search by device name or ID..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Device Name</th>
              <th>Device ID</th>
              <th>Hardware ID</th>
              <th>Status</th>
              <th>Battery</th>
              <th>Last Seen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">No devices found</td>
              </tr>
            ) : (
              filteredDevices.map(device => (
                <tr key={device.id}>
                  <td>{device.name}</td>
                  <td>{device.deviceId}</td>
                  <td>{device.hardwareId?.substring(0, 8)}...</td>
                  <td>
                    <select 
                      value={device.status} 
                      onChange={(e) => updateDeviceStatus(device.id, e.target.value)}
                      className={`status-select ${device.status}`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="stolen">Stolen</option>
                    </select>
                  </td>
                  <td>{device.battery || '—'}%</td>
                  <td>{device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}</td>
                  <td className="action-cell">
                    <button className="track-btn" onClick={() => trackDevice(device)}>📍 Track</button>
                    <button className="delete-btn" onClick={() => deleteDevice(device.id)}>Delete</button>
                   </td>
                 </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Track Device Modal */}
      {showTrackModal && selectedDevice && (
        <div className="modal-overlay" onClick={() => setShowTrackModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Track Device - {selectedDevice.name}</h2>
              <button className="modal-close" onClick={() => setShowTrackModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="tracking-info">
                <div className="device-details">
                  <p><strong>Device ID:</strong> {selectedDevice.deviceId}</p>
                  <p><strong>Status:</strong> <span className={`status-badge ${selectedDevice.status}`}>{selectedDevice.status}</span></p>
                  <p><strong>Last Seen:</strong> {selectedDevice.lastSeen ? new Date(selectedDevice.lastSeen).toLocaleString() : 'Never'}</p>
                  <p><strong>Battery:</strong> {selectedDevice.battery || 'N/A'}%</p>
                  <p><strong>Firmware:</strong> {selectedDevice.firmware || 'v1.0.0'}</p>
                </div>
                
                <div className="location-map">
                  <h3>Current Location</h3>
                  <div className="map-placeholder">
                    <div className="map-coordinates">
                      <p>📍 <strong>Latitude:</strong> {trackingLocation?.lat}</p>
                      <p>📍 <strong>Longitude:</strong> {trackingLocation?.lng}</p>
                      <p>🕐 <strong>Updated:</strong> {new Date().toLocaleTimeString()}</p>
                    </div>
                    <div className="map-mock">
                      <div className="mock-map">
                        <div className="map-grid"></div>
                        <div className="location-marker" style={{ left: '50%', top: '50%' }}>📍</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location History */}
              {locationHistory.length > 0 && (
                <div className="location-history">
                  <h3>Recent Location History</h3>
                  <div className="history-list">
                    {locationHistory.map((loc, idx) => (
                      <div key={idx} className="history-item">
                        <span className="history-time">{new Date(loc.timestamp).toLocaleTimeString()}</span>
                        <span className="history-coords">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="tracking-actions">
                <button className="refresh-location-btn" onClick={refreshLocation}>
                  🔄 Refresh Location
                </button>
                <button className="sms-btn" onClick={sendSmsCommand}>
                  📱 Send SMS Alert
                </button>
                <button className="recovery-btn" onClick={sendRecoveryCommand}>
                  🚨 Emergency Recovery
                </button>
                <button className="history-btn" onClick={viewFullHistory}>
                  📜 Full History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeviceManagement
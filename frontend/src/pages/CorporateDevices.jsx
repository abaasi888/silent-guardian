// frontend/src/pages/CorporateDevices.jsx
import React, { useState, useEffect } from 'react'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import './CorporatePages.css'

export default function CorporateDevices() {
  const [devices, setDevices] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newDevice, setNewDevice] = useState({
    deviceName: '',
    deviceId: '',
    assignedToUserId: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [trackingLocation, setTrackingLocation] = useState(null)
  const [trackingDeviceId, setTrackingDeviceId] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [devicesRes, membersRes] = await Promise.all([
        api.get('/corporate/devices'),
        api.get('/corporate/members')
      ])
      setDevices(devicesRes.data)
      setMembers(membersRes.data)
    } catch (err) {
      console.error('Failed to load devices', err)
      setError('Could not load devices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewDevice(prev => ({ ...prev, [name]: value }))
  }

  const handleAddDevice = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!newDevice.deviceName || !newDevice.deviceId || !newDevice.assignedToUserId) {
      setError('Please fill all fields')
      return
    }
    try {
      await api.post('/corporate/devices/add', newDevice)
      setSuccess('Device added successfully')
      setNewDevice({ deviceName: '', deviceId: '', assignedToUserId: '' })
      setShowAddForm(false)
      loadData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add device')
    }
  }

  const handleDeleteDevice = async (deviceId) => {
    if (window.confirm('Delete this device permanently?')) {
      try {
        await api.post('/corporate/devices/delete', { deviceId })
        loadData()
      } catch (err) {
        alert('Failed to delete device')
      }
    }
  }

  const handleStatusChange = async (deviceId, status) => {
    try {
      await api.post('/corporate/devices/update-status', { deviceId, status })
      loadData()
    } catch (err) {
      alert('Failed to update device status')
    }
  }

  const handleTrackLocation = async (deviceId) => {
    setTrackingDeviceId(deviceId)
    try {
      const res = await api.get(`/corporate/devices/location/${deviceId}`)
      setTrackingLocation(res.data.location)
      setTimeout(() => setTrackingLocation(null), 5000)
    } catch (err) {
      alert('Could not fetch device location')
    } finally {
      setTrackingDeviceId(null)
    }
  }

  const getUserName = (userId) => {
    const member = members.find(m => m.id === userId)
    return member ? member.fullName : userId
  }

  const filteredDevices = devices.filter(device =>
    device.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.deviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getUserName(device.assignedTo).toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <LoadingSpinner message="Loading fleet devices..." />

  return (
    <div className="corporate-page">
      <div className="page-header">
        <h1>Manage Fleet Devices</h1>
        <div>
          <button onClick={loadData} className="btn-refresh">🔄 Refresh</button>
          <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary">
            {showAddForm ? 'Cancel' : '+ Add Device'}
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search by device name, ID, or assigned user..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />

      {showAddForm && (
        <div className="add-device-form">
          <h3>Add New Device</h3>
          <form onSubmit={handleAddDevice}>
            <input
              type="text"
              name="deviceName"
              placeholder="Device Name (e.g., Truck #101)"
              value={newDevice.deviceName}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="deviceId"
              placeholder="Device ID (e.g., TRK101, IMEI)"
              value={newDevice.deviceId}
              onChange={handleInputChange}
              required
            />
            <select
              name="assignedToUserId"
              value={newDevice.assignedToUserId}
              onChange={handleInputChange}
              required
            >
              <option value="">Assign to team member</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.fullName} ({m.role})</option>
              ))}
            </select>
            {error && <p className="error-msg">{error}</p>}
            {success && <p className="success-msg">{success}</p>}
            <button type="submit" className="btn-primary">Add Device</button>
          </form>
        </div>
      )}

      {filteredDevices.length === 0 ? (
        <p className="no-data">No devices found. Add one using the button above.</p>
      ) : (
        <div className="devices-manager-grid">
          {filteredDevices.map(device => (
            <div key={device.id} className="device-manager-card">
              <div className="device-card-header">
                <h3>{device.deviceName}</h3>
                <span className={`device-status ${device.status?.toLowerCase()}`}>
                  {device.status || 'INACTIVE'}
                </span>
              </div>
              <div className="device-card-body">
                <p><strong>Device ID:</strong> {device.deviceId}</p>
                <p><strong>Assigned to:</strong> {getUserName(device.assignedTo)}</p>
                <p><strong>Last Seen:</strong> {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}</p>
                <div className="status-update">
                  <label>Update Status:</label>
                  <select
                    value={device.status || 'inactive'}
                    onChange={(e) => handleStatusChange(device.id, e.target.value)}
                  >
                    <option value="active">Active (On)</option>
                    <option value="inactive">Inactive (Off)</option>
                    <option value="offline">Offline</option>
                    <option value="removed">Removed</option>
                  </select>
                </div>
              </div>
              <div className="device-card-footer">
                <button onClick={() => handleTrackLocation(device.id)} className="btn-sm btn-track" disabled={trackingDeviceId === device.id}>
                  {trackingDeviceId === device.id ? 'Tracking...' : '📍 Track Live'}
                </button>
                <button onClick={() => handleDeleteDevice(device.id)} className="btn-sm btn-danger">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {trackingLocation && (
        <div className="location-popup">
          <p>📍 Current Location: {trackingLocation.lat}, {trackingLocation.lng}</p>
          <button onClick={() => setTrackingLocation(null)}>Close</button>
        </div>
      )}
    </div>
  )
}
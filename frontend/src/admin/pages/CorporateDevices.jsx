import React, { useState, useEffect } from 'react'
import api from '../services/api'
import './CorporatePages.css'

export default function CorporateDevices() {
  const [devices, setDevices] = useState([])
  const [members, setMembers] = useState([])
  const [newDevice, setNewDevice] = useState({ deviceName: '', deviceId: '', assignedToUserId: '' })
  const [trackedLocation, setTrackedLocation] = useState(null)

  useEffect(() => {
    loadDevices()
    loadMembers()
  }, [])

  const loadDevices = async () => {
    const res = await api.get('/corporate/devices')
    setDevices(res.data)
  }
  const loadMembers = async () => {
    const res = await api.get('/corporate/members')
    setMembers(res.data)
  }

  const handleAddDevice = async (e) => {
    e.preventDefault()
    await api.post('/corporate/devices/add', newDevice)
    setNewDevice({ deviceName: '', deviceId: '', assignedToUserId: '' })
    loadDevices()
  }

  const handleDeleteDevice = async (deviceId) => {
    if (window.confirm('Remove this device?')) {
      await api.post('/corporate/devices/delete', { deviceId })
      loadDevices()
    }
  }

  const handleStatusChange = async (deviceId, status) => {
    await api.post('/corporate/devices/update-status', { deviceId, status })
    loadDevices()
  }

  const handleTrackLocation = async (deviceId) => {
    const res = await api.get(`/corporate/devices/location/${deviceId}`)
    setTrackedLocation(res.data.location)
    setTimeout(() => setTrackedLocation(null), 5000)
  }

  return (
    <div className="corporate-page">
      <h1>Manage Fleet Devices</h1>
      <div className="add-device-form">
        <h3>Add New Device</h3>
        <form onSubmit={handleAddDevice}>
          <input type="text" placeholder="Device Name" value={newDevice.deviceName} onChange={e => setNewDevice({...newDevice, deviceName: e.target.value})} required />
          <input type="text" placeholder="Device ID (IMEI/Serial)" value={newDevice.deviceId} onChange={e => setNewDevice({...newDevice, deviceId: e.target.value})} required />
          <select value={newDevice.assignedToUserId} onChange={e => setNewDevice({...newDevice, assignedToUserId: e.target.value})} required>
            <option value="">Assign to team member</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName} ({m.role})</option>)}
          </select>
          <button type="submit">Add Device</button>
        </form>
      </div>
      <div className="devices-list">
        {devices.map(dev => (
          <div key={dev.id} className="device-card">
            <h3>{dev.deviceName}</h3>
            <p>Device ID: {dev.deviceId}</p>
            <p>Assigned to: {members.find(m => m.id === dev.assignedTo)?.fullName || 'Unassigned'}</p>
            <p>Status: 
              <select value={dev.status} onChange={e => handleStatusChange(dev.id, e.target.value)}>
                <option value="active">Active (On)</option>
                <option value="inactive">Inactive (Off)</option>
                <option value="offline">Offline</option>
                <option value="removed">Removed</option>
              </select>
            </p>
            <button onClick={() => handleTrackLocation(dev.id)}>Get Current Location</button>
            <button onClick={() => handleDeleteDevice(dev.id)} className="delete-btn">Delete Device</button>
          </div>
        ))}
      </div>
      {trackedLocation && (
        <div className="location-popup">
          <p>📍 Current Location: {trackedLocation.lat}, {trackedLocation.lng}</p>
        </div>
      )}
    </div>
  )
}
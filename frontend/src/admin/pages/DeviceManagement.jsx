import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import './DeviceManagement.css'

export default function DeviceManagement() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      const res = await api.get('/admin/devices')
      setDevices(res.data)
    } catch (err) {
      setError('Failed to load devices')
    } finally {
      setLoading(false)
    }
  }

  const markStolen = async (deviceId) => {
    try {
      await api.put(`/admin/devices/${deviceId}/status?status=STOLEN`)
      setDevices(devices.map(d => d.deviceId === deviceId ? { ...d, status: 'STOLEN' } : d))
    } catch (err) {
      alert('Failed to mark stolen')
    }
  }

  if (loading) return <div className="admin-container">Loading devices...</div>
  if (error) return <div className="admin-container error">{error}</div>

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Device Management</h1>
      </div>
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Device Name</th>
              <th>Device ID</th>
              <th>Status</th>
              <th>User ID</th>
              <th>Last Seen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {devices.map(device => (
              <tr key={device.id}>
                <td>{device.deviceName}</td>
                <td><code>{device.deviceId}</code></td>
                <td><span className={`device-status ${device.status.toLowerCase()}`}>{device.status}</span></td>
                <td>{device.userId}</td>
                <td>{new Date(device.lastSeen).toLocaleString()}</td>
                <td>
                  {device.status !== 'STOLEN' && (
                    <button onClick={() => markStolen(device.deviceId)} className="btn-table btn-stolen">Mark Stolen</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
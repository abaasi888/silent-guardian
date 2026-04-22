import React from 'react'
import './DeviceCard.css'

const DeviceCard = ({ device, onViewHistory }) => {
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'status-active'
      case 'inactive': return 'status-inactive'
      case 'stolen': return 'status-stolen'
      default: return 'status-pending'
    }
  }

  return (
    <div className="device-card">
      <div className="device-card-header">
        <h3>{device.deviceName || 'Unnamed Device'}</h3>
        <span className={`device-status ${getStatusClass(device.status)}`}>
          {device.status || 'PENDING'}
        </span>
      </div>
      <div className="device-card-body">
        <p><strong>Device ID:</strong> {device.deviceId}</p>
        <p><strong>Last seen:</strong> {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}</p>
        {device.lastLocation && (
          <p><strong>Last location:</strong> {device.lastLocation.lat}, {device.lastLocation.lng}</p>
        )}
      </div>
      <div className="device-card-footer">
        <button onClick={() => onViewHistory(device.deviceId)} className="history-btn">
          View Location History
        </button>
      </div>
    </div>
  )
}

export default DeviceCard
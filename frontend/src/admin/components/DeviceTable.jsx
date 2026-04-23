import React from 'react'
import './DeviceTable.css'

const DeviceTable = ({ devices, onMarkStolen }) => {
  if (!devices || devices.length === 0) {
    return <div className="table-empty">No devices found</div>
  }

  return (
    <div className="device-table-container">
      <table className="device-table">
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
              <td>
                <span className={`device-status ${device.status.toLowerCase()}`}>
                  {device.status}
                </span>
              </td>
              <td>{device.userId}</td>
              <td>{new Date(device.lastSeen).toLocaleString()}</td>
              <td>
                {device.status !== 'STOLEN' && (
                  <button onClick={() => onMarkStolen(device.deviceId)} className="btn-table btn-stolen">
                    Mark Stolen
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DeviceTable
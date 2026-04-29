import React, { useState } from 'react'
import '../admin.css'

const AuditLogs = () => {
  const [logs] = useState([
    { id: 1, action: 'User Login', user: 'admin@silentguardian.com', timestamp: '2024-01-15 10:30:00', ip: '192.168.1.1', status: 'success' },
    { id: 2, action: 'Device Added', user: 'john@example.com', timestamp: '2024-01-15 09:15:00', ip: '192.168.1.2', status: 'success' },
    { id: 3, action: 'KYC Approved', user: 'admin@silentguardian.com', timestamp: '2024-01-14 16:45:00', ip: '192.168.1.1', status: 'success' },
    { id: 4, action: 'Device Deleted', user: 'jane@example.com', timestamp: '2024-01-14 14:20:00', ip: '192.168.1.3', status: 'success' },
    { id: 5, action: 'Failed Login Attempt', user: 'unknown@example.com', timestamp: '2024-01-14 08:00:00', ip: '10.0.0.1', status: 'failed' }
  ])

  const exportCSV = () => {
    const csvContent = 'ID,Action,User,Timestamp,IP,Status\n' + 
      logs.map(log => `${log.id},${log.action},${log.user},${log.timestamp},${log.ip},${log.status}`).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Audit Logs</h1>
        <button className="export-btn" onClick={exportCSV}>📥 Export CSV</button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>User</th>
              <th>IP Address</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td>{log.timestamp}</td>
                <td>{log.action}</td>
                <td>{log.user}</td>
                <td>{log.ip}</td>
                <td><span className={`status-badge ${log.status}`}>{log.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AuditLogs
import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import './AuditLogs.css'

const AuditLogs = () => {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    api.get('/corporate/audit/org/current').then(res => setLogs(res.data))
  }, [])

  const filteredLogs = filter ? logs.filter(l => l.action.includes(filter)) : logs

  return (
    <div className="audit-logs">
      <h1>Audit Logs</h1>
      <input placeholder="Filter by action" value={filter} onChange={e => setFilter(e.target.value)} />
      <table className="audit-table">
        <thead>
          <tr><th>Timestamp</th><th>User</th><th>Action</th><th>Resource</th><th>Details</th></tr>
        </thead>
        <tbody>
          {filteredLogs.map(log => (
            <tr key={log.id}>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
              <td>{log.userId}</td>
              <td>{log.action}</td>
              <td>{log.resourceType}</td>
              <td>{JSON.stringify(log.details)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AuditLogs
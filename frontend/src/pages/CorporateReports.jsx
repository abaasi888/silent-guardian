import React, { useState, useEffect } from 'react'
import './CorporatePages.css'

export default function CorporateReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  // Mock report data
  const mockReports = [
    { id: '1', name: 'April Fleet Summary', type: 'MONTHLY', status: 'COMPLETED', date: '2025-04-01' },
    { id: '2', name: 'Geofence Breaches – Last 7 Days', type: 'GEOFENCE', status: 'PENDING', date: '2025-04-10' },
    { id: '3', name: 'Speeding Events', type: 'SAFETY', status: 'COMPLETED', date: '2025-04-15' }
  ]

  useEffect(() => {
    setTimeout(() => {
      setReports(mockReports)
      setLoading(false)
    }, 500)
  }, [])

  if (loading) return <div className="corporate-page">Loading reports...</div>

  return (
    <div className="corporate-page">
      <h1>Reports</h1>
      <table className="reports-table">
        <thead>
          <tr><th>Name</th><th>Type</th><th>Status</th><th>Date</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {reports.map(report => (
            <tr key={report.id}>
              <td>{report.name}</td>
              <td>{report.type}</td>
              <td><span className={`status ${report.status.toLowerCase()}`}>{report.status}</span></td>
              <td>{report.date}</td>
              <td><button className="btn-sm">Download</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
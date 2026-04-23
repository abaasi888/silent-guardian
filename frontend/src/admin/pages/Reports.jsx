import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import './Reports.css'

const Reports = () => {
  const [reports, setReports] = useState([])
  const [newReport, setNewReport] = useState({ type: 'DAILY_SUMMARY', filters: {} })

  useEffect(() => {
    api.get('/corporate/reports/org/current').then(res => setReports(res.data))
  }, [])

  const generateReport = async () => {
    const res = await api.post('/corporate/reports', { ...newReport, orgId: 'current', generatedBy: 'admin' })
    setReports([res.data, ...reports])
  }

  return (
    <div className="reports-page">
      <h1>Reports</h1>
      <div className="generate-report">
        <select value={newReport.type} onChange={e => setNewReport({...newReport, type: e.target.value})}>
          <option value="DAILY_SUMMARY">Daily Summary</option>
          <option value="DEVICE_ACTIVITY">Device Activity</option>
          <option value="GEOFENCE_BREACH">Geofence Breaches</option>
          <option value="SPEEDING">Speeding Events</option>
        </select>
        <button onClick={generateReport}>Generate Report</button>
      </div>
      <ul>
        {reports.map(r => (
          <li key={r.id}>{r.type} – {r.status} – {new Date(r.createdAt).toLocaleString()}</li>
        ))}
      </ul>
    </div>
  )
}

export default Reports
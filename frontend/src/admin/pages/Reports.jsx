import React, { useState } from 'react'
import '../admin.css'

const Reports = () => {
  const [reportType, setReportType] = useState('users')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [generating, setGenerating] = useState(false)
  const [reportData, setReportData] = useState(null)

  const generateReport = () => {
    setGenerating(true)
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('sg_users') || '[]')
      const devices = JSON.parse(localStorage.getItem('sg_devices') || '[]')
      
      let data = {}
      if (reportType === 'users') {
        data = {
          totalUsers: users.filter(u => u.accountType !== 'admin').length,
          corporateUsers: users.filter(u => u.accountType === 'corporate').length,
          ordinaryUsers: users.filter(u => u.accountType === 'ordinary').length,
          kycApproved: users.filter(u => u.kycStatus === 'approved').length,
          kycPending: users.filter(u => u.kycStatus === 'pending').length
        }
      } else if (reportType === 'devices') {
        data = {
          totalDevices: devices.length,
          activeDevices: devices.filter(d => d.status === 'active').length,
          inactiveDevices: devices.filter(d => d.status === 'inactive').length,
          stolenDevices: devices.filter(d => d.status === 'stolen').length
        }
      }
      setReportData(data)
      setGenerating(false)
    }, 1500)
  }

  const exportReport = () => {
    if (!reportData) return
    const csvContent = Object.entries(reportData).map(([key, value]) => `${key},${value}`).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Reports</h1>
      </div>

      <div className="reports-filters">
        <div className="filter-group">
          <label>Report Type</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="users">User Report</option>
            <option value="devices">Device Report</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Start Date</label>
          <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
        </div>
        <div className="filter-group">
          <label>End Date</label>
          <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} />
        </div>
        <button className="generate-btn" onClick={generateReport} disabled={generating}>
          {generating ? 'Generating...' : 'Generate Report'}
        </button>
        {reportData && <button className="export-btn" onClick={exportReport}>📥 Export CSV</button>}
      </div>

      {reportData && (
        <div className="report-preview">
          <h3>Report Preview</h3>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead><tr><th>Metric</th><th>Value</th></tr></thead>
              <tbody>
                {Object.entries(reportData).map(([key, value]) => (
                  <tr key={key}><td>{key.replace(/([A-Z])/g, ' $1').trim()}</td><td>{value}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports
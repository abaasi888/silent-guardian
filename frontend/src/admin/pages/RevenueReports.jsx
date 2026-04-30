import React, { useState, useEffect } from 'react'
import '../admin.css'

const RevenueReports = () => {
  const [reportType, setReportType] = useState('monthly')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState([])

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const generateReport = () => {
    setLoading(true)
    setTimeout(() => {
      const devices = JSON.parse(localStorage.getItem('sg_devices') || '[]')
      const allSubscriptions = []
      let newSignupsRevenue = 0
      let renewalRevenue = 0
      let totalNewSignups = 0
      let totalRenewals = 0
      
      devices.forEach(device => {
        if (device.subscription) {
          const startDate = new Date(device.subscription.startDate || device.subscription.lastPayment)
          let include = false
          
          if (reportType === 'monthly') {
            if (startDate.getMonth() === selectedMonth && startDate.getFullYear() === selectedYear) {
              include = true
            }
          } else if (reportType === 'yearly') {
            if (startDate.getFullYear() === selectedYear) {
              include = true
            }
          }
          
          if (include) {
            const amount = device.subscription.amount || (device.subscription.plan === 'Premium' ? 9.99 : 4.99)
            allSubscriptions.push({
              deviceName: device.name,
              deviceId: device.deviceId,
              owner: device.owner || 'Unknown',
              plan: device.subscription.plan,
              amount: amount,
              date: startDate.toLocaleDateString(),
              type: device.subscription.type || 'new'
            })
            
            if (device.subscription.type === 'new') {
              newSignupsRevenue += amount
              totalNewSignups++
            } else {
              renewalRevenue += amount
              totalRenewals++
            }
          }
        }
      })
      
      setReportData({
        subscriptions: allSubscriptions,
        newSignupsRevenue,
        renewalRevenue,
        totalRevenue: newSignupsRevenue + renewalRevenue,
        totalNewSignups,
        totalRenewals,
        commissions: newSignupsRevenue * 0.3,
        netRevenue: (newSignupsRevenue * 0.7) + renewalRevenue
      })
      setTransactions(allSubscriptions)
      setLoading(false)
    }, 1000)
  }

  const exportReport = () => {
    if (!transactions.length) return
    
    const csvContent = [
      ['Device Name', 'Device ID', 'Owner', 'Plan', 'Amount', 'Date', 'Type'],
      ...transactions.map(t => [t.deviceName, t.deviceId, t.owner, t.plan, `$${t.amount}`, t.date, t.type.toUpperCase()])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportType}_revenue_${selectedMonth + 1}_${selectedYear}.csv`
    a.click()
  }

  useEffect(() => {
    generateReport()
  }, [reportType, selectedMonth, selectedYear])

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Revenue Reports</h1>
        <button className="export-btn" onClick={exportReport} disabled={!transactions.length}>📥 Export CSV</button>
      </div>

      <div className="reports-filters">
        <div className="filter-group">
          <label>Report Type</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="monthly">Monthly Report</option>
            <option value="yearly">Yearly Report</option>
          </select>
        </div>
        
        {reportType === 'monthly' && (
          <div className="filter-group">
            <label>Month</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
              {months.map((month, idx) => (<option key={idx} value={idx}>{month}</option>))}
            </select>
          </div>
        )}
        
        <div className="filter-group">
          <label>Year</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
            <option value={2023}>2023</option>
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
        </div>
        
        <button className="generate-btn" onClick={generateReport} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {reportData && (
        <>
          <div className="revenue-summary-cards">
            <div className="summary-card"><div className="summary-icon">💰</div><div className="summary-info"><h3>${reportData.totalRevenue.toFixed(2)}</h3><p>Total Revenue</p></div></div>
            <div className="summary-card"><div className="summary-icon">🆕</div><div className="summary-info"><h3>${reportData.newSignupsRevenue.toFixed(2)}</h3><p>New Signups</p><small>{reportData.totalNewSignups} signups</small></div></div>
            <div className="summary-card"><div className="summary-icon">🔄</div><div className="summary-info"><h3>${reportData.renewalRevenue.toFixed(2)}</h3><p>Renewals</p><small>{reportData.totalRenewals} renewals</small></div></div>
            <div className="summary-card"><div className="summary-icon">💸</div><div className="summary-info"><h3>${reportData.commissions.toFixed(2)}</h3><p>Commissions (30%)</p></div></div>
            <div className="summary-card"><div className="summary-icon">📈</div><div className="summary-info"><h3>${reportData.netRevenue.toFixed(2)}</h3><p>Net Revenue</p></div></div>
          </div>

          <div className="transactions-table-container">
            <h3>Transaction Details</h3>
            <table className="admin-table">
              <thead><tr><th>Date</th><th>Device</th><th>Device ID</th><th>Owner</th><th>Plan</th><th>Amount</th><th>Type</th></tr></thead>
              <tbody>
                {transactions.map((t, idx) => (
                  <tr key={idx}><td>{t.date}</td><td>{t.deviceName}</td><td>{t.deviceId}</td><td>{t.owner}</td><td>{t.plan}</td><td>${t.amount}</td><td><span className={`type-badge ${t.type}`}>{t.type}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default RevenueReports
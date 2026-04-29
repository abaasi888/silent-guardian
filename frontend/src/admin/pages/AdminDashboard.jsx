import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../admin.css'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDevices: 0,
    activeDevices: 0,
    pendingKyc: 0
  })
  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    newSignupsRevenue: 0,
    renewalRevenue: 0,
    totalSignups: 0,
    totalRenewals: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0
  })
  const [recentTransactions, setRecentTransactions] = useState([])
  const [showRevenueModal, setShowRevenueModal] = useState(false)
  const [reportType, setReportType] = useState('monthly')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    loadRevenueData()
    loadTransactions()
  }, [])

  const loadDashboardData = () => {
    const users = JSON.parse(localStorage.getItem('sg_users') || '[]')
    const devices = JSON.parse(localStorage.getItem('sg_devices') || '[]')
    
    setStats({
      totalUsers: users.filter(u => u.accountType !== 'admin').length,
      totalDevices: devices.length,
      activeDevices: devices.filter(d => d.status === 'active').length,
      pendingKyc: users.filter(u => u.kycStatus === 'pending').length
    })
  }

  const loadRevenueData = () => {
    // Get all subscriptions from devices
    const devices = JSON.parse(localStorage.getItem('sg_devices') || '[]')
    const allSubscriptions = []
    
    devices.forEach(device => {
      if (device.subscription) {
        allSubscriptions.push({
          deviceId: device.deviceId,
          deviceName: device.name,
          plan: device.subscription.plan,
          amount: device.subscription.amount || (device.subscription.plan === 'Premium' ? 9.99 : 4.99),
          startDate: device.subscription.startDate || device.subscription.lastPayment,
          expiryDate: device.subscription.expires,
          status: device.subscription.active ? 'active' : 'expired',
          type: device.subscription.type || 'new' // 'new' or 'renewal'
        })
      }
    })
    
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    let totalRevenue = 0
    let monthlyRevenue = 0
    let yearlyRevenue = 0
    let newSignupsRevenue = 0
    let renewalRevenue = 0
    let totalSignups = 0
    let totalRenewals = 0
    let activeSubscriptions = 0
    let expiredSubscriptions = 0
    
    allSubscriptions.forEach(sub => {
      totalRevenue += sub.amount
      
      if (sub.status === 'active') activeSubscriptions++
      else expiredSubscriptions++
      
      const startDate = new Date(sub.startDate)
      if (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) {
        monthlyRevenue += sub.amount
        if (sub.type === 'new') {
          newSignupsRevenue += sub.amount
          totalSignups++
        } else {
          renewalRevenue += sub.amount
          totalRenewals++
        }
      }
      
      if (startDate.getFullYear() === currentYear) {
        yearlyRevenue += sub.amount
      }
    })
    
    setRevenueStats({
      totalRevenue,
      monthlyRevenue,
      yearlyRevenue,
      newSignupsRevenue,
      renewalRevenue,
      totalSignups,
      totalRenewals,
      activeSubscriptions,
      expiredSubscriptions
    })
    setLoading(false)
  }

  const loadTransactions = () => {
    const transactions = JSON.parse(localStorage.getItem('sg_transactions') || '[]')
    setRecentTransactions(transactions.slice(-10).reverse())
  }

  const generateReport = () => {
    const devices = JSON.parse(localStorage.getItem('sg_devices') || '[]')
    const allSubscriptions = []
    
    devices.forEach(device => {
      if (device.subscription) {
        const startDate = new Date(device.subscription.startDate || device.subscription.lastPayment)
        if (reportType === 'monthly') {
          if (startDate.getMonth() === selectedMonth && startDate.getFullYear() === selectedYear) {
            allSubscriptions.push({
              deviceName: device.name,
              deviceId: device.deviceId,
              plan: device.subscription.plan,
              amount: device.subscription.amount || (device.subscription.plan === 'Premium' ? 9.99 : 4.99),
              date: startDate.toLocaleDateString(),
              type: device.subscription.type || 'new'
            })
          }
        } else if (reportType === 'yearly') {
          if (startDate.getFullYear() === selectedYear) {
            allSubscriptions.push({
              deviceName: device.name,
              deviceId: device.deviceId,
              plan: device.subscription.plan,
              amount: device.subscription.amount || (device.subscription.plan === 'Premium' ? 9.99 : 4.99),
              date: startDate.toLocaleDateString(),
              type: device.subscription.type || 'new'
            })
          }
        }
      }
    })
    
    // Generate CSV
    const csvContent = [
      ['Device Name', 'Device ID', 'Plan', 'Amount', 'Date', 'Type'],
      ...allSubscriptions.map(s => [s.deviceName, s.deviceId, s.plan, `$${s.amount}`, s.date, s.type.toUpperCase()])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportType}_report_${selectedMonth + 1}_${selectedYear}.csv`
    a.click()
    
    alert('Report downloaded successfully!')
  }

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  if (loading) {
    return <div className="admin-loading">Loading dashboard...</div>
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div>
          <button onClick={() => setShowRevenueModal(true)} className="revenue-btn">💰 Revenue Report</button>
          <button onClick={() => loadDashboardData()} className="refresh-btn">🔄 Refresh</button>
        </div>
      </div>

      {/* User Stats Cards */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📱</div>
          <div className="stat-info">
            <h3>{stats.totalDevices}</h3>
            <p>Total Devices</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <h3>{stats.activeDevices}</h3>
            <p>Active Devices</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{stats.pendingKyc}</h3>
            <p>Pending KYC</p>
          </div>
        </div>
      </div>

      {/* Revenue Stats Cards */}
      <div className="revenue-section">
        <h2>Revenue Overview</h2>
        <div className="revenue-stats-grid">
          <div className="revenue-card total">
            <div className="revenue-icon">💰</div>
            <div className="revenue-info">
              <h3>${revenueStats.totalRevenue.toFixed(2)}</h3>
              <p>Total Revenue</p>
            </div>
          </div>
          <div className="revenue-card monthly">
            <div className="revenue-icon">📆</div>
            <div className="revenue-info">
              <h3>${revenueStats.monthlyRevenue.toFixed(2)}</h3>
              <p>This Month</p>
            </div>
          </div>
          <div className="revenue-card yearly">
            <div className="revenue-icon">📅</div>
            <div className="revenue-info">
              <h3>${revenueStats.yearlyRevenue.toFixed(2)}</h3>
              <p>This Year</p>
            </div>
          </div>
        </div>

        <div className="revenue-breakdown">
          <div className="breakdown-card">
            <h4>New Signups</h4>
            <div className="breakdown-numbers">
              <span className="amount">${revenueStats.newSignupsRevenue.toFixed(2)}</span>
              <span className="count">{revenueStats.totalSignups} signups</span>
            </div>
            <small>Employees earn 30% commission on these</small>
          </div>
          <div className="breakdown-card">
            <h4>Renewals</h4>
            <div className="breakdown-numbers">
              <span className="amount">${revenueStats.renewalRevenue.toFixed(2)}</span>
              <span className="count">{revenueStats.totalRenewals} renewals</span>
            </div>
            <small>No commission on renewals</small>
          </div>
          <div className="breakdown-card">
            <h4>Subscriptions</h4>
            <div className="breakdown-numbers">
              <span className="amount">{revenueStats.activeSubscriptions}</span>
              <span className="count">active / {revenueStats.expiredSubscriptions} expired</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Modal */}
      {showRevenueModal && (
        <div className="modal-overlay" onClick={() => setShowRevenueModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Revenue Report Generator</h2>
              <button className="modal-close" onClick={() => setShowRevenueModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="report-filters">
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
                      {months.map((month, idx) => (
                        <option key={idx} value={idx}>{month}</option>
                      ))}
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
                
                <button className="generate-report-btn" onClick={generateReport}>
                  📊 Generate Report
                </button>
              </div>
              
              <div className="report-summary">
                <h3>Revenue Summary</h3>
                <div className="summary-stats">
                  <div className="summary-stat">
                    <span>New Signups Revenue</span>
                    <strong>${revenueStats.newSignupsRevenue.toFixed(2)}</strong>
                  </div>
                  <div className="summary-stat">
                    <span>Renewal Revenue</span>
                    <strong>${revenueStats.renewalRevenue.toFixed(2)}</strong>
                  </div>
                  <div className="summary-stat">
                    <span>Total Commission to Employees</span>
                    <strong>${(revenueStats.newSignupsRevenue * 0.3).toFixed(2)}</strong>
                  </div>
                  <div className="summary-stat">
                    <span>Net Revenue (after commission)</span>
                    <strong>${(revenueStats.newSignupsRevenue * 0.7 + revenueStats.renewalRevenue).toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
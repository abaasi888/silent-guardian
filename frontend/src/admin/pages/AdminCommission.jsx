import React, { useState, useEffect } from 'react'
import '../admin.css'

const AdminCommission = () => {
  const [stats, setStats] = useState({
    totalCommission: 0,
    monthlyCommission: 0,
    totalSignups: 0,
    monthlySignups: 0,
    commissionRate: 5,
    baseSalary: 0
  })
  const [commissionHistory, setCommissionHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCommissionData()
  }, [])

  const loadCommissionData = () => {
    const devices = JSON.parse(localStorage.getItem('sg_devices') || '[]')
    const adminCommissionRate = 5 // 5% commission on every signup
    
    let totalCommission = 0
    let monthlyCommission = 0
    let totalSignups = 0
    let monthlySignups = 0
    const currentMonth = new Date().getMonth()
    const history = []
    
    devices.forEach(device => {
      if (device.subscription) {
        const amount = device.subscription.amount || (device.subscription.plan === 'Premium' ? 9.99 : 4.99)
        const commission = amount * (adminCommissionRate / 100)
        totalCommission += commission
        totalSignups++
        
        const startDate = new Date(device.subscription.startDate || device.subscription.lastPayment)
        if (startDate.getMonth() === currentMonth) {
          monthlyCommission += commission
          monthlySignups++
        }
        
        history.push({
          id: device.id,
          deviceName: device.name,
          amount: amount,
          commission: commission,
          date: startDate.toLocaleDateString(),
          type: device.subscription.type || 'new'
        })
      }
    })
    
    const adminSalary = JSON.parse(localStorage.getItem('admin_salary') || '{}')
    
    setStats({
      totalCommission,
      monthlyCommission,
      totalSignups,
      monthlySignups,
      commissionRate: adminCommissionRate,
      baseSalary: adminSalary.amount || 0
    })
    setCommissionHistory(history.reverse())
    setLoading(false)
  }

  const updateAdminSalary = () => {
    const newSalary = prompt('Enter monthly salary amount:', stats.baseSalary)
    if (newSalary && !isNaN(newSalary)) {
      const salaryAmount = parseFloat(newSalary)
      localStorage.setItem('admin_salary', JSON.stringify({ amount: salaryAmount, updatedAt: new Date().toISOString() }))
      setStats(prev => ({ ...prev, baseSalary: salaryAmount }))
      alert(`Admin salary updated to $${salaryAmount}/month`)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const monthlyEarnings = stats.baseSalary + stats.monthlyCommission

  if (loading) return <div className="admin-loading">Loading commission data...</div>

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Commission & Salary</h1>
        <button className="edit-salary-btn" onClick={updateAdminSalary}>✏️ Edit Salary</button>
      </div>

      <div className="commission-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>{formatCurrency(stats.baseSalary)}</h3>
            <p>Base Salary (Monthly)</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <h3>{stats.commissionRate}%</h3>
            <p>Commission Rate</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💸</div>
          <div className="stat-info">
            <h3>{formatCurrency(stats.monthlyCommission)}</h3>
            <p>This Month's Commission</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>{monthlyEarnings.toFixed(2)} USD</h3>
            <p>Total Monthly Earnings</p>
          </div>
        </div>
      </div>

      <div className="commission-summary">
        <div className="summary-card">
          <h3>Total Commission Earned</h3>
          <div className="total-amount">{formatCurrency(stats.totalCommission)}</div>
          <p>From {stats.totalSignups} total signups</p>
        </div>
        <div className="summary-card">
          <h3>This Month</h3>
          <div className="total-amount">{formatCurrency(stats.monthlyCommission)}</div>
          <p>From {stats.monthlySignups} signups</p>
        </div>
      </div>

      <div className="commission-history">
        <h2>Commission History</h2>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Device</th>
                <th>Plan Amount</th>
                <th>Commission (5%)</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {commissionHistory.length === 0 ? (
                <tr><td colSpan="5" className="no-data">No commission records yet</td></tr>
              ) : (
                commissionHistory.map(record => (
                  <tr key={record.id}>
                    <td>{record.date}</td>
                    <td>{record.deviceName}</td>
                    <td>{formatCurrency(record.amount)}</td>
                    <td>{formatCurrency(record.commission)}</td>
                    <td><span className={`type-badge ${record.type}`}>{record.type}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="info-box">
        <h3>How Admin Commission Works</h3>
        <ul>
          <li>Admin earns {stats.commissionRate}% commission on every user signup</li>
          <li>Commission is calculated on monthly subscription amounts</li>
          <li>Total monthly earnings = Base Salary + Commission</li>
          <li>Commission is paid monthly along with salary</li>
          <li>Renewals also generate commission for admin</li>
        </ul>
      </div>
    </div>
  )
}

export default AdminCommission
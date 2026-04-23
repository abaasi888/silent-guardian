import React from 'react'
import './StatsCards.css'

const StatsCards = ({ totalUsers, totalDevices, pendingKyc, activeSubscriptions }) => {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon">👥</div>
        <div className="stat-info">
          <h3>{totalUsers}</h3>
          <p>Total Users</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">📱</div>
        <div className="stat-info">
          <h3>{totalDevices}</h3>
          <p>Registered Devices</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">✅</div>
        <div className="stat-info">
          <h3>{pendingKyc}</h3>
          <p>Pending KYC</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">💳</div>
        <div className="stat-info">
          <h3>{activeSubscriptions}</h3>
          <p>Active Subscriptions</p>
        </div>
      </div>
    </div>
  )
}

export default StatsCards
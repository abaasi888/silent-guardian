import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import StatsCards from '../components/StatsCards'
import './CorporateDashboard.css'

export default function CorporateDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDevices: 0,
    totalEmployees: 0,
    totalCommissions: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, auditRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/audit?limit=10')
        ])
        setStats(statsRes.data)
        setRecentActivity(auditRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div className="admin-container">Loading corporate dashboard...</div>

  return (
    <div className="admin-container corporate-dashboard">
      <div className="admin-header">
        <h1>Corporate Dashboard</h1>
      </div>

      <StatsCards
        totalUsers={stats.totalUsers}
        totalDevices={stats.totalDevices}
        pendingKyc={0} // not directly from stats, could compute
        activeSubscriptions={stats.totalUsers} // placeholder
      />

      <div className="dashboard-row">
        <div className="dashboard-card">
          <h3>Recent Audit Activity</h3>
          <ul className="activity-list">
            {recentActivity.map(log => (
              <li key={log.id}>
                <strong>{log.action}</strong> by {log.userId} – {new Date(log.timestamp).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
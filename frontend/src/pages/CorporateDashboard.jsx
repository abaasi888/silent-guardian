import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import StatsCards from '../components/StatsCards'
import LiveChart from '../../components/LiveChart'
import './CorporateDashboard.css'

const CorporateDashboard = () => {
  const [stats, setStats] = useState({ totalDevices: 0, activeDevices: 0, geofences: 0, reports: 0 })
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    // Fetch corporate stats from backend
    api.get('/corporate/stats').then(res => setStats(res.data))
    api.get('/corporate/audit/org/current?limit=10').then(res => setRecentActivity(res.data))
  }, [])

  const chartData = [
    { label: 'Mon', value: 12 },
    { label: 'Tue', value: 19 },
    { label: 'Wed', value: 15 },
    { label: 'Thu', value: 22 },
    { label: 'Fri', value: 28 },
    { label: 'Sat', value: 24 },
    { label: 'Sun', value: 18 }
  ]

  return (
    <div className="corporate-dashboard">
      <h1>Corporate Dashboard</h1>
      <StatsCards
        totalDevices={stats.totalDevices}
        activeDevices={stats.activeDevices}
        geofences={stats.geofences}
        reports={stats.reports}
      />
      <div className="dashboard-row">
        <LiveChart data={chartData} title="Device Activity (Last 7 Days)" />
      </div>
      <div className="recent-activity">
        <h3>Recent Audit Logs</h3>
        <ul>
          {recentActivity.map(log => (
            <li key={log.id}>{log.timestamp} - {log.action} by {log.userId}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default CorporateDashboard
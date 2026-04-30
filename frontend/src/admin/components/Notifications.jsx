import React, { useState, useEffect } from 'react'
import '../admin.css'

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = () => {
    const pendingKyc = JSON.parse(localStorage.getItem('sg_users') || '[]').filter(u => u.kycStatus === 'pending').length
    const pendingTickets = JSON.parse(localStorage.getItem('sg_tickets') || '[]').filter(t => t.status === 'open').length
    const stolenDevices = JSON.parse(localStorage.getItem('sg_devices') || '[]').filter(d => d.status === 'stolen').length
    
    const newNotifications = []
    if (pendingKyc > 0) newNotifications.push({ id: 1, type: 'warning', message: `${pendingKyc} KYC pending approval`, time: 'Just now', read: false })
    if (pendingTickets > 0) newNotifications.push({ id: 2, type: 'info', message: `${pendingTickets} support tickets need attention`, time: 'Just now', read: false })
    if (stolenDevices > 0) newNotifications.push({ id: 3, type: 'alert', message: `${stolenDevices} devices reported stolen`, time: 'Just now', read: false })
    
    setNotifications(newNotifications)
  }

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="notifications-container">
      <button className="notifications-btn" onClick={() => setShowDropdown(!showDropdown)}>
        🔔 {unreadCount > 0 && <span className="notifications-badge">{unreadCount}</span>}
      </button>
      {showDropdown && (<div className="notifications-dropdown"><div className="notifications-header"><h3>Notifications</h3></div><div className="notifications-list">{notifications.length === 0 ? (<p className="no-notifications">No new notifications</p>) : (notifications.map(n => (<div key={n.id} className={`notification-item ${n.type} ${n.read ? 'read' : ''}`} onClick={() => markAsRead(n.id)}><div className="notification-icon">{n.type === 'alert' ? '🚨' : n.type === 'warning' ? '⚠️' : 'ℹ️'}</div><div className="notification-content"><p>{n.message}</p><small>{n.time}</small></div></div>)))}</div></div>)}
    </div>
  )
}

export default Notifications
import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import Notifications from './Notifications'
import './AdminNavbar.css'

const AdminNavbar = () => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userName')
    navigate('/admin/login')
  }

  const adminName = localStorage.getItem('userName') || 'Admin'

  return (
    <nav className="admin-navbar">
      <div className="admin-nav-container">
        <div className="admin-nav-logo">
          Silent Guardian <span className="admin-badge">Admin</span>
        </div>
        
        <div className="admin-nav-menu">
          {/* Main Dashboard */}
          <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            📊 Dashboard
          </NavLink>
          
          {/* User Management */}
          <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            👥 Users
          </NavLink>
          <NavLink to="/admin/devices" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            📱 Devices
          </NavLink>
          
          {/* Employee Section */}
          <NavLink to="/admin/employees" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            👔 Employees
          </NavLink>
          <NavLink to="/admin/invite-employee" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            📧 Invite Employee
          </NavLink>
          <NavLink to="/admin/employee-chat" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            💬 Employee Chat
          </NavLink>
          
          {/* User Invites */}
          <NavLink to="/admin/invite-user" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            📱 Invite User
          </NavLink>
          
          {/* Financial */}
          <NavLink to="/admin/commission" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            💰 Admin Commission
          </NavLink>
          <NavLink to="/admin/revenue" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            📊 Revenue
          </NavLink>
          
          {/* Support */}
          <NavLink to="/admin/tickets" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            🎫 Tickets
          </NavLink>
          <NavLink to="/admin/chat" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            💬 Live Chat
          </NavLink>
          
          {/* System */}
          <NavLink to="/admin/audit" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            📋 Audit
          </NavLink>
          <NavLink to="/admin/reports" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            📊 Reports
          </NavLink>
          <NavLink to="/admin/backup" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            💾 Backup
          </NavLink>
          
          {/* Account */}
          <NavLink to="/admin/profile" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            👤 Profile
          </NavLink>
          <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            ⚙️ Settings
          </NavLink>
        </div>
        
        <div className="admin-nav-user">
          <Notifications />
          <span className="admin-user-name">{adminName}</span>
          <button onClick={handleLogout} className="admin-logout-btn">
            🚪 Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default AdminNavbar
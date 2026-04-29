import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
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
          <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            📊 Dashboard
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            👥 Users
          </NavLink>
          <NavLink to="/admin/devices" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            📱 Devices
          </NavLink>
          <NavLink to="/admin/employees" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            👔 Employees
          </NavLink>
          <NavLink to="/admin/audit" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            📋 Audit Logs
          </NavLink>
          <NavLink to="/admin/reports" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            📊 Reports
          </NavLink>
          <NavLink to="/admin/chat" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            💬 Chat
          </NavLink>
          <NavLink to="/admin/profile" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            👤 Profile
          </NavLink>
          <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            ⚙️ Settings
          </NavLink>
        </div>
        
        <div className="admin-nav-user">
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
import React from 'react'
import { NavLink } from 'react-router-dom'
import './AdminSidebar.css'

const AdminSidebar = () => {
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-logo">
        <h2>Silent Guardian</h2>
        <span>Admin Portal</span>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          📊 Dashboard
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          👥 Users
        </NavLink>
        <NavLink to="/admin/devices" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          📱 Devices
        </NavLink>
        <NavLink to="/admin/employees" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          👔 Employees
        </NavLink>

        <div className="nav-divider">Organisations</div>
        <NavLink to="/admin/organisations" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          🏛️ Registered Organisations
        </NavLink>

        <div className="nav-divider">System</div>
        <NavLink to="/admin/audit" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          📋 Audit Logs
        </NavLink>
        <NavLink to="/admin/reports" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          📊 Reports
        </NavLink>

        <div className="nav-divider">Support</div>
        <NavLink to="/admin/chat" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          💬 Live Chat
        </NavLink>

        <div className="nav-divider">Account</div>
        <NavLink to="/admin/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          👤 Profile
        </NavLink>
        <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          ⚙️ Settings
        </NavLink>
      </nav>
    </aside>
  )
}

export default AdminSidebar
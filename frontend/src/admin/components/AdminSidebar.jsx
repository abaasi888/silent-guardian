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
        <NavLink to="/admin/kyc-reviews" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          ✅ KYC Reviews
        </NavLink>
        <NavLink to="/admin/payments" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          💰 Payments
        </NavLink>
        <NavLink to="/admin/chat" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          💬 Live Chat
        </NavLink>
      </nav>
    </aside>
  )
}

export default AdminSidebar
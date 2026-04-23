import React from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminNavbar.css'

const AdminNavbar = ({ toggleSidebar }) => {
  const navigate = useNavigate()
  const adminName = localStorage.getItem('adminName') || 'Admin'

  const handleLogout = () => {
    localStorage.clear()
    navigate('/admin/login')
  }

  return (
    <nav className="admin-navbar">
      <button className="menu-toggle" onClick={toggleSidebar}>☰</button>
      <div className="navbar-title">Admin Control Panel</div>
      <div className="navbar-right">
        <span className="admin-name">👤 {adminName}</span>
        <button onClick={handleLogout} className="logout-nav-btn">Logout</button>
      </div>
    </nav>
  )
}

export default AdminNavbar
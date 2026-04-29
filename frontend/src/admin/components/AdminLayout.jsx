import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import AdminNavbar from './AdminNavbar'
import './AdminLayout.css'

const AdminLayout = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) {
      navigate('/admin/login')
    }
  }, [navigate])

  return (
    <div className="admin-layout">
      <AdminNavbar />
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  )
}

export default AdminLayout
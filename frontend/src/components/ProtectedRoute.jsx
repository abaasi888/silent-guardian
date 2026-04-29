import React from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated, getCurrentUser } from '../services/authService'

const ProtectedRoute = ({ children }) => {
  const authenticated = isAuthenticated()
  const adminToken = localStorage.getItem('adminToken')
  const user = getCurrentUser()
  
  // Check if trying to access admin route
  const isAdminRoute = window.location.pathname.startsWith('/admin')
  
  if (isAdminRoute) {
    // For admin routes, check admin token
    if (!adminToken) {
      return <Navigate to="/admin/login" replace />
    }
    return children
  }
  
  // For user routes
  if (!authenticated) {
    return <Navigate to="/login" replace />
  }
  
  // Prevent admin from accessing user routes
  if (user?.accountType === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }
  
  return children
}

export default ProtectedRoute
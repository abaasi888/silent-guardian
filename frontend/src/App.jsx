import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import KycUpload from './pages/KycUpload'
import CryptoCheckout from './pages/CryptoCheckout'
import LocationHistory from './pages/LocationHistory'
import Subscriptions from './pages/Subscriptions'
import TrackingMap from './components/TrackingMap'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

// Admin imports
import AdminLogin from './admin/pages/AdminLogin'
import AdminDashboard from './admin/pages/AdminDashboard'
import EmployeeManagement from './admin/pages/EmployeeManagement'
import GeofenceManager from './admin/pages/GeofenceManager'
import AuditLogs from './admin/pages/AuditLogs'
import Reports from './admin/pages/Reports'
import LiveChat from './admin/components/LiveChat'

// Additional admin pages (create these if missing)
import UserManagement from './admin/pages/UserManagement'       // for /admin/users
import DeviceManagement from './admin/pages/DeviceManagement'   // for /admin/devices
import CorporateDashboard from './admin/pages/CorporateDashboard'
import FleetManagement from './admin/pages/FleetManagement'
import Profile from './admin/pages/Profile'
import Settings from './admin/pages/Settings'

function App() {
  const token = localStorage.getItem('accessToken')
  const isAuthenticated = !!token

  return (
    <BrowserRouter>
      <Navbar />
      <div className="container">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />

          {/* Admin public routes */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected client routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/kyc" element={<ProtectedRoute><KycUpload /></ProtectedRoute>} />
          <Route path="/checkout/:planId/:amount" element={<ProtectedRoute><CryptoCheckout /></ProtectedRoute>} />
          <Route path="/location-history" element={<ProtectedRoute><LocationHistory /></ProtectedRoute>} />
          <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
          <Route path="/tracking" element={
            <ProtectedRoute>
              <div className="tracking-page">
                <h2>Live Device Tracking</h2>
                <TrackingMap locations={[]} />
              </div>
            </ProtectedRoute>
          } />

          {/* Admin protected routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/devices" element={<ProtectedRoute><DeviceManagement /></ProtectedRoute>} />
          <Route path="/admin/employees" element={<ProtectedRoute><div className="admin-container"><EmployeeManagement /></div></ProtectedRoute>} />
          <Route path="/admin/geofences" element={<ProtectedRoute><div className="admin-container"><GeofenceManager /></div></ProtectedRoute>} />
          <Route path="/admin/audit" element={<ProtectedRoute><div className="admin-container"><AuditLogs /></div></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute><div className="admin-container"><Reports /></div></ProtectedRoute>} />
          <Route path="/admin/chat" element={<ProtectedRoute><div className="admin-container"><LiveChat /></div></ProtectedRoute>} />

          {/* Corporate routes (match sidebar links) */}
          <Route path="/admin/corporate/dashboard" element={<ProtectedRoute><CorporateDashboard /></ProtectedRoute>} />
          <Route path="/admin/corporate/fleet" element={<ProtectedRoute><FleetManagement /></ProtectedRoute>} />

          {/* Account routes */}
          <Route path="/admin/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
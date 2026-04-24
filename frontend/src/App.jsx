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
import AdminLayout from './admin/components/AdminLayout'
import AdminDashboard from './admin/pages/AdminDashboard'
import EmployeeManagement from './admin/pages/EmployeeManagement'
import GeofenceManager from './admin/pages/GeofenceManager'
import AuditLogs from './admin/pages/AuditLogs'
import Reports from './admin/pages/Reports'
import UserManagement from './admin/pages/UserManagement'
import DeviceManagement from './admin/pages/DeviceManagement'
import CorporateDashboard from './admin/pages/CorporateDashboard'
import FleetManagement from './admin/pages/FleetManagement'
import Profile from './admin/pages/Profile'
import Settings from './admin/pages/Settings'
import LiveChat from './admin/components/LiveChat'

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
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected client routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/kyc" element={<ProtectedRoute><KycUpload /></ProtectedRoute>} />
          <Route path="/checkout/:planId/:amount" element={<ProtectedRoute><CryptoCheckout /></ProtectedRoute>} />
          <Route path="/location-history" element={<ProtectedRoute><LocationHistory /></ProtectedRoute>} />
          <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
          <Route path="/tracking" element={<ProtectedRoute><div className="tracking-page"><h2>Live Device Tracking</h2><TrackingMap locations={[]} /></div></ProtectedRoute>} />

          {/* Admin protected routes – all inside AdminLayout */}
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="devices" element={<DeviceManagement />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="geofences" element={<GeofenceManager />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="reports" element={<Reports />} />
            <Route path="corporate/dashboard" element={<CorporateDashboard />} />
            <Route path="corporate/fleet" element={<FleetManagement />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="chat" element={<LiveChat />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
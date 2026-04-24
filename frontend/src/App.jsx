import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import KycUpload from './pages/KycUpload'
import CryptoCheckout from './pages/CryptoCheckout'
import LocationHistory from './pages/LocationHistory'
import Subscriptions from './pages/Subscriptions'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

// Corporate client pages
import CorporateDashboard from './pages/CorporateDashboard'
import CorporateFleet from './pages/CorporateFleet'
import CorporateGeofences from './pages/CorporateGeofences'
import CorporateReports from './pages/CorporateReports'
import CorporateTeam from './pages/CorporateTeam'
import CorporateDevices from './pages/CorporateDevices'
import CorporateChat from './pages/CorporateChat'

// Admin imports
import AdminLogin from './admin/pages/AdminLogin'
import AdminLayout from './admin/components/AdminLayout'
import AdminDashboard from './admin/pages/AdminDashboard'
import UserManagement from './admin/pages/UserManagement'
import DeviceManagement from './admin/pages/DeviceManagement'
import EmployeeManagement from './admin/pages/EmployeeManagement'
import GeofenceManager from './admin/pages/GeofenceManager'
import AuditLogs from './admin/pages/AuditLogs'
import Reports from './admin/pages/Reports'
import CorporateDashboardAdmin from './admin/pages/CorporateDashboard'
import FleetManagement from './admin/pages/FleetManagement'
import Profile from './admin/pages/Profile'
import Settings from './admin/pages/Settings'
import LiveChat from './admin/components/LiveChat'
import Organisations from './admin/pages/Organisations'   // <-- NEW IMPORT

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

          {/* Client routes (ordinary + corporate) */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/kyc" element={<ProtectedRoute><KycUpload /></ProtectedRoute>} />
          <Route path="/checkout/:planId/:amount" element={<ProtectedRoute><CryptoCheckout /></ProtectedRoute>} />
          <Route path="/location-history" element={<ProtectedRoute><LocationHistory /></ProtectedRoute>} />
          <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />

          {/* Corporate client routes */}
          <Route path="/corporate/dashboard" element={<ProtectedRoute><CorporateDashboard /></ProtectedRoute>} />
          <Route path="/corporate/fleet" element={<ProtectedRoute><CorporateFleet /></ProtectedRoute>} />
          <Route path="/corporate/geofences" element={<ProtectedRoute><CorporateGeofences /></ProtectedRoute>} />
          <Route path="/corporate/reports" element={<ProtectedRoute><CorporateReports /></ProtectedRoute>} />
          <Route path="/corporate/team" element={<ProtectedRoute><CorporateTeam /></ProtectedRoute>} />
          <Route path="/corporate/devices" element={<ProtectedRoute><CorporateDevices /></ProtectedRoute>} />
          <Route path="/corporate/chat" element={<ProtectedRoute><CorporateChat /></ProtectedRoute>} />

          {/* Admin routes (nested layout with sidebar) */}
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="devices" element={<DeviceManagement />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="geofences" element={<GeofenceManager />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="reports" element={<Reports />} />
            <Route path="corporate/dashboard" element={<CorporateDashboardAdmin />} />
            <Route path="corporate/fleet" element={<FleetManagement />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="chat" element={<LiveChat />} />
            <Route path="organisations" element={<Organisations />} />   {/* <-- NEW ROUTE */}
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
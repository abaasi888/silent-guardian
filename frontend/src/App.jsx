import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import KycUpload from './pages/KycUpload'
import DeviceManagement from './pages/DeviceManagement'
import CryptoCheckout from './pages/CryptoCheckout'
import LocationHistory from './pages/LocationHistory'
import Subscriptions from './pages/Subscriptions'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { getCurrentUser } from './services/authService'

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
import DeviceManagementAdmin from './admin/pages/DeviceManagement'
import EmployeeManagement from './admin/pages/EmployeeManagement'
import AuditLogs from './admin/pages/AuditLogs'
import Reports from './admin/pages/Reports'
import ProfileAdmin from './admin/pages/Profile'
import Settings from './admin/pages/Settings'
import LiveChatAdmin from './admin/components/LiveChat'
import Organisations from './admin/pages/Organisations'

// Component to handle role-based redirect
const RoleBasedRedirect = () => {
  const user = getCurrentUser()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (user.accountType === 'corporate') {
    return <Navigate to="/corporate/dashboard" replace />
  } else if (user.accountType === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  } else {
    return <Navigate to="/dashboard" replace />
  }
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="container">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Role-based redirect for root path */}
          <Route path="/" element={<RoleBasedRedirect />} />

          {/* Ordinary user routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/kyc" element={<ProtectedRoute><KycUpload /></ProtectedRoute>} />
          <Route path="/devices" element={<ProtectedRoute><DeviceManagement /></ProtectedRoute>} />
          <Route path="/checkout/:planId/:amount" element={<ProtectedRoute><CryptoCheckout /></ProtectedRoute>} />
          <Route path="/location-history" element={<ProtectedRoute><LocationHistory /></ProtectedRoute>} />
          <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />

          {/* Corporate user routes */}
          <Route path="/corporate/dashboard" element={<ProtectedRoute><CorporateDashboard /></ProtectedRoute>} />
          <Route path="/corporate/fleet" element={<ProtectedRoute><CorporateFleet /></ProtectedRoute>} />
          <Route path="/corporate/geofences" element={<ProtectedRoute><CorporateGeofences /></ProtectedRoute>} />
          <Route path="/corporate/reports" element={<ProtectedRoute><CorporateReports /></ProtectedRoute>} />
          <Route path="/corporate/team" element={<ProtectedRoute><CorporateTeam /></ProtectedRoute>} />
          <Route path="/corporate/devices" element={<ProtectedRoute><CorporateDevices /></ProtectedRoute>} />
          <Route path="/corporate/chat" element={<ProtectedRoute><CorporateChat /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="devices" element={<DeviceManagementAdmin />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="reports" element={<Reports />} />
            <Route path="organisations" element={<Organisations />} />
            <Route path="profile" element={<ProfileAdmin />} />
            <Route path="settings" element={<Settings />} />
            <Route path="chat" element={<LiveChatAdmin />} />
          </Route>

          {/* Fallback - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
#!/bin/bash

# =============================================================================
# Silent Guardian - Complete Project Generator (Detailed)
# Run: chmod +x generate-silent-guardian.sh && ./generate-silent-guardian.sh
# =============================================================================

set -e

PROJECT_ROOT="silent-guardian-ultimate"
echo "🚀 Generating detailed Silent Guardian project in: $PROJECT_ROOT"
mkdir -p "$PROJECT_ROOT"
cd "$PROJECT_ROOT"

# -----------------------------------------------------------------------------
# 1. Create all necessary directories
# -----------------------------------------------------------------------------
mkdir -p frontend/{public,src/{components,services,pages,admin/{pages,components,styles}}}
mkdir -p backend/src/main/{kotlin/com/silentguardian,resources}   # minimal backend stub
mkdir -p infrastructure/docker

# -----------------------------------------------------------------------------
# 2. Frontend package.json (full dependencies)
# -----------------------------------------------------------------------------
cat > frontend/package.json << 'EOF'
{
  "name": "silent-guardian-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.10.0",
    "axios": "^1.3.4"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^3.1.0",
    "vite": "^4.2.0"
  }
}
EOF

# -----------------------------------------------------------------------------
# 3. Vite config (proxies API to backend)
# -----------------------------------------------------------------------------
cat > frontend/vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
EOF

# -----------------------------------------------------------------------------
# 4. index.html (basic)
# -----------------------------------------------------------------------------
cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Silent Guardian</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
EOF

# -----------------------------------------------------------------------------
# 5. main.jsx and global index.css
# -----------------------------------------------------------------------------
cat > frontend/src/main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
EOF

cat > frontend/src/index.css << 'EOF'
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  color: #1e1e2f;
}
.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
EOF

# -----------------------------------------------------------------------------
# 6. App.jsx – full routing (client, corporate, admin)
# -----------------------------------------------------------------------------
cat > frontend/src/App.jsx << 'EOF'
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

// Corporate client pages
import CorporateDashboard from './pages/CorporateDashboard'
import CorporateFleet from './pages/CorporateFleet'
import CorporateGeofences from './pages/CorporateGeofences'
import CorporateReports from './pages/CorporateReports'
import CorporateTeam from './pages/CorporateTeam'

// Admin pages
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
          <Route path="/tracking" element={<ProtectedRoute><div className="tracking-page"><h2>Live Device Tracking</h2><TrackingMap locations={[]} /></div></ProtectedRoute>} />

          {/* Corporate client routes */}
          <Route path="/corporate/dashboard" element={<ProtectedRoute><CorporateDashboard /></ProtectedRoute>} />
          <Route path="/corporate/fleet" element={<ProtectedRoute><CorporateFleet /></ProtectedRoute>} />
          <Route path="/corporate/geofences" element={<ProtectedRoute><CorporateGeofences /></ProtectedRoute>} />
          <Route path="/corporate/reports" element={<ProtectedRoute><CorporateReports /></ProtectedRoute>} />
          <Route path="/corporate/team" element={<ProtectedRoute><CorporateTeam /></ProtectedRoute>} />

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
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
export default App
EOF

# -----------------------------------------------------------------------------
# 7. Components (Navbar, ProtectedRoute, TrackingMap, LoadingSpinner, DeviceCard)
# -----------------------------------------------------------------------------
cat > frontend/src/components/Navbar.jsx << 'EOF'
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Navbar.css'
const Navbar = () => {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('accessToken')
  const handleLogout = () => { localStorage.clear(); navigate('/login') }
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">Silent Guardian</Link>
        <ul className="navbar-menu">
          {isLoggedIn ? (
            <>
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/kyc">KYC</Link></li>
              <li><button onClick={handleLogout} className="navbar-logout">Logout</button></li>
            </>
          ) : (
            <li><Link to="/login">Login</Link></li>
          )}
        </ul>
      </div>
    </nav>
  )
}
export default Navbar
EOF

cat > frontend/src/components/Navbar.css << 'EOF'
.navbar { background: #9c27b0; color: white; padding: 1rem 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.navbar-container { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 1rem; }
.navbar-logo { font-size: 1.5rem; font-weight: bold; color: white; text-decoration: none; }
.navbar-menu { list-style: none; display: flex; gap: 1.5rem; align-items: center; }
.navbar-menu a { color: white; text-decoration: none; }
.navbar-logout { background: none; border: none; color: white; cursor: pointer; }
EOF

cat > frontend/src/components/ProtectedRoute.jsx << 'EOF'
import React from 'react'
import { Navigate } from 'react-router-dom'
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken')
  return token ? children : <Navigate to="/login" replace />
}
export default ProtectedRoute
EOF

cat > frontend/src/components/TrackingMap.jsx << 'EOF'
import React from 'react'
import './TrackingMap.css'
const TrackingMap = ({ locations }) => {
  if (!locations || locations.length === 0) return <div className="tracking-map">No location data available</div>
  return (
    <div className="tracking-map">
      {locations.map((loc, idx) => (
        <div key={idx} className="location-marker">
          📍 Device {loc.deviceId}: {loc.lat?.toFixed(4)}, {loc.lng?.toFixed(4)}
        </div>
      ))}
    </div>
  )
}
export default TrackingMap
EOF

cat > frontend/src/components/TrackingMap.css << 'EOF'
.tracking-map { background: #e0e0e0; border-radius: 12px; padding: 1rem; min-height: 200px; overflow-y: auto; }
.location-marker { padding: 0.5rem; border-bottom: 1px solid #ccc; }
EOF

cat > frontend/src/components/LoadingSpinner.jsx << 'EOF'
import React from 'react'
import './LoadingSpinner.css'
const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="spinner-container">
    <div className="spinner"></div>
    <p>{message}</p>
  </div>
)
export default LoadingSpinner
EOF

cat > frontend/src/components/LoadingSpinner.css << 'EOF'
.spinner-container { text-align: center; padding: 2rem; }
.spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #9c27b0; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
EOF

cat > frontend/src/components/DeviceCard.jsx << 'EOF'
import React from 'react'
import './DeviceCard.css'
const DeviceCard = ({ device, onViewHistory }) => {
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'status-active'
      case 'inactive': return 'status-inactive'
      case 'stolen': return 'status-stolen'
      default: return 'status-pending'
    }
  }
  return (
    <div className="device-card">
      <div className="device-card-header">
        <h3>{device.deviceName || 'Unnamed Device'}</h3>
        <span className={`device-status ${getStatusClass(device.status)}`}>{device.status || 'PENDING'}</span>
      </div>
      <div className="device-card-body">
        <p><strong>Device ID:</strong> {device.deviceId}</p>
        <p><strong>Last seen:</strong> {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}</p>
      </div>
      <div className="device-card-footer">
        <button onClick={() => onViewHistory(device.deviceId)} className="history-btn">View Location History</button>
      </div>
    </div>
  )
}
export default DeviceCard
EOF

cat > frontend/src/components/DeviceCard.css << 'EOF'
.device-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 1rem; margin-bottom: 1rem; }
.device-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
.device-status { font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 20px; font-weight: bold; text-transform: uppercase; }
.status-active { background: #4caf50; color: white; }
.status-inactive { background: #9e9e9e; color: white; }
.status-stolen { background: #f44336; color: white; }
.history-btn { background: #9c27b0; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; }
EOF

# -----------------------------------------------------------------------------
# 8. Services (API mock – intercepts all calls)
# -----------------------------------------------------------------------------
cat > frontend/src/services/api.js << 'EOF'
import axios from 'axios'
const api = axios.create({ baseURL: '/api/v1' })

// Full mock interceptor: no real network calls
api.interceptors.request.use(async (config) => {
  // --- Mock login ---
  if (config.url === '/auth/login' && config.method === 'post') {
    const email = config.data.email
    const pending = localStorage.getItem('pendingRegistration')
    if (pending && JSON.parse(pending).email === email) {
      return Promise.reject({ response: { data: { message: 'Account pending approval' } } })
    }
    const registered = localStorage.getItem('registeredUser')
    if (registered) {
      const user = JSON.parse(registered)
      if (user.email === email) {
        return Promise.resolve({
          data: {
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh',
            user: { role: user.accountType === 'corporate' ? 'CORPORATE' : 'USER', ...user }
          }
        })
      }
    }
    return Promise.reject({ response: { data: { message: 'Invalid credentials' } } })
  }

  // --- Mock admin endpoints ---
  if (config.url === '/admin/users') {
    const registered = localStorage.getItem('registeredUser')
    const users = registered ? [JSON.parse(registered)] : []
    return Promise.resolve({ data: users })
  }
  if (config.url === '/admin/devices') {
    return Promise.resolve({ data: [] })
  }
  if (config.url === '/admin/stats') {
    return Promise.resolve({ data: { totalUsers: 1, totalDevices: 0, totalEmployees: 0, totalCommissions: 0 } })
  }

  // --- Mock client endpoints ---
  if (config.url === '/kyc/status') {
    return Promise.resolve({ data: { status: 'APPROVED' } })
  }
  if (config.url === '/devices') {
    const isCorporate = localStorage.getItem('isCorporate') === 'true'
    if (isCorporate) {
      return Promise.resolve({
        data: [
          { id: 'dev1', deviceName: 'Van #101', deviceId: 'van101', status: 'ACTIVE', lastSeen: new Date().toISOString() },
          { id: 'dev2', deviceName: 'Van #102', deviceId: 'van102', status: 'ACTIVE', lastSeen: new Date().toISOString() }
        ]
      })
    } else {
      return Promise.resolve({
        data: [{ id: 'dev1', deviceName: 'My iPhone', deviceId: 'iphone1', status: 'ACTIVE', lastSeen: new Date().toISOString() }]
      })
    }
  }
  if (config.url === '/subscriptions/current') {
    return Promise.resolve({ data: { planId: 'Premium', deviceTier: 'EXPENSIVE', endDate: new Date(2025, 0, 1), active: true } })
  }

  // Catch all other requests
  return Promise.resolve({ data: {} })
})
export default api
EOF

# -----------------------------------------------------------------------------
# 9. Pages: Login, Register, Dashboard, and stubs for other pages
# -----------------------------------------------------------------------------
cat > frontend/src/pages/Login.jsx << 'EOF'
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import './Login.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('accessToken', res.data.accessToken)
      localStorage.setItem('refreshToken', res.data.refreshToken)
      localStorage.setItem('userType', res.data.user.accountType)
      localStorage.setItem('userEmail', res.data.user.email)
      localStorage.setItem('userName', res.data.user.fullName)
      if (res.data.user.accountType === 'corporate') {
        localStorage.setItem('isCorporate', 'true')
        localStorage.setItem('multiDeviceAllowed', 'true')
      } else {
        localStorage.setItem('isCorporate', 'false')
        localStorage.setItem('multiDeviceAllowed', 'false')
      }
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Silent Guardian</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="login-input" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="login-input" />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading} className="login-button">{loading ? 'Logging in...' : 'Login'}</button>
        </form>
        <p className="login-footer">Don't have an account? <Link to="/register">Register</Link></p>
        <p className="login-footer"><Link to="/kyc">Submit KYC</Link></p>
      </div>
    </div>
  )
}
export default Login
EOF

cat > frontend/src/pages/Login.css << 'EOF'
.login-container { display: flex; justify-content: center; align-items: center; min-height: 80vh; }
.login-card { background: white; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.12); padding: 2rem; width: 100%; max-width: 400px; }
.login-title { font-size: 1.8rem; font-weight: bold; color: #9c27b0; text-align: center; margin-bottom: 1.5rem; }
.login-form { display: flex; flex-direction: column; gap: 1rem; }
.login-input { padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; }
.login-button { background: #9c27b0; color: white; padding: 0.75rem; border: none; border-radius: 8px; cursor: pointer; }
.login-error { color: #f44336; text-align: center; }
.login-footer { text-align: center; margin-top: 1rem; }
EOF

cat > frontend/src/pages/Register.jsx << 'EOF'
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import './Register.css'

const Register = () => {
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '', fullName: '', phone: '', accountType: 'ordinary' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    // Using localStorage mock (since backend not ready)
    setTimeout(() => {
      const existingRegistered = localStorage.getItem('registeredUser')
      if (existingRegistered && JSON.parse(existingRegistered).email === formData.email) {
        setError('Email already registered')
        setLoading(false)
        return
      }
      const existingPending = localStorage.getItem('pendingRegistration')
      if (existingPending && JSON.parse(existingPending).email === formData.email) {
        setError('Email already pending approval')
        setLoading(false)
        return
      }
      const userData = { email: formData.email, fullName: formData.fullName, phone: formData.phone, accountType: formData.accountType }
      if (formData.accountType === 'corporate') {
        localStorage.setItem('pendingRegistration', JSON.stringify(userData))
        setSuccess('Corporate registration request sent to admin. You will be notified when approved.')
      } else {
        localStorage.setItem('registeredUser', JSON.stringify(userData))
        setSuccess('Registration successful! Redirecting to login...')
        setTimeout(() => navigate('/login'), 2000)
      }
      setLoading(false)
    }, 500)
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">Create Account</h1>
        <form onSubmit={handleSubmit} className="register-form">
          <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required className="register-input" />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="register-input" />
          <input type="tel" name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} required className="register-input" />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required className="register-input" />
          <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required className="register-input" />
          <div className="register-account-type">
            <label>Account Type:</label>
            <label><input type="radio" name="accountType" value="ordinary" checked={formData.accountType === 'ordinary'} onChange={handleChange} /> Ordinary User (one device)</label>
            <label><input type="radio" name="accountType" value="corporate" checked={formData.accountType === 'corporate'} onChange={handleChange} /> Corporate (multiple devices, requires approval)</label>
          </div>
          {error && <p className="register-error">{error}</p>}
          {success && <p className="register-success">{success}</p>}
          <button type="submit" disabled={loading} className="register-button">{loading ? 'Registering...' : 'Register'}</button>
        </form>
        <p className="register-footer">Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  )
}
export default Register
EOF

cat > frontend/src/pages/Register.css << 'EOF'
.register-container { display: flex; justify-content: center; align-items: center; min-height: 80vh; }
.register-card { background: white; border-radius: 16px; padding: 2rem; max-width: 500px; width: 100%; }
.register-title { text-align: center; color: #9c27b0; }
.register-form { display: flex; flex-direction: column; gap: 1rem; }
.register-input { padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; }
.register-account-type { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
.register-button { background: #9c27b0; color: white; padding: 0.75rem; border: none; border-radius: 8px; cursor: pointer; }
.register-error { color: red; }
.register-success { color: green; }
EOF

# Stubs for other pages (you can expand them later)
cat > frontend/src/pages/KycUpload.jsx << 'EOF' 
import React from 'react'
export default () => <div>KYC Upload Page</div>
EOF
cat > frontend/src/pages/CryptoCheckout.jsx << 'EOF'
import React from 'react'
export default () => <div>Crypto Checkout Page</div>
EOF
cat > frontend/src/pages/LocationHistory.jsx << 'EOF'
import React from 'react'
export default () => <div>Location History</div>
EOF
cat > frontend/src/pages/Subscriptions.jsx << 'EOF'
import React from 'react'
export default () => <div>Subscriptions Page</div>
EOF

# -----------------------------------------------------------------------------
# 10. Corporate Dashboard (client side) – full detailed page
# -----------------------------------------------------------------------------
cat > frontend/src/pages/CorporateDashboard.jsx << 'EOF'
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TrackingMap from '../components/TrackingMap'
import LoadingSpinner from '../components/LoadingSpinner'
import './CorporatePages.css'

export default function CorporateDashboard() {
  const navigate = useNavigate()
  const [devices, setDevices] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const userName = localStorage.getItem('userName') || 'Corporate User'

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setDevices([
        { id: 'dev1', deviceName: 'Van #101', deviceId: 'van101', status: 'ACTIVE', lastSeen: new Date().toISOString() },
        { id: 'dev2', deviceName: 'Van #102', deviceId: 'van102', status: 'ACTIVE', lastSeen: new Date().toISOString() }
      ])
      setLocations([
        { deviceId: 'van101', lat: 40.7128, lng: -74.0060 },
        { deviceId: 'van102', lat: 40.7140, lng: -74.0080 }
      ])
      setLoading(false)
    }, 500)
  }, [])

  if (loading) return <LoadingSpinner />
  return (
    <div className="corporate-dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {userName} (Corporate)</h1>
        <button onClick={() => { localStorage.clear(); navigate('/login') }} className="logout-btn">Logout</button>
      </div>
      <div className="corporate-grid">
        <div className="corporate-left">
          <div className="corporate-card"><h3>📦 Fleet Management</h3><button onClick={() => navigate('/corporate/fleet')} className="action-btn">Go to Fleet</button></div>
          <div className="corporate-card"><h3>📍 Geofences</h3><button onClick={() => navigate('/corporate/geofences')} className="action-btn">Manage</button></div>
          <div className="corporate-card"><h3>📊 Reports</h3><button onClick={() => navigate('/corporate/reports')} className="action-btn">View</button></div>
          <div className="corporate-card"><h3>👥 Team</h3><button onClick={() => navigate('/corporate/team')} className="action-btn">Manage</button></div>
        </div>
        <div className="corporate-right">
          <div className="dashboard-section"><h2>Live Fleet Location</h2><TrackingMap locations={locations} /></div>
          <div className="devices-section"><h2>Fleet Devices</h2><div className="devices-grid">{devices.map(d => <div key={d.id} className="device-simple"><h4>{d.deviceName}</h4><p>Status: {d.status}</p></div>)}</div></div>
        </div>
      </div>
    </div>
  )
}
EOF

cat > frontend/src/pages/CorporateFleet.jsx << 'EOF'
import React, { useState, useEffect } from 'react'
import './CorporatePages.css'
export default function CorporateFleet() {
  const [devices, setDevices] = useState([])
  useEffect(() => {
    setTimeout(() => setDevices([
      { id:1, name:'Van #101', status:'Active', lastLocation:'40.7128, -74.0060' },
      { id:2, name:'Van #102', status:'Active', lastLocation:'40.7140, -74.0080' }
    ]), 100)
  }, [])
  return (
    <div className="corporate-page">
      <h1>Fleet Management</h1>
      <div className="fleet-grid">
        {devices.map(d => <div key={d.id} className="fleet-card"><h3>{d.name}</h3><p>Status: {d.status}</p><p>Last Location: {d.lastLocation}</p></div>)}
      </div>
    </div>
  )
}
EOF

cat > frontend/src/pages/CorporateGeofences.jsx << 'EOF'
import React from 'react'
import './CorporatePages.css'
export default function CorporateGeofences() {
  return <div className="corporate-page"><h1>Geofences</h1><p>Geofences will appear here. (Mock)</p></div>
}
EOF

cat > frontend/src/pages/CorporateReports.jsx << 'EOF'
import React from 'react'
import './CorporatePages.css'
export default function CorporateReports() {
  return <div className="corporate-page"><h1>Reports</h1><p>Reports will appear here. (Mock)</p></div>
}
EOF

cat > frontend/src/pages/CorporateTeam.jsx << 'EOF'
import React from 'react'
import './CorporatePages.css'
export default function CorporateTeam() {
  return <div className="corporate-page"><h1>Team Members</h1><p>Team list will appear here. (Mock)</p></div>
}
EOF

cat > frontend/src/pages/CorporatePages.css << 'EOF'
.corporate-page { padding: 2rem; }
.corporate-dashboard-container { padding: 2rem; }
.corporate-grid { display: grid; grid-template-columns: 280px 1fr; gap: 2rem; }
.corporate-card { background: white; border-radius: 16px; padding: 1rem; margin-bottom: 1rem; text-align: center; }
.fleet-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
.fleet-card { background: white; border-radius: 12px; padding: 1rem; }
.action-btn { background: #9c27b0; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; margin-top: 0.5rem; }
.devices-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-top: 1rem; }
.device-simple { background: white; border-radius: 12px; padding: 0.75rem; }
.logout-btn { background: #f44336; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; }
EOF

# -----------------------------------------------------------------------------
# 11. Admin pages: Login, Dashboard (with pending approvals), layout, sidebar
# -----------------------------------------------------------------------------
cat > frontend/src/admin/pages/AdminLogin.jsx << 'EOF'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const handleSubmit = (e) => {
    e.preventDefault()
    // Mock admin login – any credentials work
    localStorage.setItem('accessToken', 'admin-token')
    localStorage.setItem('userRole', 'ADMIN')
    navigate('/admin/dashboard')
  }
  return (
    <div><h2>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button type="submit">Login</button>
      </form>
    </div>
  )
}
EOF

cat > frontend/src/admin/pages/AdminDashboard.jsx << 'EOF'
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../admin.css'
export default function AdminDashboard() {
  const navigate = useNavigate()
  const [pending, setPending] = useState(null)
  const [users, setUsers] = useState([])
  useEffect(() => {
    const pendingData = localStorage.getItem('pendingRegistration')
    if (pendingData) setPending(JSON.parse(pendingData))
    const registered = localStorage.getItem('registeredUser')
    if (registered) setUsers([JSON.parse(registered)])
  }, [])
  const handleApprove = () => {
    if (!pending) return
    const registeredUser = { email: pending.email, fullName: pending.fullName, phone: pending.phone, accountType: 'corporate' }
    localStorage.setItem('registeredUser', JSON.stringify(registeredUser))
    localStorage.removeItem('pendingRegistration')
    alert('Corporate account approved')
    setPending(null)
    window.location.reload()
  }
  const handleReject = () => {
    localStorage.removeItem('pendingRegistration')
    alert('Corporate request rejected')
    setPending(null)
    window.location.reload()
  }
  const handleLogout = () => { localStorage.clear(); navigate('/admin/login') }
  return (
    <div className="admin-container">
      <div className="admin-header"><h1>Admin Dashboard</h1><button onClick={handleLogout} className="logout-btn">Logout</button></div>
      {pending && (
        <div className="pending-card">
          <h3>Pending Corporate Registration</h3>
          <p>{pending.fullName} ({pending.email})</p>
          <button onClick={handleApprove}>Approve</button>
          <button onClick={handleReject}>Reject</button>
        </div>
      )}
      <h2>Registered Users</h2>
      <ul>{users.map(u => <li key={u.email}>{u.fullName} - {u.email} - {u.accountType}</li>)}</ul>
    </div>
  )
}
EOF

cat > frontend/src/admin/admin.css << 'EOF'
.admin-container { padding: 2rem; }
.admin-header { display: flex; justify-content: space-between; margin-bottom: 1rem; }
.logout-btn { background: #f44336; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; }
.pending-card { background: #fff3e0; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
EOF

cat > frontend/src/admin/components/AdminLayout.jsx << 'EOF'
import React from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import './AdminLayout.css'
const AdminLayout = () => (
  <div className="admin-layout">
    <AdminSidebar />
    <div className="admin-main">
      <Outlet />
    </div>
  </div>
)
export default AdminLayout
EOF

cat > frontend/src/admin/components/AdminLayout.css << 'EOF'
.admin-layout { display: flex; }
.admin-main { flex: 1; padding: 1rem; margin-left: 260px; }
EOF

cat > frontend/src/admin/components/AdminSidebar.jsx << 'EOF'
import React from 'react'
import { NavLink } from 'react-router-dom'
import './AdminSidebar.css'
const AdminSidebar = () => {
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-logo"><h2>Silent Guardian</h2><span>Admin Portal</span></div>
      <nav className="sidebar-nav">
        <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📊 Dashboard</NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>👥 Users</NavLink>
        <NavLink to="/admin/devices" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📱 Devices</NavLink>
        <NavLink to="/admin/employees" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>👔 Employees</NavLink>
        <div className="nav-divider">Corporate</div>
        <NavLink to="/admin/corporate/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>🏢 Corporate Dashboard</NavLink>
        <NavLink to="/admin/corporate/fleet" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📦 Fleet Management</NavLink>
        <NavLink to="/admin/geofences" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📍 Geofences</NavLink>
        <NavLink to="/admin/audit" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📋 Audit Logs</NavLink>
        <NavLink to="/admin/reports" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📊 Reports</NavLink>
        <NavLink to="/admin/chat" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>💬 Live Chat</NavLink>
        <NavLink to="/admin/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>👤 Profile</NavLink>
        <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>⚙️ Settings</NavLink>
      </nav>
    </aside>
  )
}
export default AdminSidebar
EOF

cat > frontend/src/admin/components/AdminSidebar.css << 'EOF'
.admin-sidebar { width: 260px; background: linear-gradient(180deg, #2c2c3a 0%, #1e1e2f 100%); color: white; height: 100vh; position: fixed; left: 0; top: 0; overflow-y: auto; }
.sidebar-logo { padding: 1.5rem; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
.sidebar-logo h2 { margin: 0; font-size: 1.3rem; color: #9c27b0; }
.nav-link { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.5rem; color: #e0e0e0; text-decoration: none; }
.nav-link.active { background: #9c27b0; color: white; border-left: 3px solid white; }
.nav-divider { padding: 0.75rem 1.5rem 0.25rem; font-size: 0.7rem; text-transform: uppercase; color: rgba(255,255,255,0.5); border-top: 1px solid rgba(255,255,255,0.1); margin-top: 0.5rem; }
EOF

# Stubs for other admin pages
cat > frontend/src/admin/pages/UserManagement.jsx << 'EOF'
import React from 'react'
export default () => <div>User Management</div>
EOF
cat > frontend/src/admin/pages/DeviceManagement.jsx << 'EOF'
import React from 'react'
export default () => <div>Device Management</div>
EOF
cat > frontend/src/admin/pages/EmployeeManagement.jsx << 'EOF'
import React from 'react'
export default () => <div>Employee Management</div>
EOF
cat > frontend/src/admin/pages/GeofenceManager.jsx << 'EOF'
import React from 'react'
export default () => <div>Geofence Manager</div>
EOF
cat > frontend/src/admin/pages/AuditLogs.jsx << 'EOF'
import React from 'react'
export default () => <div>Audit Logs</div>
EOF
cat > frontend/src/admin/pages/Reports.jsx << 'EOF'
import React from 'react'
export default () => <div>Reports</div>
EOF
cat > frontend/src/admin/pages/CorporateDashboard.jsx << 'EOF'
import React from 'react'
export default () => <div>Corporate Dashboard (Admin)</div>
EOF
cat > frontend/src/admin/pages/FleetManagement.jsx << 'EOF'
import React from 'react'
export default () => <div>Fleet Management (Admin)</div>
EOF
cat > frontend/src/admin/pages/Profile.jsx << 'EOF'
import React from 'react'
export default () => <div>Profile</div>
EOF
cat > frontend/src/admin/pages/Settings.jsx << 'EOF'
import React from 'react'
export default () => <div>Settings</div>
EOF
cat > frontend/src/admin/components/LiveChat.jsx << 'EOF'
import React from 'react'
export default () => <div>Live Chat (WebSocket will be integrated later)</div>
EOF

# -----------------------------------------------------------------------------
# 12. Minimal backend stubs (optional – for completeness)
# -----------------------------------------------------------------------------
mkdir -p backend/src/main/kotlin/com/silentguardian
cat > backend/src/main/kotlin/com/silentguardian/Placeholder.kt << 'EOF'
package com.silentguardian
// This is a placeholder. The actual backend code can be added later.
// For now, the frontend runs entirely on mock data.
EOF

# -----------------------------------------------------------------------------
# 13. Docker compose and .gitignore
# -----------------------------------------------------------------------------
cat > infrastructure/docker/docker-compose.yml << 'EOF'
version: '3.8'
services:
  mongodb:
    image: mongo:6
    ports: ["27017:27017"]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
EOF

cat > .gitignore << 'EOF'
*.class
*.log
*.iml
.idea/
.gradle/
build/
node_modules/
dist/
.env
*.apk
local.properties
EOF

# -----------------------------------------------------------------------------
# 14. Final message
# -----------------------------------------------------------------------------
echo ""
echo "✅ Silent Guardian project generated successfully!"
echo "📁 Project root: $PROJECT_ROOT"
echo ""
echo "Next steps:"
echo "  cd $PROJECT_ROOT/frontend && npm install && npm run dev"
echo "  Access http://localhost:5173"
echo "  - Register an ordinary user (immediate access) or corporate user (requires admin approval)"
echo "  - Admin portal: http://localhost:5173/admin/login (any credentials works)"
echo "  - Approve corporate users in the admin dashboard"
echo "  - Corporate users see the corporate dashboard and fleet/geofences/reports/team pages"
echo "  - Ordinary users see the standard dashboard with device tracking and subscription"
echo "  - All data is mocked (no backend needed) – replace with real API later"
echo ""
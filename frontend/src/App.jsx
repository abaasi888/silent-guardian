import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import KycUpload from './pages/KycUpload'
import CryptoCheckout from './pages/CryptoCheckout'
import LocationHistory from './pages/LocationHistory'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

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

          {/* Protected routes (require authentication) */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/kyc" element={
            <ProtectedRoute>
              <KycUpload />
            </ProtectedRoute>
          } />
          <Route path="/checkout/:planId/:amount" element={
            <ProtectedRoute>
              <CryptoCheckout />
            </ProtectedRoute>
          } />
          <Route path="/location-history" element={
            <ProtectedRoute>
              <LocationHistory />
            </ProtectedRoute>
          } />

          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
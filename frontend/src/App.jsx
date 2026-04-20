import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DeviceProvider } from './contexts/DeviceContext';
import { StealthProvider } from './contexts/StealthContext';
import ProtectedRoute from './components/common/ProtectedRoute/ProtectedRoute';
import Login from './pages/auth/Login/Login';
import Register from './pages/auth/Register/Register';
import Dashboard from './pages/dashboard/Dashboard/Dashboard';
import DeviceList from './pages/device/DeviceList/DeviceList';
import SubscriptionPlans from './pages/subscription/SubscriptionPlans/SubscriptionPlans';
import StealthDashboard from './pages/stealth/StealthDashboard/StealthDashboard';
import './App.css';
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DeviceProvider>
          <StealthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/devices" element={<ProtectedRoute><DeviceList /></ProtectedRoute>} />
              <Route path="/subscription" element={<ProtectedRoute><SubscriptionPlans /></ProtectedRoute>} />
              <Route path="/stealth" element={<ProtectedRoute><StealthDashboard /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </StealthProvider>
        </DeviceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
export default App;

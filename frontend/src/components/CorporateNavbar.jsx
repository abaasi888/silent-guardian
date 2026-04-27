import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { logoutUser, getCurrentUser } from '../services/authService'
import './CorporateNavbar.css'

const CorporateNavbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
  }

  const handleNavigation = (path) => {
    navigate(path)
  }

  // Don't show on login page
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null
  }

  return (
    <nav className="corporate-navbar">
      <div className="corporate-nav-container">
        <div className="corporate-nav-logo" onClick={() => handleNavigation('/corporate/dashboard')}>
          Silent Guardian <span className="corporate-badge">BUSINESS</span>
        </div>
        
        <div className="corporate-nav-menu">
          <button 
            className={`corporate-nav-link ${location.pathname === '/corporate/dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigation('/corporate/dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`corporate-nav-link ${location.pathname === '/corporate/fleet' ? 'active' : ''}`}
            onClick={() => handleNavigation('/corporate/fleet')}
          >
            🚚 Fleet
          </button>
          <button 
            className={`corporate-nav-link ${location.pathname === '/corporate/geofences' ? 'active' : ''}`}
            onClick={() => handleNavigation('/corporate/geofences')}
          >
            📍 Geofences
          </button>
          <button 
            className={`corporate-nav-link ${location.pathname === '/corporate/reports' ? 'active' : ''}`}
            onClick={() => handleNavigation('/corporate/reports')}
          >
            📊 Reports
          </button>
          <button 
            className={`corporate-nav-link ${location.pathname === '/corporate/team' ? 'active' : ''}`}
            onClick={() => handleNavigation('/corporate/team')}
          >
            👥 Team
          </button>
          <button 
            className={`corporate-nav-link ${location.pathname === '/corporate/devices' ? 'active' : ''}`}
            onClick={() => handleNavigation('/corporate/devices')}
          >
            📱 Devices
          </button>
          <button 
            className={`corporate-nav-link ${location.pathname === '/corporate/chat' ? 'active' : ''}`}
            onClick={() => handleNavigation('/corporate/chat')}
          >
            💬 Support
          </button>
        </div>
        
        <div className="corporate-nav-user">
          <div className="corporate-user-info">
            <span className="corporate-user-name">{user?.fullName?.split(' ')[0] || 'Company'}</span>
            <span className="corporate-user-role">Corporate Admin</span>
          </div>
          <button onClick={handleLogout} className="corporate-logout-btn">
            🚪 Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default CorporateNavbar
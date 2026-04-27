import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { logoutUser, getCurrentUser } from '../services/authService'
import LiveChat from './LiveChat'
import './Navbar.css'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()
  const [showChat, setShowChat] = useState(false)
  
  // Don't show navbar on login/register/admin pages
  if (location.pathname === '/login' || 
      location.pathname === '/register' || 
      location.pathname.startsWith('/admin')) {
    return null
  }

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
  }

  const handleNavigation = (path) => {
    navigate(path)
  }

  return (
    <>
      <nav className="top-navbar">
        <div className="nav-container">
          <div className="nav-logo" onClick={() => handleNavigation('/dashboard')}>
            Silent Guardian
          </div>
          
          <div className="nav-menu">
            <button 
              className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              onClick={() => handleNavigation('/dashboard')}
            >
              📊 Dashboard
            </button>
            <button 
              className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
              onClick={() => handleNavigation('/profile')}
            >
              👤 Profile
            </button>
            <button 
              className={`nav-link ${location.pathname === '/kyc' ? 'active' : ''}`}
              onClick={() => handleNavigation('/kyc')}
            >
              📄 KYC
            </button>
            <button 
              className={`nav-link ${location.pathname === '/devices' ? 'active' : ''}`}
              onClick={() => handleNavigation('/devices')}
            >
              📱 Devices
            </button>
            <button 
              className={`nav-link ${location.pathname === '/subscriptions' ? 'active' : ''}`}
              onClick={() => handleNavigation('/subscriptions')}
            >
              💳 Subscription
            </button>
            <button 
              className={`nav-link chat-nav-btn ${showChat ? 'active' : ''}`}
              onClick={() => setShowChat(!showChat)}
            >
              💬 Support Chat
              <span className="chat-online-indicator"></span>
            </button>
          </div>
          
          <div className="nav-user">
            <span className="user-name">{user?.fullName?.split(' ')[0] || 'User'}</span>
            <button onClick={handleLogout} className="logout-nav-btn">
              🚪 Logout
            </button>
          </div>
        </div>
      </nav>
      
      {/* Chat Window - conditionally shown */}
      <LiveChat isOpen={showChat} onClose={() => setShowChat(false)} />
    </>
  )
}

export default Navbar
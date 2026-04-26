import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import './Navbar.css'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('accessToken')
  const isLoggedIn = !!token
  
  // Don't show navbar on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

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
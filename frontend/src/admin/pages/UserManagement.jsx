import React, { useState, useEffect } from 'react'
import '../admin.css'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    const allUsers = JSON.parse(localStorage.getItem('sg_users') || '[]')
    const regularUsers = allUsers.filter(u => u.accountType !== 'admin')
    setUsers(regularUsers)
    setFilteredUsers(regularUsers)
    setLoading(false)
  }

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase()
    setSearchTerm(term)
    const filtered = users.filter(user => 
      user.fullName?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term)
    )
    setFilteredUsers(filtered)
  }

  const approveKyc = (userId) => {
    const allUsers = JSON.parse(localStorage.getItem('sg_users') || '[]')
    const updatedUsers = allUsers.map(user => 
      user.id === userId ? { ...user, kycStatus: 'approved' } : user
    )
    localStorage.setItem('sg_users', JSON.stringify(updatedUsers))
    loadUsers()
    alert('KYC approved successfully!')
  }

  const deleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const allUsers = JSON.parse(localStorage.getItem('sg_users') || '[]')
      const updatedUsers = allUsers.filter(user => user.id !== userId)
      localStorage.setItem('sg_users', JSON.stringify(updatedUsers))
      loadUsers()
      alert('User deleted successfully!')
    }
  }

  if (loading) {
    return <div className="admin-loading">Loading users...</div>
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>User Management</h1>
        <button onClick={loadUsers} className="refresh-btn">🔄 Refresh</button>
      </div>

      <div className="admin-search">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Account Type</th>
              <th>KYC Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr><td colSpan="7" className="no-data">No users found</td></tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || '—'}</td>
                  <td>{user.accountType === 'corporate' ? 'Corporate' : 'Ordinary'}</td>
                  <td><span className={`status-badge ${user.kycStatus || 'pending'}`}>{user.kycStatus || 'pending'}</span></td>
                  <td>{new Date(user.createdAt || Date.now()).toLocaleDateString()}</td>
                  <td className="action-cell">
                    {user.kycStatus !== 'approved' && (
                      <button className="approve-btn" onClick={() => approveKyc(user.id)}>Approve KYC</button>
                    )}
                    <button className="delete-btn" onClick={() => deleteUser(user.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UserManagement
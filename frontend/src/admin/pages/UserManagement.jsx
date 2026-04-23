import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import './UserManagement.css'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data)
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const approveKyc = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/kyc?status=APPROVED`)
      setUsers(users.map(u => u.id === userId ? { ...u, kycStatus: 'APPROVED' } : u))
    } catch (err) {
      alert('Approval failed')
    }
  }

  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return
    try {
      await api.delete(`/admin/users/${userId}`)
      setUsers(users.filter(u => u.id !== userId))
    } catch (err) {
      alert('Delete failed')
    }
  }

  if (loading) return <div className="admin-container">Loading users...</div>
  if (error) return <div className="admin-container error">{error}</div>

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>User Management</h1>
      </div>
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>KYC</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td><span className={`status-badge ${user.kycStatus.toLowerCase()}`}>{user.kycStatus}</span></td>
                <td>{user.role}</td>
                <td>
                  {user.kycStatus !== 'APPROVED' && (
                    <button onClick={() => approveKyc(user.id)} className="btn-table btn-approve">Approve KYC</button>
                  )}
                  <button onClick={() => deleteUser(user.id)} className="btn-table btn-delete">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './UserManagement.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Fetch users error:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const approveKyc = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/kyc?status=APPROVED`);
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? { ...u, kycStatus: 'APPROVED' } : u
        )
      );
    } catch (err) {
      console.error('KYC approval error:', err);
      alert('Approval failed. Please check the console for details.');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Delete user error:', err);
      alert('Delete failed. Please check the console for details.');
    }
  };

  const getKycStatusClass = (status) => {
    if (!status) return 'status-badge pending';
    return `status-badge ${status.toLowerCase()}`;
  };

  if (loading) return <div className="admin-container">Loading users...</div>;
  if (error) return <div className="admin-container error">{error}</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>User Management</h1>
        <button onClick={fetchUsers} className="btn-refresh">Refresh</button>
      </div>
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>KYC Status</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>No users found</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id}>
                  <td>{user.fullName || user.name || 'N/A'}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || 'N/A'}</td>
                  <td>
                    <span className={getKycStatusClass(user.kycStatus)}>
                      {user.kycStatus || 'PENDING'}
                    </span>
                  </td>
                  <td>{user.role || 'USER'}</td>
                  <td>
                    {user.kycStatus !== 'APPROVED' && (
                      <button
                        onClick={() => approveKyc(user.id)}
                        className="btn-table btn-approve"
                      >
                        Approve KYC
                      </button>
                    )}
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="btn-table btn-delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
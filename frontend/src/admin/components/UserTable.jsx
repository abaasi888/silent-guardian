import React from 'react'
import './UserTable.css'

const UserTable = ({ users, onApproveKyc, onDeleteUser }) => {
  if (!users || users.length === 0) {
    return <div className="table-empty">No users found</div>
  }

  return (
    <div className="user-table-container">
      <table className="user-table">
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
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.fullName}</td>
              <td>{user.email}</td>
              <td>{user.phone}</td>
              <td>
                <span className={`status-badge ${user.kycStatus.toLowerCase()}`}>
                  {user.kycStatus}
                </span>
              </td>
              <td>{user.role}</td>
              <td className="actions-cell">
                {user.kycStatus !== 'APPROVED' && (
                  <button onClick={() => onApproveKyc(user.id)} className="btn-table btn-approve">
                    Approve KYC
                  </button>
                )}
                <button onClick={() => onDeleteUser(user.id)} className="btn-table btn-delete">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default UserTable
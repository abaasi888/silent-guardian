import React, { useState, useEffect } from 'react'
import './CorporatePages.css'

export default function CorporateTeam() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  // Mock team members
  const mockMembers = [
    { id: '1', fullName: 'John Doe', email: 'john@corp.com', role: 'Fleet Manager', status: 'ACTIVE' },
    { id: '2', fullName: 'Jane Smith', email: 'jane@corp.com', role: 'Driver', status: 'ACTIVE' },
    { id: '3', fullName: 'Bob Johnson', email: 'bob@corp.com', role: 'Driver', status: 'INACTIVE' }
  ]

  useEffect(() => {
    setTimeout(() => {
      setMembers(mockMembers)
      setLoading(false)
    }, 500)
  }, [])

  if (loading) return <div className="corporate-page">Loading team...</div>

  return (
    <div className="corporate-page">
      <h1>Team Members</h1>
      <table className="team-table">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {members.map(member => (
            <tr key={member.id}>
              <td>{member.fullName}</td>
              <td>{member.email}</td>
              <td>{member.role}</td>
              <td><span className={`status ${member.status.toLowerCase()}`}>{member.status}</span></td>
              <td><button className="btn-sm">Message</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
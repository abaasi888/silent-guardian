// frontend/src/admin/pages/Organisations.jsx
import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import '../admin.css'

export default function Organisations() {
  const [organisations, setOrganisations] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [allDevices, setAllDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [orgRes, usersRes, devicesRes] = await Promise.all([
        api.get('/admin/organisations'),
        api.get('/admin/users'),
        api.get('/admin/devices/all')
      ])
      setOrganisations(orgRes.data)
      setAllUsers(usersRes.data)
      setAllDevices(devicesRes.data)
    } catch (err) {
      console.error('Failed to load organisations data', err)
      setError('Could not load organisations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const approveOrganisationKyc = async (orgId, adminUserId) => {
    // Organisation KYC approval is tied to the user (admin) of the organisation
    if (!window.confirm('Approve KYC for this organisation?')) return
    try {
      await api.post(`/admin/users/${adminUserId}/kyc/approve`)
      // Also update organisation's KYC status locally
      setOrganisations(prev => prev.map(org =>
        org.id === orgId ? { ...org, kycStatus: 'approved' } : org
      ))
      alert('Organisation KYC approved')
    } catch (err) {
      alert('Approval failed')
    }
  }

  const deleteOrganisation = async (orgId, adminUserId) => {
    if (!window.confirm(`Delete organisation and all its users? This action is permanent.`)) return
    try {
      // Delete the admin user (which also deletes the organisation via API interceptor)
      await api.delete(`/admin/users/${adminUserId}`)
      // Refresh data
      loadData()
      alert('Organisation deleted')
    } catch (err) {
      alert('Deletion failed')
    }
  }

  if (loading) return <div className="admin-loading">Loading organisations...</div>
  if (error) return <div className="admin-error">{error}</div>

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Corporate Organisations</h1>
        <button onClick={loadData} className="refresh-btn">🔄 Refresh</button>
      </div>

      {organisations.length === 0 && <p>No corporate organisations registered yet.</p>}

      <div className="admin-grid">
        {organisations.map(org => {
          // Find members belonging to this organisation
          const members = allUsers.filter(u => u.organisationId === org.id)
          const devices = allDevices.filter(d => d.organisationId === org.id)
          const adminUser = allUsers.find(u => u.id === org.adminId)

          return (
            <div key={org.id} className="admin-card org-card">
              <div className="admin-card-header">
                {org.name}
                <span className={`kyc-badge ${org.kycStatus === 'approved' ? 'approved' : 'pending'}`}>
                  {org.kycStatus === 'approved' ? 'KYC Approved' : 'KYC Pending'}
                </span>
              </div>
              <div className="admin-card-body">
                <p><strong>Admin:</strong> {adminUser?.fullName || org.adminId}</p>
                <p><strong>Admin Email:</strong> {adminUser?.email || 'Unknown'}</p>
                <p><strong>Members:</strong> {members.length}</p>
                <p><strong>Devices:</strong> {devices.length}</p>

                <details>
                  <summary>View Members</summary>
                  <ul>
                    {members.map(m => (
                      <li key={m.id}>{m.fullName} ({m.email}) - {m.role || 'Member'} - KYC: {m.kycStatus}</li>
                    ))}
                    {members.length === 0 && <li>No members yet</li>}
                  </ul>
                </details>

                <details>
                  <summary>View Devices</summary>
                  <ul>
                    {devices.map(d => (
                      <li key={d.id}>{d.deviceName} ({d.deviceId}) - Status: {d.status}</li>
                    ))}
                    {devices.length === 0 && <li>No devices yet</li>}
                  </ul>
                </details>
              </div>
              <div className="admin-card-footer">
                {org.kycStatus !== 'approved' && adminUser && (
                  <button onClick={() => approveOrganisationKyc(org.id, adminUser.id)} className="btn-admin btn-sm">
                    Approve KYC
                  </button>
                )}
                <button onClick={() => deleteOrganisation(org.id, adminUser?.id)} className="btn-admin btn-danger btn-sm">
                  Delete Organisation
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
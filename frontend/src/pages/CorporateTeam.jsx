import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import './CorporatePages.css'

export default function CorporateTeam() {
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMember, setNewMember] = useState({
    email: '',
    fullName: '',
    phone: '',
    role: '',
    idDocument: null,
    selfie: null
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRefs = {
    idDocument: useRef(),
    selfie: useRef()
  }

  // Check if user is corporate
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
  useEffect(() => {
    if (currentUser.accountType !== 'corporate' && localStorage.getItem('userType') !== 'corporate') {
      navigate('/')
    }
  }, [currentUser, navigate])

  const loadMembers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/corporate/members')
      setMembers(res.data)
    } catch (err) {
      console.error('Failed to load members', err)
      setError('Could not load team members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewMember(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e, field) => {
    const file = e.target.files[0]
    if (file) {
      setNewMember(prev => ({ ...prev, [field]: file.name }))
    }
  }

  const resetForm = () => {
    setNewMember({ email: '', fullName: '', phone: '', role: '', idDocument: null, selfie: null })
    // Clear file inputs
    Object.values(fileInputRefs).forEach(ref => {
      if (ref.current) ref.current.value = ''
    })
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!newMember.idDocument || !newMember.selfie) {
      setError('Please upload ID document and selfie for the team member')
      return
    }
    try {
      await api.post('/corporate/members/add', newMember)
      setSuccess('Team member added successfully. They can now log in with password "changeme".')
      resetForm()
      setShowAddForm(false)
      loadMembers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member')
    }
  }

  const handleApproveKyc = async (memberId) => {
    try {
      await api.post('/corporate/members/approve-kyc', { memberId })
      loadMembers()
    } catch (err) {
      alert('Failed to approve KYC')
    }
  }

  const handleDeleteMember = async (memberId) => {
    if (window.confirm('Delete this team member permanently?')) {
      try {
        await api.post('/corporate/members/delete', { memberId })
        loadMembers()
      } catch (err) {
        alert('Failed to delete member')
      }
    }
  }

  if (loading) return <LoadingSpinner message="Loading team members..." />

  return (
    <div className="corporate-page">
      <div className="page-header">
        <h1>Team Members</h1>
        <div>
          <button onClick={loadMembers} className="btn-refresh">🔄 Refresh</button>
          <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary">
            {showAddForm ? 'Cancel' : '+ Add Team Member'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="add-member-form">
          <h3>Add New Team Member</h3>
          <form onSubmit={handleAddMember}>
            <input type="email" name="email" placeholder="Email" value={newMember.email} onChange={handleInputChange} required />
            <input type="text" name="fullName" placeholder="Full Name" value={newMember.fullName} onChange={handleInputChange} required />
            <input type="tel" name="phone" placeholder="Phone Number" value={newMember.phone} onChange={handleInputChange} required />
            <input type="text" name="role" placeholder="Role (e.g., Driver, Manager)" value={newMember.role} onChange={handleInputChange} required />
            <div>ID Document: <input type="file" ref={fileInputRefs.idDocument} onChange={(e) => handleFileChange(e, 'idDocument')} required /></div>
            <div>Selfie Picture: <input type="file" ref={fileInputRefs.selfie} onChange={(e) => handleFileChange(e, 'selfie')} required /></div>
            {error && <p className="error-msg">{error}</p>}
            {success && <p className="success-msg">{success}</p>}
            <button type="submit" className="btn-primary">Add Member</button>
          </form>
        </div>
      )}

      {members.length === 0 ? (
        <p className="no-data">No team members added yet. Use the button above to add one.</p>
      ) : (
        <table className="team-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>KYC Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member.id}>
                <td>{member.fullName}</td>
                <td>{member.email}</td>
                <td>{member.role || '—'}</td>
                <td>
                  <span className={`kyc-badge ${member.kycStatus?.toLowerCase()}`}>
                    {member.kycStatus === 'approved' ? '✅ Approved' : '⏳ Pending'}
                  </span>
                </td>
                <td>
                  {member.kycStatus !== 'approved' && (
                    <button onClick={() => handleApproveKyc(member.id)} className="btn-sm btn-approve">Approve KYC</button>
                  )}
                  <button onClick={() => handleDeleteMember(member.id)} className="btn-sm btn-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
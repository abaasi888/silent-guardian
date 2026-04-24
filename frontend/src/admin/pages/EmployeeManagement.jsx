import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import './EmployeeManagement.css'

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteData, setInviteData] = useState({
    fullName: '',
    email: '',
    phone: '',
    nationalId: '',
    cvUrl: '',
    nssfCardUrl: '',
    bankAccount: {
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: ''
    },
    temporaryPassword: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/admin/employees')
      setEmployees(res.data)
    } catch (err) {
      setError('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('bank.')) {
      const field = name.split('.')[1]
      setInviteData({
        ...inviteData,
        bankAccount: { ...inviteData.bankAccount, [field]: value }
      })
    } else {
      setInviteData({ ...inviteData, [name]: value })
    }
  }

  const inviteEmployee = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/admin/employees', inviteData)
      alert('Employee invited successfully')
      setShowInviteForm(false)
      setInviteData({
        fullName: '', email: '', phone: '', nationalId: '', cvUrl: '', nssfCardUrl: '',
        bankAccount: { accountHolderName: '', accountNumber: '', bankName: '', ifscCode: '' },
        temporaryPassword: ''
      })
      fetchEmployees()
    } catch (err) {
      alert('Failed to invite employee: ' + (err.response?.data?.message || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  const deactivateApp = async (employeeId) => {
    if (!window.confirm('Deactivate this employee’s app? They will be logged out immediately.')) return
    try {
      await api.put(`/admin/employees/${employeeId}/deactivate-app`)
      setEmployees(employees.map(emp =>
        emp.employeeId === employeeId ? { ...emp, appActive: false } : emp
      ))
      alert('Employee app deactivated')
    } catch (err) {
      alert('Deactivation failed')
    }
  }

  if (loading) return <div className="admin-container">Loading employees...</div>
  if (error) return <div className="admin-container error">{error}</div>

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Employee Management</h1>
        <button onClick={() => setShowInviteForm(!showInviteForm)} className="btn-admin">
          + Invite Employee
        </button>
      </div>

      {showInviteForm && (
        <div className="invite-form-container">
          <h3>Invite New Employee</h3>
          <form onSubmit={inviteEmployee} className="invite-form">
            <div className="form-row">
              <input type="text" name="fullName" placeholder="Full Name" value={inviteData.fullName} onChange={handleInviteChange} required />
              <input type="email" name="email" placeholder="Email" value={inviteData.email} onChange={handleInviteChange} required />
              <input type="tel" name="phone" placeholder="Phone" value={inviteData.phone} onChange={handleInviteChange} required />
            </div>
            <div className="form-row">
              <input type="text" name="nationalId" placeholder="National ID" value={inviteData.nationalId} onChange={handleInviteChange} required />
              <input type="url" name="cvUrl" placeholder="CV URL" value={inviteData.cvUrl} onChange={handleInviteChange} required />
              <input type="url" name="nssfCardUrl" placeholder="NSSF Card URL" value={inviteData.nssfCardUrl} onChange={handleInviteChange} required />
            </div>
            <div className="form-section">Bank Account</div>
            <div className="form-row">
              <input type="text" name="bank.accountHolderName" placeholder="Account Holder" value={inviteData.bankAccount.accountHolderName} onChange={handleInviteChange} required />
              <input type="text" name="bank.accountNumber" placeholder="Account Number" value={inviteData.bankAccount.accountNumber} onChange={handleInviteChange} required />
              <input type="text" name="bank.bankName" placeholder="Bank Name" value={inviteData.bankAccount.bankName} onChange={handleInviteChange} required />
              <input type="text" name="bank.ifscCode" placeholder="IFSC Code (optional)" value={inviteData.bankAccount.ifscCode} onChange={handleInviteChange} />
            </div>
            <div className="form-row">
              <input type="password" name="temporaryPassword" placeholder="Temporary Password" value={inviteData.temporaryPassword} onChange={handleInviteChange} required />
            </div>
            <div className="form-buttons">
              <button type="submit" disabled={submitting} className="btn-admin">Invite</button>
              <button type="button" onClick={() => setShowInviteForm(false)} className="btn-admin btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Referrals</th>
              <th>Commission Earned</th>
              <th>Status</th>
              <th>App Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td>{emp.employeeId}</td>
                <td>{emp.fullName}</td>
                <td>{emp.email}</td>
                <td>{emp.totalReferrals}</td>
                <td>${emp.totalCommissionEarned}</td>
                <td><span className={`status-badge ${emp.isPermanent ? 'permanent' : 'temp'}`}>
                  {emp.isPermanent ? 'Permanent' : 'Temporary'}
                </span></td>
                <td>
                  <span className={`app-status ${emp.appActive ? 'active' : 'inactive'}`}>
                    {emp.appActive ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td>
                  {emp.appActive && (
                    <button onClick={() => deactivateApp(emp.employeeId)} className="btn-table btn-warning">Deactivate App</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
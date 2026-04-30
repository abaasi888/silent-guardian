import React, { useState, useEffect } from 'react'
import '../admin.css'

const InviteEmployee = () => {
  const [inviteLink, setInviteLink] = useState('')
  const [invites, setInvites] = useState([])
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingRegistrations, setPendingRegistrations] = useState([])

  useEffect(() => {
    loadInvites()
    loadPendingRegistrations()
  }, [])

  const loadInvites = () => {
    const savedInvites = JSON.parse(localStorage.getItem('sg_employee_invites') || '[]')
    setInvites(savedInvites)
  }

  const loadPendingRegistrations = () => {
    const pending = JSON.parse(localStorage.getItem('sg_pending_employees') || '[]')
    setPendingRegistrations(pending)
  }

  const generateInviteLink = () => {
    const inviteCode = 'EMP_' + Math.random().toString(36).substring(2, 10).toUpperCase()
    const downloadLink = `https://silentguardian.com/download?ref=${inviteCode}`
    setInviteLink(downloadLink)
    
    const newInvite = {
      id: Date.now(),
      code: inviteCode,
      link: downloadLink,
      email: email || 'Not specified',
      phone: phone || 'Not specified',
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    
    const updatedInvites = [newInvite, ...invites]
    localStorage.setItem('sg_employee_invites', JSON.stringify(updatedInvites))
    setInvites(updatedInvites)
    setMessage({ type: 'success', text: 'Invite link generated successfully!' })
    setTimeout(() => setMessage(''), 3000)
  }

  const sendInvite = (method) => {
    if (!inviteLink) {
      setMessage({ type: 'error', text: 'Generate an invite link first!' })
      return
    }
    
    if (method === 'email' && !email) {
      setMessage({ type: 'error', text: 'Enter an email address!' })
      return
    }
    
    if (method === 'sms' && !phone) {
      setMessage({ type: 'error', text: 'Enter a phone number!' })
      return
    }
    
    setLoading(true)
    setTimeout(() => {
      if (method === 'email') {
        setMessage({ type: 'success', text: `Invitation sent to ${email}!` })
      } else {
        setMessage({ type: 'success', text: `SMS sent to ${phone}!` })
      }
      setLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }, 1000)
  }

  const approveEmployee = (employeeId) => {
    const pending = JSON.parse(localStorage.getItem('sg_pending_employees') || '[]')
    const employee = pending.find(e => e.id === employeeId)
    
    if (employee) {
      const employees = JSON.parse(localStorage.getItem('sg_employees') || '[]')
      const newEmployee = {
        id: employees.length + 1,
        name: employee.fullName,
        email: employee.email,
        phone: employee.phone,
        role: 'Sales Agent',
        commissionRate: 30,
        baseSalary: 0,
        employmentType: 'contractor',
        status: 'active',
        joinDate: new Date().toISOString().split('T')[0],
        signups: [],
        totalCommission: 0,
        totalSignups: 0,
        lastPayout: new Date().toISOString().split('T')[0],
        permanentEligible: false,
        careerStage: 'contractor',
        documents: employee.documents
      }
      employees.push(newEmployee)
      localStorage.setItem('sg_employees', JSON.stringify(employees))
      
      const updatedPending = pending.filter(e => e.id !== employeeId)
      localStorage.setItem('sg_pending_employees', JSON.stringify(updatedPending))
      loadPendingRegistrations()
      setMessage({ type: 'success', text: `Employee ${employee.fullName} approved!` })
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const rejectEmployee = (employeeId) => {
    if (window.confirm('Reject this employee registration?')) {
      const pending = JSON.parse(localStorage.getItem('sg_pending_employees') || '[]')
      const updatedPending = pending.filter(e => e.id !== employeeId)
      localStorage.setItem('sg_pending_employees', JSON.stringify(updatedPending))
      loadPendingRegistrations()
      setMessage({ type: 'success', text: 'Employee registration rejected!' })
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const viewDocuments = (documents) => {
    let docList = ''
    if (documents) {
      docList = Object.entries(documents).map(([key, value]) => `${key}: ${value}`).join('\n')
    }
    alert(`Submitted Documents:\n\n${docList || 'No documents uploaded'}`)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink)
    setMessage({ type: 'success', text: 'Link copied to clipboard!' })
    setTimeout(() => setMessage(''), 2000)
  }

  return (
    <>
      <div className="admin-container">
        <div className="admin-header">
          <h1>Invite Employee</h1>
        </div>

        {message && <div className={`message-banner ${message.type}`}>{message.text}</div>}

        <div className="invite-section">
          <h2>Generate Invite Link</h2>
          <div className="invite-form">
            <div className="form-group">
              <label>Email (optional)</label>
              <input type="email" placeholder="employee@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Phone Number (optional)</label>
              <input type="tel" placeholder="+1234567890" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <button className="generate-btn" onClick={generateInviteLink}>Generate Invite Link</button>
          </div>

          {inviteLink && (
            <div className="invite-link-box">
              <p><strong>Invite Link:</strong></p>
              <code>{inviteLink}</code>
              <div className="link-actions">
                <button onClick={copyToClipboard}>📋 Copy Link</button>
                <button onClick={() => sendInvite('email')} disabled={loading}>📧 Send Email</button>
                <button onClick={() => sendInvite('sms')} disabled={loading}>📱 Send SMS</button>
              </div>
            </div>
          )}
        </div>

        <div className="invite-history">
          <h2>Sent Invites</h2>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Email/Phone</th>
                  <th>Invite Code</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invites.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="no-data">No invites sent yet</td>
                  </tr>
                ) : (
                  invites.map(inv => (
                    <tr key={inv.id}>
                      <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td>{inv.email !== 'Not specified' ? inv.email : inv.phone}</td>
                      <td>{inv.code}</td>
                      <td><span className="status-badge pending">Pending</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pending-employees">
          <h2>Pending Employee Registrations</h2>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Documents</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data">No pending registrations</td>
                  </tr>
                ) : (
                  pendingRegistrations.map(emp => (
                    <tr key={emp.id}>
                      <td>{emp.fullName}</td>
                      <td>{emp.email}</td>
                      <td>{emp.phone}</td>
                      <td>
                        <button className="view-docs-btn" onClick={() => viewDocuments(emp.documents)}>📄 View Docs</button>
                      </td>
                      <td className="action-cell">
                        <button className="approve-btn" onClick={() => approveEmployee(emp.id)}>Approve</button>
                        <button className="delete-btn" onClick={() => rejectEmployee(emp.id)}>Reject</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export default InviteEmployee
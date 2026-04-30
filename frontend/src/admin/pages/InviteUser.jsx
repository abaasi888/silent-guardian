import React, { useState, useEffect } from 'react'
import '../admin.css'

const InviteUser = () => {
  const [inviteLink, setInviteLink] = useState('')
  const [invites, setInvites] = useState([])
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadInvites()
  }, [])

  const loadInvites = () => {
    const savedInvites = JSON.parse(localStorage.getItem('sg_user_invites') || '[]')
    setInvites(savedInvites)
  }

  const generateInviteLink = () => {
    const inviteCode = 'USER_' + Math.random().toString(36).substring(2, 10).toUpperCase()
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
    localStorage.setItem('sg_user_invites', JSON.stringify(updatedInvites))
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink)
    setMessage({ type: 'success', text: 'Link copied to clipboard!' })
    setTimeout(() => setMessage(''), 2000)
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Invite User</h1>
        <p>Send invitation links for users to download and register</p>
      </div>

      {message && <div className={`message-banner ${message.type}`}>{message.text}</div>}

      <div className="invite-section">
        <h2>Generate Invite Link</h2>
        <div className="invite-form">
          <div className="form-group">
            <label>Email (optional)</label>
            <input type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
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
              <tr><th>Date</th><th>Email/Phone</th><th>Invite Code</th><th>Status</th></tr>
            </thead>
            <tbody>
              {invites.length === 0 ? (
                <tr><td colSpan="4" className="no-data">No invites sent yet</td></tr>
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

      <div className="info-box">
        <h3>How it works</h3>
        <ol>
          <li>Generate an invite link</li>
          <li>Send via email or SMS to the user</li>
          <li>User clicks link to download the app</li>
          <li>User registers with their invitation code</li>
          <li>User appears in your user list after registration</li>
        </ol>
      </div>
    </div>
  )
}

export default InviteUser
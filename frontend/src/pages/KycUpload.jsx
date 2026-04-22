import React, { useState, useEffect } from 'react'
import api from '../services/api'
import './KycUpload.css'

const KycUpload = () => {
  const [docType, setDocType] = useState('passport')
  const [docNumber, setDocNumber] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [status, setStatus] = useState('')
  const [kycStatus, setKycStatus] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/kyc/status')
        setKycStatus(res.data.status)
      } catch (err) {
        console.error(err)
      }
    }
    fetchStatus()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus('')
    try {
      await api.post('/kyc/submit', {
        documentType: docType,
        documentNumber: docNumber,
        documentImageUrl: imageUrl
      })
      setStatus('KYC submitted successfully. Awaiting approval.')
      setKycStatus('PENDING')
    } catch (err) {
      setStatus(err.response?.data?.message || 'Error submitting KYC')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="kyc-container">
      <div className="kyc-card">
        <h2>KYC Verification</h2>
        <p className="kyc-status">Current status: <strong>{kycStatus || 'NOT_SUBMITTED'}</strong></p>
        {kycStatus === 'APPROVED' && (
          <div className="kyc-approved">Your identity is already verified. Thank you!</div>
        )}
        {(kycStatus === 'NOT_SUBMITTED' || kycStatus === 'REJECTED') && (
          <form onSubmit={handleSubmit} className="kyc-form">
            <select value={docType} onChange={(e) => setDocType(e.target.value)} className="kyc-select">
              <option value="passport">Passport</option>
              <option value="id_card">ID Card</option>
              <option value="drivers_license">Driver's License</option>
            </select>
            <input
              type="text"
              placeholder="Document Number"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              required
              className="kyc-input"
            />
            <input
              type="url"
              placeholder="Image URL (upload to cloud storage)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
              className="kyc-input"
            />
            <button type="submit" disabled={loading} className="kyc-button">
              {loading ? 'Submitting...' : 'Submit KYC'}
            </button>
          </form>
        )}
        {status && <p className="kyc-message">{status}</p>}
      </div>
    </div>
  )
}

export default KycUpload
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../services/authService'
import './KycUpload.css'

const KycUpload = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('user') // 'user' or 'device'
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [submittedUserKyc, setSubmittedUserKyc] = useState(false)
  const [submittedDeviceKyc, setSubmittedDeviceKyc] = useState(false)
  const [kycStatus, setKycStatus] = useState({
    userKyc: 'pending',
    deviceKyc: 'pending'
  })
  
  // User KYC form data
  const [userKycData, setUserKycData] = useState({
    idDocument: null,
    selfie: null,
    proofOfAddress: null
  })
  
  // Device KYC form data
  const [deviceKycData, setDeviceKycData] = useState({
    deviceId: '',
    deviceModel: '',
    purchaseReceipt: null,
    devicePhoto: null,
    imeiNumber: ''
  })

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      // Check existing KYC status
      const savedKyc = localStorage.getItem('user_kyc_status')
      const savedSubmitted = localStorage.getItem('kyc_submitted')
      
      if (savedKyc) {
        const parsed = JSON.parse(savedKyc)
        setKycStatus(parsed)
        setSubmittedUserKyc(parsed.userKyc === 'pending_review' || parsed.userKyc === 'approved')
        setSubmittedDeviceKyc(parsed.deviceKyc === 'pending_review' || parsed.deviceKyc === 'approved')
      }
      
      if (savedSubmitted) {
        const submitted = JSON.parse(savedSubmitted)
        setSubmittedUserKyc(submitted.userKyc)
        setSubmittedDeviceKyc(submitted.deviceKyc)
      }
    } else {
      navigate('/login')
    }
  }, [navigate])

  const handleUserFileChange = (e, field) => {
    const file = e.target.files[0]
    if (file) {
      setUserKycData({ ...userKycData, [field]: file.name })
    }
  }

  const handleDeviceFileChange = (e, field) => {
    const file = e.target.files[0]
    if (file) {
      setDeviceKycData({ ...deviceKycData, [field]: file.name })
    }
  }

  const handleDeviceInputChange = (e) => {
    setDeviceKycData({ ...deviceKycData, [e.target.name]: e.target.value })
  }

  const submitUserKyc = (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    // Validate
    if (!userKycData.idDocument || !userKycData.selfie) {
      setMessage({ type: 'error', text: 'Please upload ID document and selfie' })
      setLoading(false)
      return
    }
    
    // Simulate API call
    setTimeout(() => {
      const newStatus = { ...kycStatus, userKyc: 'pending_review' }
      setKycStatus(newStatus)
      setSubmittedUserKyc(true)
      localStorage.setItem('user_kyc_status', JSON.stringify(newStatus))
      localStorage.setItem('kyc_submitted', JSON.stringify({ userKyc: true, deviceKyc: submittedDeviceKyc }))
      setMessage({ type: 'success', text: 'User KYC documents submitted for review! We will notify you once approved.' })
      setUserKycData({ idDocument: null, selfie: null, proofOfAddress: null })
      setLoading(false)
    }, 1500)
  }

  const submitDeviceKyc = (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    // Validate
    if (!deviceKycData.deviceId || !deviceKycData.deviceModel || !deviceKycData.purchaseReceipt) {
      setMessage({ type: 'error', text: 'Please fill all required fields and upload purchase receipt' })
      setLoading(false)
      return
    }
    
    // Simulate API call
    setTimeout(() => {
      const newStatus = { ...kycStatus, deviceKyc: 'pending_review' }
      setKycStatus(newStatus)
      setSubmittedDeviceKyc(true)
      localStorage.setItem('user_kyc_status', JSON.stringify(newStatus))
      localStorage.setItem('kyc_submitted', JSON.stringify({ userKyc: submittedUserKyc, deviceKyc: true }))
      setMessage({ type: 'success', text: 'Device KYC submitted for review! You can also complete this through the Android app.' })
      setDeviceKycData({
        deviceId: '',
        deviceModel: '',
        purchaseReceipt: null,
        devicePhoto: null,
        imeiNumber: ''
      })
      setLoading(false)
    }, 1500)
  }

  if (!user) {
    return <div className="kyc-container">Loading...</div>
  }

  return (
    <div className="kyc-container">
      <div className="kyc-header">
        <h1>KYC Verification</h1>
        <p>Verify your identity and devices to access all features</p>
      </div>

      {/* Status Cards */}
      <div className="kyc-status-cards">
        <div className={`status-card ${kycStatus.userKyc === 'approved' ? 'approved' : kycStatus.userKyc === 'pending_review' ? 'pending' : ''}`}>
          <div className="status-icon">👤</div>
          <div className="status-info">
            <h3>User Verification</h3>
            <p>Status: {kycStatus.userKyc === 'approved' ? '✅ Approved' : kycStatus.userKyc === 'pending_review' ? '⏳ Under Review' : '❌ Not Started'}</p>
          </div>
        </div>
        <div className={`status-card ${kycStatus.deviceKyc === 'approved' ? 'approved' : kycStatus.deviceKyc === 'pending_review' ? 'pending' : ''}`}>
          <div className="status-icon">📱</div>
          <div className="status-info">
            <h3>Device Verification</h3>
            <p>Status: {kycStatus.deviceKyc === 'approved' ? '✅ Approved' : kycStatus.deviceKyc === 'pending_review' ? '⏳ Under Review' : '❌ Not Started'}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Hide tabs if both are submitted or approved */}
      {(!(submittedUserKyc && submittedDeviceKyc) && 
        !(kycStatus.userKyc === 'approved' && kycStatus.deviceKyc === 'approved')) && (
        <div className="kyc-tabs">
          {!submittedUserKyc && kycStatus.userKyc !== 'approved' && (
            <button 
              className={`tab-btn ${activeTab === 'user' ? 'active' : ''}`}
              onClick={() => setActiveTab('user')}
            >
              👤 User KYC
            </button>
          )}
          {!submittedDeviceKyc && kycStatus.deviceKyc !== 'approved' && (
            <button 
              className={`tab-btn ${activeTab === 'device' ? 'active' : ''}`}
              onClick={() => setActiveTab('device')}
            >
              📱 Device KYC
            </button>
          )}
        </div>
      )}

      {/* Show message when all KYC is completed */}
      {kycStatus.userKyc === 'approved' && kycStatus.deviceKyc === 'approved' && (
        <div className="kyc-complete-card">
          <div className="complete-icon">🎉</div>
          <h2>KYC Complete!</h2>
          <p>Your identity and device have been verified. You now have full access to all features.</p>
          <button className="go-dashboard-btn" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      )}

      {/* User KYC Form - Only show if not submitted and not approved */}
      {activeTab === 'user' && !submittedUserKyc && kycStatus.userKyc !== 'approved' && (
        <div className="kyc-form-container">
          <form onSubmit={submitUserKyc} className="kyc-form">
            <div className="form-group">
              <label>Government ID (Passport/Driver's License/National ID)</label>
              <input 
                type="file" 
                onChange={(e) => handleUserFileChange(e, 'idDocument')}
                required
                accept="image/*,.pdf"
              />
              <small>Upload clear photo of your ID document</small>
            </div>

            <div className="form-group">
              <label>Selfie Picture</label>
              <input 
                type="file" 
                onChange={(e) => handleUserFileChange(e, 'selfie')}
                required
                accept="image/*"
              />
              <small>Take a selfie holding your ID document</small>
            </div>

            <div className="form-group">
              <label>Proof of Address (Optional)</label>
              <input 
                type="file" 
                onChange={(e) => handleUserFileChange(e, 'proofOfAddress')}
                accept="image/*,.pdf"
              />
              <small>Utility bill, bank statement, etc.</small>
            </div>

            {message && <div className={`message ${message.type}`}>{message.text}</div>}
            
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Submitting...' : 'Submit KYC for Review'}
            </button>
          </form>

          <div className="kyc-info">
            <h3>Why KYC?</h3>
            <ul>
              <li>✅ Verify your identity for security</li>
              <li>✅ Access premium features</li>
              <li>✅ Enable device tracking</li>
              <li>✅ Receive emergency support</li>
            </ul>
            <p className="note">Your documents are encrypted and securely stored. Review takes 24-48 hours.</p>
          </div>
        </div>
      )}

      {/* Show pending message for User KYC */}
      {submittedUserKyc && kycStatus.userKyc === 'pending_review' && (
        <div className="pending-card">
          <div className="pending-icon">⏳</div>
          <h3>User KYC Under Review</h3>
          <p>Your documents have been submitted and are being reviewed by our team.</p>
          <p>You will receive a notification once the verification is complete.</p>
          <small>Submitted on: {new Date().toLocaleDateString()}</small>
        </div>
      )}

      {/* Device KYC Form - Only show if not submitted and not approved */}
      {activeTab === 'device' && !submittedDeviceKyc && kycStatus.deviceKyc !== 'approved' && (
        <div className="kyc-form-container">
          <form onSubmit={submitDeviceKyc} className="kyc-form">
            <div className="form-group">
              <label>Device ID *</label>
              <input 
                type="text" 
                name="deviceId"
                placeholder="Enter your device ID (from Android app)"
                value={deviceKycData.deviceId}
                onChange={handleDeviceInputChange}
                required
              />
              <small>Find this in your Android app settings</small>
            </div>

            <div className="form-group">
              <label>Device Model *</label>
              <input 
                type="text" 
                name="deviceModel"
                placeholder="e.g., iPhone 14 Pro, Samsung Galaxy S23"
                value={deviceKycData.deviceModel}
                onChange={handleDeviceInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>IMEI Number (Optional)</label>
              <input 
                type="text" 
                name="imeiNumber"
                placeholder="15-digit IMEI number"
                value={deviceKycData.imeiNumber}
                onChange={handleDeviceInputChange}
              />
              <small>Dial *#06# on your phone to find IMEI</small>
            </div>

            <div className="form-group">
              <label>Purchase Receipt / Proof of Ownership *</label>
              <input 
                type="file" 
                onChange={(e) => handleDeviceFileChange(e, 'purchaseReceipt')}
                required
                accept="image/*,.pdf"
              />
              <small>Upload receipt or invoice showing device purchase</small>
            </div>

            <div className="form-group">
              <label>Device Photo (Optional)</label>
              <input 
                type="file" 
                onChange={(e) => handleDeviceFileChange(e, 'devicePhoto')}
                accept="image/*"
              />
              <small>Clear photo of your device showing its condition</small>
            </div>

            {message && <div className={`message ${message.type}`}>{message.text}</div>}
            
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Submitting...' : 'Submit Device KYC'}
            </button>
          </form>

          <div className="kyc-info">
            <h3>Android App Device Registration</h3>
            <ul>
              <li>📱 You can also complete device KYC through the Android app</li>
              <li>🔐 The app will automatically capture device information</li>
              <li>📍 Once verified, you can track your device location</li>
              <li>⚡ Faster verification through the app</li>
            </ul>
            <p className="note">
              <strong>Note:</strong> Device verification can be done either here on web or through the Android app during device pairing.
            </p>
          </div>
        </div>
      )}

      {/* Show pending message for Device KYC */}
      {submittedDeviceKyc && kycStatus.deviceKyc === 'pending_review' && (
        <div className="pending-card">
          <div className="pending-icon">⏳</div>
          <h3>Device KYC Under Review</h3>
          <p>Your device documents have been submitted and are being reviewed.</p>
          <p>You will receive a notification once the verification is complete.</p>
          <small>Submitted on: {new Date().toLocaleDateString()}</small>
        </div>
      )}
    </div>
  )
}

export default KycUpload
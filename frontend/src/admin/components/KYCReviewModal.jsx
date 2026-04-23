import React from 'react'
import './KYCReviewModal.css'

const KYCReviewModal = ({ user, onClose, onApprove, onReject }) => {
  if (!user) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>KYC Review - {user.fullName}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Document Type:</strong> {user.kycData?.documentType || 'N/A'}</p>
          <p><strong>Document Number:</strong> {user.kycData?.documentNumber || 'N/A'}</p>
          <p><strong>Submitted At:</strong> {user.kycData?.submittedAt ? new Date(user.kycData.submittedAt).toLocaleString() : 'N/A'}</p>
          <div className="document-image">
            <strong>Document Image:</strong>
            <img src={user.kycData?.documentImageUrl} alt="KYC Document" style={{ maxWidth: '100%', marginTop: '0.5rem' }} />
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={() => onApprove(user.id)} className="btn-modal approve">Approve</button>
          <button onClick={() => onReject(user.id)} className="btn-modal reject">Reject</button>
          <button onClick={onClose} className="btn-modal cancel">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default KYCReviewModal
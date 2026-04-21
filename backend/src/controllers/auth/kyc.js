/**
 * KYC (Know Your Customer) Controllers
 * 
 * submitKYC: POST /api/v1/auth/kyc - Submit KYC documents
 * getKYCStatus: GET /api/v1/auth/kyc - Get current KYC status
 */

const logger = require('../../config/logger');

/**
 * Submit KYC Documents
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const submitKYC = async (req, res) => {
  try {
    const { documentType, documentNumber, documentImage } = req.body;

    // Validate required fields
    if (!documentType || !documentNumber || !documentImage) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['documentType', 'documentNumber', 'documentImage']
      });
    }

    // Validate document type
    const validTypes = ['passport', 'driver_license', 'national_id'];
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({ 
        error: 'Invalid document type',
        allowedTypes: validTypes
      });
    }

    // Store KYC data (in production, upload image to cloud storage first)
    req.user.kycData = {
      documentType,
      documentNumber,
      documentImage, // Would be a URL or reference to stored file
      submittedAt: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };
    req.user.kycStatus = 'pending';
    await req.user.save();

    logger.info(`KYC submitted for user ${req.user.email} (${documentType})`);

    res.json({
      success: true,
      message: 'KYC documents submitted successfully. Awaiting review.',
      status: 'pending'
    });
  } catch (error) {
    logger.error(`KYC submission error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to submit KYC documents' });
  }
};

/**
 * Get KYC Status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getKYCStatus = async (req, res) => {
  try {
    const { kycStatus, kycData } = req.user;
    
    // Don't return sensitive document data
    const safeKycData = kycData ? {
      documentType: kycData.documentType,
      submittedAt: kycData.submittedAt,
      status: kycStatus
    } : null;

    res.json({
      success: true,
      status: kycStatus,
      details: safeKycData,
      message: kycStatus === 'approved' 
        ? 'KYC verified. You have full access to all features.'
        : kycStatus === 'rejected'
        ? 'KYC verification failed. Please contact support.'
        : 'KYC verification pending. Some features may be limited.'
    });
  } catch (error) {
    logger.error(`Get KYC status error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to retrieve KYC status' });
  }
};

module.exports = { submitKYC, getKYCStatus };
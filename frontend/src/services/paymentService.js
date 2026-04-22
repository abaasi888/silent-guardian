import api from './api'

/**
 * Service for crypto payment operations
 */
const paymentService = {
  /**
   * Create a new payment request
   * @param {Object} paymentData - { planId, amount }
   * @returns {Promise<Object>} - { paymentId, walletAddress, amount, currency, status }
   */
  createPayment: async (paymentData) => {
    const response = await api.post('/crypto/create-payment', paymentData)
    return response.data
  },

  /**
   * Verify payment status
   * @param {string} paymentId
   * @returns {Promise<Object>} - { status, txHash, message }
   */
  verifyPayment: async (paymentId) => {
    const response = await api.post(`/crypto/verify/${paymentId}`)
    return response.data
  },

  /**
   * Get payment history for current user
   * @returns {Promise<Array>}
   */
  getPaymentHistory: async () => {
    const response = await api.get('/crypto/payments')
    return response.data
  },

  /**
   * Poll payment status until confirmed or failed
   * @param {string} paymentId
   * @param {Function} onUpdate - callback(status, txHash)
   * @param {number} intervalMs - polling interval (default 10000)
   * @returns {Function} stopPolling function
   */
  pollPaymentStatus: (paymentId, onUpdate, intervalMs = 10000) => {
    let interval = null
    let stopped = false

    const poll = async () => {
      if (stopped) return
      try {
        const result = await paymentService.verifyPayment(paymentId)
        onUpdate(result.status, result.txHash)
        if (result.status === 'CONFIRMED' || result.status === 'FAILED') {
          stopPolling()
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
      stopped = true
    }

    interval = setInterval(poll, intervalMs)
    poll() // immediate first check

    return stopPolling
  }
}

export default paymentService
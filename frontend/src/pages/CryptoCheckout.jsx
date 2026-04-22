import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import './CryptoCheckout.css'

const CryptoCheckout = () => {
  const { planId, amount } = useParams()
  const [paymentId, setPaymentId] = useState(null)
  const [walletAddress, setWalletAddress] = useState('')
  const [status, setStatus] = useState('')
  const [txHash, setTxHash] = useState('')
  const [loading, setLoading] = useState(false)
  let pollInterval = null

  const initiatePayment = async () => {
    setLoading(true)
    setStatus('Creating payment...')
    try {
      const res = await api.post('/crypto/create-payment', {
        planId,
        amount: parseFloat(amount)
      })
      setPaymentId(res.data.paymentId)
      setWalletAddress(res.data.walletAddress)
      setStatus('Waiting for payment confirmation...')
      pollPayment(res.data.paymentId)
    } catch (err) {
      setStatus('Error initiating payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const pollPayment = (id) => {
    pollInterval = setInterval(async () => {
      try {
        const res = await api.post(`/crypto/verify/${id}`)
        if (res.data.status === 'CONFIRMED') {
          clearInterval(pollInterval)
          setStatus('Payment confirmed!')
          setTxHash(res.data.txHash)
        } else if (res.data.status === 'FAILED') {
          clearInterval(pollInterval)
          setStatus('Payment failed. Please contact support.')
        }
      } catch (err) {
        console.error(err)
      }
    }, 10000)
  }

  // Cleanup interval on unmount
  React.useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [pollInterval])

  return (
    <div className="checkout-container">
      <div className="checkout-card">
        <h2>Pay with USDT</h2>
        <p className="plan-info">Plan: {planId} | Amount: {amount} USDT</p>
        {!paymentId ? (
          <button onClick={initiatePayment} disabled={loading} className="pay-button">
            {loading ? 'Processing...' : `Pay ${amount} USDT`}
          </button>
        ) : (
          <div className="payment-details">
            <p>Send exactly <strong>{amount} USDT</strong> to the address below:</p>
            <div className="wallet-address">{walletAddress}</div>
            <p className="status-text">Status: {status}</p>
            {txHash && (
              <div className="tx-hash">
                Transaction hash: <a href={`https://tronscan.org/#/transaction/${txHash}`} target="_blank" rel="noopener noreferrer">{txHash}</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CryptoCheckout
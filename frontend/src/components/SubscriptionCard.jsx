import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCurrentUser } from '../services/authService'
import './Subscriptions.css'

const Subscriptions = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Plans
  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 4.99,
      priceUSD: 4.99,
      priceUSDT: 4.99,
      tier: 'BASIC',
      features: [
        '✓ Real-time GPS tracking',
        '✓ Location history (30 days)',
        '✓ Email support - 24 hour response'
      ],
      limitations: [
        '✗ No SMS tracking',
        '✗ No live chat support'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 9.99,
      priceUSD: 9.99,
      priceUSDT: 9.99,
      tier: 'PREMIUM',
      features: [
        '✓ Real-time GPS tracking',
        '✓ Location history (30 days)',
        '✓ SMS tracking',
        '✓ 24/7 Live chat support',
        '✓ Email support - 1 hour response'
      ],
      popular: true
    }
  ]

  const paymentMethods = [
    {
      id: 'crypto',
      name: 'Crypto (USDT)',
      icon: '₿',
      description: 'Pay with USDT on TRC20 or ERC20'
    },
    {
      id: 'mtn',
      name: 'MTN Mobile Money',
      icon: '📱',
      description: 'Pay with MTN Mobile Money'
    },
    {
      id: 'airtel',
      name: 'Airtel Money',
      icon: '📱',
      description: 'Pay with Airtel Money'
    },
    {
      id: 'card',
      name: 'Card Payment',
      icon: '💳',
      description: 'Visa, Mastercard, American Express'
    }
  ]

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      loadDevices()
      
      const params = new URLSearchParams(location.search)
      const deviceId = params.get('deviceId')
      if (deviceId) {
        const devices = JSON.parse(localStorage.getItem('user_devices') || '[]')
        const device = devices.find(d => d.deviceId === deviceId)
        if (device) {
          setSelectedDevice(device)
        }
      }
    } else {
      navigate('/login')
    }
  }, [location])

  const loadDevices = () => {
    const savedDevices = localStorage.getItem('user_devices')
    if (savedDevices) {
      setDevices(JSON.parse(savedDevices))
    }
  }

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan)
    setSelectedPaymentMethod(null)
  }

  const handleSelectPayment = (method) => {
    setSelectedPaymentMethod(method)
  }

  const handleProceedToPayment = () => {
    if (!selectedDevice && devices.length > 0) {
      setSelectedDevice(devices[0])
    }
    setShowPaymentModal(true)
  }

  const handlePayment = async () => {
    if (!selectedDevice || !selectedPlan || !selectedPaymentMethod) {
      setMessage({ type: 'error', text: 'Please select device, plan and payment method' })
      return
    }

    setLoading(true)
    setMessage('')

    setTimeout(() => {
      if (selectedPaymentMethod.id === 'crypto') {
        showCryptoPayment()
      } else if (selectedPaymentMethod.id === 'mtn' || selectedPaymentMethod.id === 'airtel') {
        showMobileMoneyPayment()
      } else if (selectedPaymentMethod.id === 'card') {
        showCardPayment()
      }
    }, 1000)
  }

  const showCryptoPayment = () => {
    const cryptoDetails = {
      walletAddress: 'TXuZVqQ8UQrLkqkLkqkLkqkLkqkLkqkL',
      network: 'TRC20',
      amount: selectedPlan.priceUSDT,
      currency: 'USDT'
    }
    
    setMessage({ 
      type: 'crypto', 
      data: cryptoDetails,
      text: `Send ${selectedPlan.priceUSDT} USDT to the following address:`
    })
    setLoading(false)
  }

  const showMobileMoneyPayment = () => {
    const phone = prompt(`Enter your ${selectedPaymentMethod.name} phone number:`, '2567XXXXXXXX')
    if (phone) {
      setMessage({ 
        type: 'success', 
        text: `Payment request sent to ${phone}. Please check your phone to complete payment.` 
      })
      setTimeout(() => {
        completeSubscription()
      }, 3000)
    }
    setLoading(false)
  }

  const showCardPayment = () => {
    const cardNumber = prompt('Enter card number:', '4242 4242 4242 4242')
    const expiry = prompt('Enter expiry date (MM/YY):', '12/25')
    const cvv = prompt('Enter CVV:', '123')
    
    if (cardNumber && expiry && cvv) {
      setMessage({ type: 'success', text: 'Payment successful! Processing subscription...' })
      setTimeout(() => {
        completeSubscription()
      }, 2000)
    }
    setLoading(false)
  }

  const completeSubscription = () => {
    const updatedDevices = devices.map(d => 
      d.id === selectedDevice.id ? {
        ...d,
        subscription: {
          plan: selectedPlan.name,
          tier: selectedPlan.tier,
          expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          active: true,
          paymentMethod: selectedPaymentMethod.name,
          lastPayment: new Date().toISOString(),
          features: {
            smsTracking: selectedPlan.id === 'premium',
            liveChat: selectedPlan.id === 'premium',
            emailSupport: selectedPlan.id === 'premium' ? '1 hour response' : '24 hour response',
            historyDays: 30
          }
        },
        status: 'active'
      } : d
    )
    
    localStorage.setItem('user_devices', JSON.stringify(updatedDevices))
    setMessage({ type: 'success', text: `${selectedPlan.name} subscription activated for ${selectedDevice.name}!` })
    setShowPaymentModal(false)
    setSelectedPlan(null)
    setSelectedPaymentMethod(null)
    setLoading(false)
    
    setTimeout(() => {
      navigate('/devices')
    }, 2000)
  }

  return (
    <div className="subscriptions-container">
      <div className="subscriptions-header">
        <h1>Subscription Plans</h1>
        <p>Choose the perfect plan for your device</p>
      </div>

      {/* Device Selection */}
      <div className="device-selector">
        <label>Select Device:</label>
        <select 
          value={selectedDevice?.id || ''}
          onChange={(e) => setSelectedDevice(devices.find(d => d.id === e.target.value))}
        >
          <option value="">Select a device</option>
          {devices.map(device => (
            <option key={device.id} value={device.id}>
              {device.name} - {device.subscription?.plan || 'No plan'} {device.subscription?.active ? '(Active)' : '(Inactive)'}
            </option>
          ))}
        </select>
      </div>

      {/* Plans Grid */}
      <div className="plans-grid">
        {plans.map(plan => (
          <div 
            key={plan.id} 
            className={`plan-card ${selectedPlan?.id === plan.id ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
            onClick={() => handleSelectPlan(plan)}
          >
            {plan.popular && <div className="popular-badge">Recommended</div>}
            <div className="plan-header">
              <h2>{plan.name}</h2>
              <div className="price">
                <span className="currency">$</span>
                <span className="amount">{plan.price}</span>
                <span className="period">/month</span>
              </div>
              <div className="price-usdt">≈ {plan.priceUSDT} USDT</div>
            </div>
            <div className="plan-features">
              <ul>
                {plan.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
              {plan.limitations && (
                <div className="plan-limitations">
                  {plan.limitations.map((limitation, idx) => (
                    <small key={idx}>{limitation}</small>
                  ))}
                </div>
              )}
            </div>
            <button className="select-plan-btn">Select Plan</button>
          </div>
        ))}
      </div>

      {/* Payment Methods */}
      {selectedPlan && (
        <div className="payment-section">
          <h2>Select Payment Method</h2>
          <div className="payment-methods-grid">
            {paymentMethods.map(method => (
              <div 
                key={method.id}
                className={`payment-method ${selectedPaymentMethod?.id === method.id ? 'selected' : ''}`}
                onClick={() => handleSelectPayment(method)}
              >
                <div className="payment-icon">{method.icon}</div>
                <div className="payment-details">
                  <h3>{method.name}</h3>
                  <p>{method.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            className="proceed-btn" 
            onClick={handleProceedToPayment}
            disabled={!selectedPaymentMethod}
          >
            Proceed to Payment
          </button>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className={`message-display ${message.type}`}>
          {message.type === 'crypto' ? (
            <div className="crypto-payment">
              <h3>Crypto Payment</h3>
              <p>{message.text}</p>
              <div className="wallet-address">
                <strong>Wallet Address:</strong>
                <code>{message.data.walletAddress}</code>
                <button onClick={() => navigator.clipboard.writeText(message.data.walletAddress)}>
                  Copy Address
                </button>
              </div>
              <div className="crypto-details">
                <p><strong>Network:</strong> {message.data.network}</p>
                <p><strong>Amount:</strong> {message.data.amount} {message.data.currency}</p>
              </div>
              <p className="crypto-note">Payment will be confirmed within 5-10 minutes</p>
              <button onClick={completeSubscription} className="confirm-crypto-btn">
                I've Sent the Payment
              </button>
            </div>
          ) : (
            <p>{message.text}</p>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Complete Payment</h2>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="payment-summary">
                <h3>Order Summary</h3>
                <div className="summary-row">
                  <span>Device:</span>
                  <strong>{selectedDevice?.name}</strong>
                </div>
                <div className="summary-row">
                  <span>Plan:</span>
                  <strong>{selectedPlan?.name} ({selectedPlan?.tier})</strong>
                </div>
                <div className="summary-row">
                  <span>Payment Method:</span>
                  <strong>{selectedPaymentMethod?.name}</strong>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <strong>${selectedPlan?.price} / month</strong>
                </div>
              </div>
              <button onClick={handlePayment} className="pay-now-btn" disabled={loading}>
                {loading ? 'Processing...' : `Pay $${selectedPlan?.price}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Subscriptions
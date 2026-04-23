import React from 'react'
import { useNavigate } from 'react-router-dom'
import './SubscriptionCard.css'

const SubscriptionCard = ({ plan, userDeviceClass, onSubscribe }) => {
  const navigate = useNavigate()
  const isCurrent = userDeviceClass === plan.deviceClass

  return (
    <div className={`subscription-card ${isCurrent ? 'current' : ''}`}>
      <div className="plan-header">
        <h3>{plan.name}</h3>
        <span className="device-class">{plan.deviceClass}</span>
      </div>
      <div className="plan-price">${plan.price}/month</div>
      <ul className="plan-features">
        <li>✓ {plan.deviceClass === 'CHEAP' ? 'Basic tracking' : 'Advanced tracking'}</li>
        <li>✓ {plan.deviceClass === 'CHEAP' ? '5 min intervals' : '1 min intervals'}</li>
        <li>✓ {plan.deviceClass === 'CHEAP' ? 'SMS alerts' : 'SMS + Email alerts'}</li>
        <li>✓ {plan.deviceClass === 'CHEAP' ? 'Standard support' : 'Priority support'}</li>
      </ul>
      {!isCurrent ? (
        <button onClick={() => onSubscribe(plan)} className="subscribe-btn">Subscribe</button>
      ) : (
        <div className="current-badge">Current Plan</div>
      )}
    </div>
  )
}

export default SubscriptionCard
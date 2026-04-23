import React, { useState, useEffect } from 'react'
import api from '../services/api'
import SubscriptionCard from '../components/SubscriptionCard'
import './Subscriptions.css'

const Subscriptions = () => {
  const [plans, setPlans] = useState([
    { id: 'basic', name: 'Basic Plan', price: 9.99, deviceClass: 'CHEAP' },
    { id: 'premium', name: 'Premium Plan', price: 29.99, deviceClass: 'EXPENSIVE' }
  ])
  const [currentClass, setCurrentClass] = useState(null)

  useEffect(() => {
    // Fetch user's current subscription from backend
    api.get('/user/subscription').then(res => {
      setCurrentClass(res.data.deviceTier)
    }).catch(() => {})
  }, [])

  const handleSubscribe = (plan) => {
    // Redirect to crypto checkout with plan info
    window.location.href = `/checkout/${plan.id}/${plan.price}`
  }

  return (
    <div className="subscriptions-page">
      <h1>Choose Your Plan</h1>
      <div className="plans-grid">
        {plans.map(plan => (
          <SubscriptionCard
            key={plan.id}
            plan={plan}
            userDeviceClass={currentClass}
            onSubscribe={handleSubscribe}
          />
        ))}
      </div>
    </div>
  )
}

export default Subscriptions
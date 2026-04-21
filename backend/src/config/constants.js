/**
 * Application Constants
 * Centralized definitions for subscriptions, device statuses, alerts, etc.
 */

// Subscription plans with pricing, duration, and features
const SUBSCRIPTION_PLANS = {
  BASIC: {
    id: 'basic',
    name: 'Basic Plan',
    price: 9.99,
    priceId: 'price_basic_monthly', // Stripe price ID
    durationDays: 30,
    features: [
      '1_device',
      '24h_history',
      'basic_support',
      'realtime_tracking'
    ],
    limits: {
      maxDevices: 1,
      historyRetentionDays: 1,
      alertChannels: ['email']
    }
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium Plan',
    price: 19.99,
    priceId: 'price_premium_monthly',
    durationDays: 30,
    features: [
      '5_devices',
      '90d_history',
      'stealth_mode',
      'geofencing',
      'priority_support'
    ],
    limits: {
      maxDevices: 5,
      historyRetentionDays: 90,
      alertChannels: ['email', 'sms']
    }
  },
  FAMILY: {
    id: 'family',
    name: 'Family Plan',
    price: 39.99,
    priceId: 'price_family_monthly',
    durationDays: 30,
    features: [
      '15_devices',
      '1y_history',
      'stealth_mode',
      'geofencing',
      'alerts',
      '24/7_support'
    ],
    limits: {
      maxDevices: 15,
      historyRetentionDays: 365,
      alertChannels: ['email', 'sms', 'push']
    }
  }
};

// Device status enumerations
const DEVICE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  STOLEN: 'stolen',
  PENDING: 'pending',
  MAINTENANCE: 'maintenance'
};

// Alert types for notifications
const ALERT_TYPES = {
  MOVEMENT: 'movement',
  GEO_FENCE: 'geofence',
  BATTERY: 'battery',
  TAMPER: 'tamper',
  INACTIVITY: 'inactivity',
  SPEEDING: 'speeding'
};

// Payment related constants
const PAYMENT = {
  CURRENCY: 'USD',
  TAX_RATE: 0.00, // Adjust based on jurisdiction
  MINIMUM_AMOUNT: 0.50,
  MAXIMUM_AMOUNT: 9999.99
};

// JWT token expiration times
const JWT_EXPIRY = '7d'; // Access token
const REFRESH_TOKEN_EXPIRY = '30d'; // Refresh token

// Rate limiting defaults
const RATE_LIMITS = {
  DEFAULT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  DEFAULT_MAX_REQUESTS: 100,
  AUTH_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  AUTH_MAX_REQUESTS: 5, // 5 login attempts per hour
  API_WINDOW_MS: 60 * 1000, // 1 minute
  API_MAX_REQUESTS: 60 // 60 requests per minute
};

// Cache TTLs (in seconds)
const CACHE_TTL = {
  DEVICE_LOCATION: 3600, // 1 hour
  USER_SESSION: 86400, // 24 hours
  SUBSCRIPTION_STATUS: 3600, // 1 hour
  PRICING: 86400 // 24 hours
};

module.exports = {
  SUBSCRIPTION_PLANS,
  DEVICE_STATUS,
  ALERT_TYPES,
  PAYMENT,
  JWT_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  RATE_LIMITS,
  CACHE_TTL
};
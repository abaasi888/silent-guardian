module.exports = {
  SUBSCRIPTION_PLANS: {
    BASIC: { id: 'basic', price: 9.99, durationDays: 30, features: ['1_device', '24h_history'] },
    PREMIUM: { id: 'premium', price: 19.99, durationDays: 30, features: ['5_devices', '90d_history', 'stealth_mode'] },
    FAMILY: { id: 'family', price: 39.99, durationDays: 30, features: ['15_devices', '1y_history', 'stealth_mode', 'alerts'] }
  },
  DEVICE_STATUS: { ACTIVE: 'active', INACTIVE: 'inactive', STOLEN: 'stolen', PENDING: 'pending' },
  ALERT_TYPES: { MOVEMENT: 'movement', GEO_FENCE: 'geofence', BATTERY: 'battery', TAMPER: 'tamper' },
  CURRENCY: 'USD',
  JWT_EXPIRY: '7d',
  REFRESH_TOKEN_EXPIRY: '30d'
};

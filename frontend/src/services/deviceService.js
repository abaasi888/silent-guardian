import api from './api'

/**
 * Service for device-related API calls
 */
const deviceService = {
  /**
   * Register a new device
   * @param {Object} deviceData - { deviceName, hardwareInfo }
   * @returns {Promise<Object>} - { deviceId, apiKey }
   */
  registerDevice: async (deviceData) => {
    const response = await api.post('/devices/register', deviceData)
    return response.data
  },

  /**
   * Submit location from a device
   * @param {Object} locationData - { deviceId, lat, lng, accuracy, speed, heading, isOffline }
   * @returns {Promise<Object>}
   */
  submitLocation: async (locationData) => {
    const response = await api.post('/devices/location', locationData)
    return response.data
  },

  /**
   * Get all devices for current user
   * @returns {Promise<Array>}
   */
  getDevices: async () => {
    const response = await api.get('/devices')
    return response.data
  },

  /**
   * Get location history for a device
   * @param {string} deviceId
   * @returns {Promise<Array>}
   */
  getLocationHistory: async (deviceId) => {
    const response = await api.get(`/devices/history?deviceId=${deviceId}`)
    return response.data
  },

  /**
   * Update device status (e.g., mark as stolen)
   * @param {string} deviceId
   * @param {string} status - ACTIVE, INACTIVE, STOLEN
   * @returns {Promise<Object>}
   */
  updateDeviceStatus: async (deviceId, status) => {
    const response = await api.put(`/devices/${deviceId}/status`, { status })
    return response.data
  },

  /**
   * Enable/disable stealth mode for a device
   * @param {string} deviceId
   * @param {boolean} enabled
   * @returns {Promise<Object>}
   */
  setStealthMode: async (deviceId, enabled) => {
    const response = await api.put(`/devices/${deviceId}/stealth`, { stealthEnabled: enabled })
    return response.data
  }
}

export default deviceService
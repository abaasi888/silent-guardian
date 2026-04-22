import { useState, useCallback } from 'react'
import api from '../services/api'

/**
 * Custom hook for making API calls with built-in loading and error states
 * @param {Function} requestFn - Async function that performs the API call
 * @returns {Object} { data, loading, error, execute, reset }
 */
const useApi = (requestFn) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await requestFn(...args)
      setData(result)
      return result
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'An error occurred'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [requestFn])

  const reset = useCallback(() => {
    setData(null)
    setLoading(false)
    setError(null)
  }, [])

  return { data, loading, error, execute, reset }
}

// Pre-configured hooks for common endpoints
export const useGetDevices = () => {
  const requestFn = useCallback(() => api.get('/devices').then(res => res.data), [])
  return useApi(requestFn)
}

export const useSubmitLocation = () => {
  const requestFn = useCallback((locationData) => api.post('/devices/location', locationData).then(res => res.data), [])
  return useApi(requestFn)
}

export const useCreatePayment = () => {
  const requestFn = useCallback((paymentData) => api.post('/crypto/create-payment', paymentData).then(res => res.data), [])
  return useApi(requestFn)
}

export default useApi
import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for accessing device geolocation
 * @param {Object} options - GeolocationOptions (enableHighAccuracy, timeout, maximumAge)
 * @returns {Object} { location, error, loading, getLocation, watchLocation, stopWatching }
 */
const useDeviceLocation = (options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }) => {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const watchIdRef = useState(null)

  const handleSuccess = useCallback((position) => {
    const { latitude, longitude, accuracy, speed, heading } = position.coords
    setLocation({ lat: latitude, lng: longitude, accuracy, speed, heading, timestamp: position.timestamp })
    setError(null)
    setLoading(false)
  }, [])

  const handleError = useCallback((err) => {
    let message = 'Unknown location error'
    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = 'Location permission denied'
        break
      case err.POSITION_UNAVAILABLE:
        message = 'Location information unavailable'
        break
      case err.TIMEOUT:
        message = 'Location request timed out'
        break
    }
    setError(message)
    setLoading(false)
  }, [])

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by this browser')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options)
  }, [handleSuccess, handleError, options])

  const watchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return null
    }
    const id = navigator.geolocation.watchPosition(handleSuccess, handleError, options)
    watchIdRef.current = id
    return id
  }, [handleSuccess, handleError, options])

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopWatching()
  }, [stopWatching])

  return { location, error, loading, getLocation, watchLocation, stopWatching }
}

export default useDeviceLocation
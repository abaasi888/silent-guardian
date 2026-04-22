import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import './LocationHistory.css'

const LocationHistory = () => {
  const [searchParams] = useSearchParams()
  const deviceId = searchParams.get('deviceId')
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!deviceId) {
      setError('No device specified')
      setLoading(false)
      return
    }
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/devices/history?deviceId=${deviceId}`)
        setLocations(res.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load location history')
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [deviceId])

  if (loading) return <LoadingSpinner message="Loading location history..." />
  if (error) return <div className="error-message">{error}</div>

  return (
    <div className="history-container">
      <h2>Location History</h2>
      {locations.length === 0 ? (
        <p>No location data available for this device.</p>
      ) : (
        <div className="history-list">
          {locations.map((loc, idx) => (
            <div key={idx} className="history-item">
              <div className="history-coords">
                <strong>Lat:</strong> {loc.lat}, <strong>Lng:</strong> {loc.lng}
              </div>
              <div className="history-meta">
                {loc.accuracy && <span>Accuracy: {loc.accuracy}m</span>}
                {loc.speed && <span>Speed: {loc.speed} m/s</span>}
                <span>{new Date(loc.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LocationHistory
import React, { useState, useEffect } from 'react'
import './CorporatePages.css'

export default function CorporateGeofences() {
  const [geofences, setGeofences] = useState([])
  const [loading, setLoading] = useState(true)

  // Mock geofence data
  const mockGeofences = [
    { id: '1', name: 'Warehouse North', type: 'CIRCLE', radius: 500, coordinates: [{ lat: 40.7128, lng: -74.0060 }], active: true },
    { id: '2', name: 'Office Complex', type: 'POLYGON', coordinates: [{ lat: 40.7140, lng: -74.0080 }, { lat: 40.7150, lng: -74.0090 }], active: true },
    { id: '3', name: 'Restricted Zone', type: 'CIRCLE', radius: 200, coordinates: [{ lat: 40.7100, lng: -74.0100 }], active: false }
  ]

  useEffect(() => {
    setTimeout(() => {
      setGeofences(mockGeofences)
      setLoading(false)
    }, 500)
  }, [])

  if (loading) return <div className="corporate-page">Loading geofences...</div>

  return (
    <div className="corporate-page">
      <h1>Geofences</h1>
      <div className="geofence-grid">
        {geofences.map(geo => (
          <div key={geo.id} className="geofence-card">
            <h3>{geo.name}</h3>
            <p>Type: {geo.type}</p>
            {geo.type === 'CIRCLE' && <p>Radius: {geo.radius}m</p>}
            <p>Coordinates: {geo.coordinates.map(c => `${c.lat},${c.lng}`).join(' | ')}</p>
            <p>Status: {geo.active ? 'Active' : 'Inactive'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
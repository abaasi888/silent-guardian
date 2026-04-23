import React, { useEffect, useState } from 'react'
import './TrackingMap.css'

// Simple map simulation – in production use Leaflet or Google Maps
const TrackingMap = ({ locations, center, zoom = 10 }) => {
  const [mapCenter, setMapCenter] = useState(center || { lat: 0, lng: 0 })

  useEffect(() => {
    if (locations && locations.length > 0) {
      const last = locations[locations.length - 1]
      setMapCenter({ lat: last.lat, lng: last.lng })
    }
  }, [locations])

  return (
    <div className="tracking-map">
      <div className="map-placeholder">
        <div className="map-coords">
          📍 Current center: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
        </div>
        <div className="map-markers">
          {locations?.map((loc, idx) => (
            <div key={idx} className="marker">
              🟢 {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)} at {new Date(loc.timestamp).toLocaleTimeString()}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TrackingMap
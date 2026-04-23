import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import './GeofenceManager.css'

const GeofenceManager = () => {
  const [geofences, setGeofences] = useState([])
  const [newGeofence, setNewGeofence] = useState({ name: '', lat: 0, lng: 0, radius: 100 })

  useEffect(() => {
    api.get('/corporate/geofences/org/current').then(res => setGeofences(res.data))
  }, [])

  const createGeofence = async () => {
    const geofenceData = {
      name: newGeofence.name,
      type: 'CIRCLE',
      coordinates: [{ lat: newGeofence.lat, lng: newGeofence.lng }],
      radius: newGeofence.radius,
      triggerEvents: ['ENTER', 'EXIT']
    }
    const res = await api.post('/corporate/geofences', geofenceData)
    setGeofences([...geofences, res.data])
    setNewGeofence({ name: '', lat: 0, lng: 0, radius: 100 })
  }

  return (
    <div className="geofence-manager">
      <h1>Geofences</h1>
      <div className="create-geofence">
        <input placeholder="Name" value={newGeofence.name} onChange={e => setNewGeofence({...newGeofence, name: e.target.value})} />
        <input placeholder="Latitude" type="number" value={newGeofence.lat} onChange={e => setNewGeofence({...newGeofence, lat: parseFloat(e.target.value)})} />
        <input placeholder="Longitude" type="number" value={newGeofence.lng} onChange={e => setNewGeofence({...newGeofence, lng: parseFloat(e.target.value)})} />
        <input placeholder="Radius (m)" type="number" value={newGeofence.radius} onChange={e => setNewGeofence({...newGeofence, radius: parseFloat(e.target.value)})} />
        <button onClick={createGeofence}>Add Geofence</button>
      </div>
      {geofences.map(g => (
        <div key={g.id} className="geofence-card">
          <strong>{g.name}</strong> – Center: {g.coordinates[0].lat}, {g.coordinates[0].lng} – Radius: {g.radius}m
        </div>
      ))}
    </div>
  )
}

export default GeofenceManager
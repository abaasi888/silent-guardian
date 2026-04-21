import { useState, useEffect, useRef } from 'react';
import { checkGeofences } from '../utils/geofence';
import { saveOfflineLocation } from '../services/offline';

export const useAdaptiveGeolocation = (deviceId, isOnline) => {
  const [position, setPosition] = useState(null);
  const [speed, setSpeed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed: spd, accuracy, timestamp } = pos.coords;
        const currentSpeed = spd || 0;
        setSpeed(currentSpeed);
        setPosition({ lat: latitude, lng: longitude, accuracy, timestamp: new Date(timestamp) });
        checkGeofences(latitude, longitude);
        const loc = { deviceId, lat: latitude, lng: longitude, accuracy, speed: currentSpeed, timestamp: new Date(timestamp), isOffline: !isOnline };
        saveOfflineLocation(loc);
      },
      (err) => console.error('Geolocation error', err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [deviceId, isOnline]);

  return { position, speed };
};

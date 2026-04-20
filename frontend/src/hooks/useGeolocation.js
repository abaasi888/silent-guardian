import { useState, useEffect } from 'react';
export const useGeolocation = () => { const [position, setPosition] = useState(null); useEffect(() => { const watchId = navigator.geolocation.watchPosition(pos => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })); return () => navigator.geolocation.clearWatch(watchId); }, []); return position; };

import { useState, useEffect } from 'react';
import api from '../services/api';
export const useTracking = (deviceId) => { const [locations, setLocations] = useState([]); useEffect(() => { api.get(`/web/locations?deviceId=${deviceId}`).then(res => setLocations(res.data)); }, [deviceId]); return locations; };

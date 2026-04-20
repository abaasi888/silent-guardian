import api from './api';
export const getLocations = (deviceId) => api.get(`/web/locations?deviceId=${deviceId}`);
export const submitLocation = (deviceId, lat, lng) => api.post('/devices/location', { deviceId, lat, lng });

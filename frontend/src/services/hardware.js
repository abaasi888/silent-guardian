import api from './api';
export const reportFingerprint = (deviceId, fingerprint) => api.post('/devices/fingerprint', { deviceId, fingerprint });

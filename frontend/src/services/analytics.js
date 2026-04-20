import api from './api';
export const getAnalytics = (deviceId) => api.get(`/web/analytics?deviceId=${deviceId}`);

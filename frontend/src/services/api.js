import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
api.interceptors.request.use((config) => { const token = localStorage.getItem('accessToken'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
api.interceptors.response.use((res) => res, async (err) => { if (err.response?.status === 401) { const refresh = localStorage.getItem('refreshToken'); if (refresh) { const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh-token`, { refreshToken: refresh }); localStorage.setItem('accessToken', res.data.accessToken); err.config.headers.Authorization = `Bearer ${res.data.accessToken}`; return api(err.config); } } return Promise.reject(err); });
export default api;

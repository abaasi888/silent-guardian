import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const token = localStorage.getItem('accessToken'); if (token) api.get('/auth/me').then(res => setUser(res.data)).catch(() => logout()); setLoading(false); }, []);
  const login = async (email, password) => { const res = await api.post('/auth/login', { email, password }); localStorage.setItem('accessToken', res.data.accessToken); localStorage.setItem('refreshToken', res.data.refreshToken); setUser(res.data.user); return res.data; };
  const logout = () => { localStorage.clear(); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
};

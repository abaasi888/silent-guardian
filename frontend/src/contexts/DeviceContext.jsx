import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
export const DeviceContext = createContext();
export const DeviceProvider = ({ children }) => {
  const [devices, setDevices] = useState([]);
  const loadDevices = async () => { const res = await api.get('/web/devices'); setDevices(res.data); };
  useEffect(() => { loadDevices(); }, []);
  return <DeviceContext.Provider value={{ devices, loadDevices }}>{children}</DeviceContext.Provider>;
};

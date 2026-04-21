import api from './api';
import { getItem, setItem } from './storage';

export const startSimDetection = (deviceId) => {
  const storedSim = getItem('lastSimNumber');
  if (!storedSim) {
    setItem('lastSimNumber', 'SIM_MOCK_001');
  }
  // In real Android, you'd listen to SIM state changes and call reportSimChange.
};

export const reportSimChange = async (deviceId, newSimNumber, oldSimNumber) => {
  try {
    await api.post('/devices/sim-change', { deviceId, newSimNumber, oldSimNumber });
    setItem('lastSimNumber', newSimNumber);
  } catch (err) {
    console.error('Failed to report SIM change', err);
  }
};

export const stopSimDetection = () => {};

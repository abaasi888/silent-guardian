import { useContext } from 'react';
import { StealthContext } from '../contexts/StealthContext';
export const useStealth = () => useContext(StealthContext);

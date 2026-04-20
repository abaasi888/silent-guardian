import React, { createContext, useState } from 'react';
export const StealthContext = createContext();
export const StealthProvider = ({ children }) => {
  const [isStealth, setIsStealth] = useState(localStorage.getItem('stealth') === 'true');
  const toggleStealth = () => { const newVal = !isStealth; setIsStealth(newVal); localStorage.setItem('stealth', newVal); };
  return <StealthContext.Provider value={{ isStealth, toggleStealth }}>{children}</StealthContext.Provider>;
};

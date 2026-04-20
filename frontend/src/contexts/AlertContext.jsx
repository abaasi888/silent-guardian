import React, { createContext } from 'react';
export const AlertContext = createContext();
export const AlertProvider = ({ children }) => <AlertContext.Provider value={{}}>{children}</AlertContext.Provider>;

import React, { createContext } from 'react';
export const ThemeContext = createContext();
export const ThemeProvider = ({ children }) => <ThemeContext.Provider value={{ theme: 'light' }}>{children}</ThemeContext.Provider>;

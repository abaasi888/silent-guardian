import React, { createContext } from 'react';
export const SubscriptionContext = createContext();
export const SubscriptionProvider = ({ children }) => <SubscriptionContext.Provider value={{}}>{children}</SubscriptionContext.Provider>;

import api from './api';
export const getPlans = () => api.get('/subscriptions/plans');
export const createSubscription = (planId, paymentMethodId) => api.post('/subscriptions/create', { planId, paymentMethodId });

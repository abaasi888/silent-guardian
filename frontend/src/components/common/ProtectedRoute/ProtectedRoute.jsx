import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
const ProtectedRoute = ({ children }) => { const { user, loading } = useAuth(); if (loading) return <LoadingSpinner />; return user ? children : <Navigate to="/login" />; };
export default ProtectedRoute;

import React from 'react';
import Header from '../../../components/common/Header/Header';
import { useAuth } from '../../../hooks/useAuth';
const Dashboard = () => { const { user } = useAuth(); return (<div><Header /><h1>Welcome, {user?.fullName}</h1></div>); };
export default Dashboard;

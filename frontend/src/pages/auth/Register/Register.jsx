import React, { useState } from 'react';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';
const Register = () => {
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '' });
  const navigate = useNavigate();
  const handleSubmit = async (e) => { e.preventDefault(); await api.post('/auth/register', form); navigate('/login'); };
  return ( <div><h2>Register</h2><form onSubmit={handleSubmit}><input placeholder="Full Name" onChange={e=>setForm({...form,fullName:e.target.value})} /><input placeholder="Email" onChange={e=>setForm({...form,email:e.target.value})} /><input type="password" placeholder="Password" onChange={e=>setForm({...form,password:e.target.value})} /><input placeholder="Phone" onChange={e=>setForm({...form,phone:e.target.value})} /><button type="submit">Register</button></form></div> );
};
export default Register;

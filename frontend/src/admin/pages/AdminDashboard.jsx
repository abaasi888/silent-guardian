import React, { useEffect, useState } from 'react'
import api from '../../services/api'
export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [devices, setDevices] = useState([])
  useEffect(() => {
    api.get('/admin/users').then(res => setUsers(res.data))
    api.get('/admin/devices').then(res => setDevices(res.data))
  }, [])
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <section><h2>Users</h2><ul>{users.map(u => <li key={u.id}>{u.email} - KYC: {u.kycStatus} <button onClick={() => api.put(`/admin/users/${u.id}/kyc?status=APPROVED`)}>Approve KYC</button> <button onClick={() => api.delete(`/admin/users/${u.id}`)}>Delete</button></li>)}</ul></section>
      <section><h2>Devices</h2><ul>{devices.map(d => <li key={d.id}>{d.deviceName} - Status: {d.status} <button onClick={() => api.put(`/admin/devices/${d.deviceId}/status?status=STOLEN`)}>Mark Stolen</button></li>)}</ul></section>
    </div>
  )
}

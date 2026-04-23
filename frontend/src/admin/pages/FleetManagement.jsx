import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import './FleetManagement.css'

const FleetManagement = () => {
  const [groups, setGroups] = useState([])
  const [newGroupName, setNewGroupName] = useState('')
  const [availableDevices, setAvailableDevices] = useState([])

  useEffect(() => {
    api.get('/corporate/groups/org/current').then(res => setGroups(res.data))
    api.get('/devices').then(res => setAvailableDevices(res.data))
  }, [])

  const createGroup = async () => {
    const res = await api.post('/corporate/groups', { name: newGroupName, orgId: 'current', deviceIds: [] })
    setGroups([...groups, res.data])
    setNewGroupName('')
  }

  const addDeviceToGroup = async (groupId, deviceId) => {
    const group = groups.find(g => g.id === groupId)
    group.deviceIds.push(deviceId)
    await api.put(`/corporate/groups/${groupId}`, group)
    setGroups(groups.map(g => g.id === groupId ? group : g))
  }

  return (
    <div className="fleet-management">
      <h1>Fleet Management</h1>
      <div className="create-group">
        <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Group name" />
        <button onClick={createGroup}>Create Group</button>
      </div>
      {groups.map(group => (
        <div key={group.id} className="group-card">
          <h3>{group.name}</h3>
          <div className="devices-in-group">
            {group.deviceIds.map(devId => <span key={devId}>{devId}</span>)}
          </div>
          <select onChange={e => addDeviceToGroup(group.id, e.target.value)}>
            <option value="">Add device</option>
            {availableDevices.filter(d => !group.deviceIds.includes(d.id)).map(d => (
              <option key={d.id} value={d.id}>{d.deviceName}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}

export default FleetManagement
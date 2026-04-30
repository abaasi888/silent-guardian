import React, { useState } from 'react'
import '../admin.css'

const Backup = () => {
  const [backupHistory, setBackupHistory] = useState(() => JSON.parse(localStorage.getItem('sg_backup_history') || '[]'))
  const [loading, setLoading] = useState(false)

  const createBackup = () => {
    setLoading(true)
    setTimeout(() => {
      const backupData = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        users: JSON.parse(localStorage.getItem('sg_users') || '[]'),
        devices: JSON.parse(localStorage.getItem('sg_devices') || '[]'),
        employees: JSON.parse(localStorage.getItem('sg_employees') || '[]'),
        tickets: JSON.parse(localStorage.getItem('sg_tickets') || '[]'),
        transactions: JSON.parse(localStorage.getItem('sg_transactions') || '[]')
      }
      
      const history = [{ id: backupData.id, createdAt: backupData.createdAt, size: JSON.stringify(backupData).length }, ...backupHistory]
      localStorage.setItem('sg_backup_history', JSON.stringify(history))
      localStorage.setItem(`sg_backup_${backupData.id}`, JSON.stringify(backupData))
      setBackupHistory(history)
      alert('Backup created successfully!')
      setLoading(false)
    }, 1500)
  }

  const restoreBackup = (backupId) => {
    if (window.confirm('Restoring backup will overwrite current data. Continue?')) {
      const backupData = JSON.parse(localStorage.getItem(`sg_backup_${backupId}`) || '{}')
      if (backupData.users) localStorage.setItem('sg_users', JSON.stringify(backupData.users))
      if (backupData.devices) localStorage.setItem('sg_devices', JSON.stringify(backupData.devices))
      if (backupData.employees) localStorage.setItem('sg_employees', JSON.stringify(backupData.employees))
      if (backupData.tickets) localStorage.setItem('sg_tickets', JSON.stringify(backupData.tickets))
      alert('Backup restored successfully!')
      window.location.reload()
    }
  }

  const downloadBackup = (backupId) => {
    const backupData = localStorage.getItem(`sg_backup_${backupId}`)
    const blob = new Blob([backupData], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `silentguardian_backup_${backupId}.json`
    a.click()
  }

  const deleteBackup = (backupId) => {
    if (window.confirm('Delete this backup?')) {
      localStorage.removeItem(`sg_backup_${backupId}`)
      const updatedHistory = backupHistory.filter(b => b.id !== backupId)
      localStorage.setItem('sg_backup_history', JSON.stringify(updatedHistory))
      setBackupHistory(updatedHistory)
    }
  }

  return (
    <div className="admin-container">
      <div className="admin-header"><h1>Backup & Restore</h1><button className="create-backup-btn" onClick={createBackup} disabled={loading}>{loading ? 'Creating...' : 'Create Backup'}</button></div>
      
      <div className="backup-stats"><div className="stat-card"><div className="stat-icon">💾</div><div className="stat-info"><h3>{backupHistory.length}</h3><p>Total Backups</p></div></div></div>
      
      <div className="backup-list">
        <h3>Backup History</h3>
        {backupHistory.length === 0 ? (<p className="no-backups">No backups created yet.</p>) : (
          backupHistory.map(backup => (<div key={backup.id} className="backup-item"><div className="backup-info"><span className="backup-date">{new Date(backup.createdAt).toLocaleString()}</span><span className="backup-size">{(backup.size / 1024).toFixed(2)} KB</span></div><div className="backup-actions"><button className="restore-btn" onClick={() => restoreBackup(backup.id)}>Restore</button><button className="download-btn" onClick={() => downloadBackup(backup.id)}>Download</button><button className="delete-backup-btn" onClick={() => deleteBackup(backup.id)}>Delete</button></div></div>))
        )}
      </div>
    </div>
  )
}

export default Backup
import React, { useState } from 'react'
import '../admin.css'

const Settings = () => {
  const [settings, setSettings] = useState({
    twoFactor: false,
    emailNotifications: true,
    sessionTimeout: '30',
    darkMode: false
  })

  const handleSave = () => {
    localStorage.setItem('adminSettings', JSON.stringify(settings))
    alert('Settings saved successfully!')
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-card">
        <div className="setting-group">
          <label>Two-Factor Authentication</label>
          <div className="toggle-switch">
            <input type="checkbox" checked={settings.twoFactor} onChange={(e) => setSettings({...settings, twoFactor: e.target.checked})} />
            <span className="toggle-slider"></span>
          </div>
        </div>
        <div className="setting-group">
          <label>Email Notifications</label>
          <div className="toggle-switch">
            <input type="checkbox" checked={settings.emailNotifications} onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})} />
            <span className="toggle-slider"></span>
          </div>
        </div>
        <div className="setting-group">
          <label>Session Timeout (minutes)</label>
          <select value={settings.sessionTimeout} onChange={(e) => setSettings({...settings, sessionTimeout: e.target.value})}>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
          </select>
        </div>
        <div className="setting-group">
          <label>Dark Mode</label>
          <div className="toggle-switch">
            <input type="checkbox" checked={settings.darkMode} onChange={(e) => setSettings({...settings, darkMode: e.target.checked})} />
            <span className="toggle-slider"></span>
          </div>
        </div>
        <button className="save-settings-btn" onClick={handleSave}>Save Settings</button>
      </div>
    </div>
  )
}

export default Settings
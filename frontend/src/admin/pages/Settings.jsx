// frontend/src/admin/pages/Settings.jsx
import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import './Settings.css'

export default function Settings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    twoFactorAuth: false,
    dataRetentionDays: 30,
    language: 'en',
    darkMode: false,
    shareAnalytics: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings') // assumes endpoint exists
        setSettings(res.data)
      } catch (err) {
        console.error('Failed to load settings', err)
        // Use default settings if endpoint not ready
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setSettings({ ...settings, [e.target.name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await api.put('/admin/settings', settings)
      setMessage('Settings saved successfully')
      // Apply dark mode if toggled
      if (settings.darkMode) {
        document.body.classList.add('dark-mode')
      } else {
        document.body.classList.remove('dark-mode')
      }
    } catch (err) {
      setMessage('Error saving settings: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-container settings-container">Loading settings...</div>

  return (
    <div className="admin-container settings-container">
      <div className="admin-header">
        <h1>Settings</h1>
      </div>

      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="settings-section">
          <h3>Notifications</h3>
          <div className="form-group checkbox">
            <label>
              <input type="checkbox" name="emailNotifications" checked={settings.emailNotifications} onChange={handleChange} />
              Email Notifications
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>Security</h3>
          <div className="form-group checkbox">
            <label>
              <input type="checkbox" name="twoFactorAuth" checked={settings.twoFactorAuth} onChange={handleChange} />
              Two‑Factor Authentication
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>Data & Privacy</h3>
          <div className="form-group">
            <label>Data Retention (days)</label>
            <input type="number" name="dataRetentionDays" value={settings.dataRetentionDays} onChange={handleChange} min="7" max="365" step="1" />
          </div>
          <div className="form-group checkbox">
            <label>
              <input type="checkbox" name="shareAnalytics" checked={settings.shareAnalytics} onChange={handleChange} />
              Share anonymous usage analytics
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>Appearance</h3>
          <div className="form-group checkbox">
            <label>
              <input type="checkbox" name="darkMode" checked={settings.darkMode} onChange={handleChange} />
              Dark Mode
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>Language</h3>
          <div className="form-group">
            <select name="language" value={settings.language} onChange={handleChange}>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>

        <div className="form-buttons">
          <button type="submit" disabled={saving} className="btn-admin">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
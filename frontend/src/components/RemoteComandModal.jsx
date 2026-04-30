import React, { useState } from 'react'
import './RemoteCommandModal.css'

const RemoteCommandModal = ({ device, onClose, onSendCommand }) => {
  const [commandType, setCommandType] = useState('enable_data')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const commands = [
    { id: 'enable_data', name: 'Enable Mobile Data', icon: '📶', description: 'Turn on mobile data for live tracking' },
    { id: 'enable_wifi', name: 'Enable WiFi', icon: '📡', description: 'Turn on WiFi to improve location accuracy' },
    { id: 'enable_both', name: 'Enable Data + WiFi', icon: '🌐', description: 'Turn on both for best tracking' },
    { id: 'location_once', name: 'Get Location Once', icon: '📍', description: 'Get current location immediately' },
    { id: 'start_tracking', name: 'Start Live Tracking', icon: '🟢', description: 'Start continuous location updates' },
    { id: 'stop_tracking', name: 'Stop Tracking', icon: '🔴', description: 'Stop sending location updates' },
    { id: 'lock_device', name: 'Lock Device', icon: '🔒', description: 'Lock the device remotely (stolen mode)' },
    { id: 'prevent_factory_reset', name: 'Prevent Factory Reset', icon: '🛡️', description: 'Block factory reset from settings (requires Device Owner)' },
    { id: 'reinstall_app', name: 'Reinstall App After Reset', icon: '🔄', description: 'Ensure app survives factory reset' }
  ]

  const handleSendCommand = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const commandData = {
        deviceId: device.deviceId,
        commandType: commandType,
        timestamp: new Date().toISOString(),
        deviceName: device.name
      }
      
      const pendingCommands = JSON.parse(localStorage.getItem('pending_device_commands') || '[]')
      pendingCommands.push({
        ...commandData,
        id: Date.now().toString(),
        status: 'pending',
        sentAt: new Date().toISOString()
      })
      localStorage.setItem('pending_device_commands', JSON.stringify(pendingCommands))
      
      setMessage({ type: 'success', text: `Command sent to ${device.name}! The device will execute it when online.` })
      
      if (onSendCommand) {
        onSendCommand(commandData)
      }
      
      setTimeout(() => {
        onClose()
      }, 2000)
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send command. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Remote Command - {device.name}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="device-info">Device ID: {device.deviceId}</p>
          
          <div className="commands-list">
            {commands.map(cmd => (
              <div 
                key={cmd.id}
                className={`command-option ${commandType === cmd.id ? 'selected' : ''}`}
                onClick={() => setCommandType(cmd.id)}
              >
                <div className="command-icon">{cmd.icon}</div>
                <div className="command-info">
                  <h4>{cmd.name}</h4>
                  <p>{cmd.description}</p>
                </div>
                <div className="command-radio">
                  <input type="radio" checked={commandType === cmd.id} readOnly />
                </div>
              </div>
            ))}
          </div>
          
          <div className="command-note">
            <p>⚠️ Note: Commands will be executed when the device is online. The device will attempt to connect regardless of current data/WiFi status.</p>
          </div>
          
          {message && (
            <div className={`command-message ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="send-btn" onClick={handleSendCommand} disabled={loading}>
            {loading ? 'Sending...' : 'Send Command'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RemoteCommandModal
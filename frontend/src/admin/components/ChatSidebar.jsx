import React from 'react'
import './ChatSidebar.css'

const ChatSidebar = ({ clients, activeChat, onSelectChat }) => {
  return (
    <div className="chat-sidebar">
      <div className="sidebar-header">
        <h4>Active Clients</h4>
      </div>
      <div className="client-list">
        {clients.map(client => (
          <div
            key={client.id}
            className={`client-item ${activeChat?.id === client.id ? 'active' : ''}`}
            onClick={() => onSelectChat(client)}
          >
            <div className="client-avatar">
              {client.name.charAt(0)}
            </div>
            <div className="client-info">
              <div className="client-name">{client.name}</div>
              <div className="client-email">{client.email}</div>
            </div>
            {client.unread > 0 && (
              <div className="unread-badge">{client.unread}</div>
            )}
            <div className={`client-status ${client.online ? 'online-dot' : 'offline-dot'}`} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChatSidebar
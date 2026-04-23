import React from 'react'
import './ChatMessage.css'

const ChatMessage = ({ message }) => {
  const isAdmin = message.from === 'admin'

  return (
    <div className={`message-wrapper ${isAdmin ? 'admin' : 'client'}`}>
      <div className="message-bubble">
        <div className="message-text">{message.text}</div>
        <div className="message-time">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

export default ChatMessage
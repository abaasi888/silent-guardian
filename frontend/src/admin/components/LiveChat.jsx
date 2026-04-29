import React, { useState, useEffect, useRef } from 'react'
import '../admin.css'

const LiveChat = () => {
  const [messages, setMessages] = useState([
    { id: 1, from: 'user', text: 'Hello, I need help with tracking', timestamp: new Date(Date.now() - 3600000) },
    { id: 2, from: 'admin', text: 'Sure, how can I assist you?', timestamp: new Date(Date.now() - 3500000) }
  ])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!newMessage.trim()) return
    const message = {
      id: messages.length + 1,
      from: 'admin',
      text: newMessage,
      timestamp: new Date()
    }
    setMessages([...messages, message])
    setNewMessage('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage()
  }

  return (
    <div className="admin-chat-container">
      <div className="chat-header">
        <h3>Live Support Chat</h3>
        <span className="online-status">● Online</span>
      </div>
      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-message ${msg.from}`}>
            <div className="message-bubble">
              <div className="message-text">{msg.text}</div>
              <div className="message-time">{new Date(msg.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input">
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  )
}

export default LiveChat
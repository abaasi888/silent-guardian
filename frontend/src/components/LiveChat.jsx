import React, { useState, useEffect, useRef } from 'react'
import './LiveChat.css'

const LiveChat = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef(null)

  // Sample initial messages
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 1,
          sender: 'admin',
          text: 'Hello! How can we help you today?',
          time: new Date().toLocaleTimeString(),
          isAdmin: true
        },
        {
          id: 2,
          sender: 'system',
          text: 'Support team is online. Typical response time: 2-5 minutes.',
          time: new Date().toLocaleTimeString(),
          isSystem: true
        }
      ])
    }
  }, [isOpen])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!newMessage.trim()) return

    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: newMessage,
      time: new Date().toLocaleTimeString(),
      isUser: true
    }

    setMessages(prev => [...prev, userMessage])
    setNewMessage('')
    setIsTyping(true)

    // Simulate admin response after 2 seconds
    setTimeout(() => {
      const adminResponse = {
        id: messages.length + 2,
        sender: 'admin',
        text: 'Thank you for your message. Our support team will assist you shortly.',
        time: new Date().toLocaleTimeString(),
        isAdmin: true
      }
      setMessages(prev => [...prev, adminResponse])
      setIsTyping(false)
    }, 2000)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage()
    }
  }

  const closeChat = () => {
    setIsMinimized(false)
    onClose()
  }

  const minimizeChat = () => {
    setIsMinimized(true)
  }

  const maximizeChat = () => {
    setIsMinimized(false)
  }

  const endChat = () => {
    if (window.confirm('Are you sure you want to end this chat session?')) {
      setMessages([
        {
          id: Date.now(),
          sender: 'system',
          text: 'Chat session ended. Click the chat button to start a new session.',
          time: new Date().toLocaleTimeString(),
          isSystem: true
        }
      ])
      setTimeout(() => {
        closeChat()
      }, 2000)
    }
  }

  if (!isOpen) return null

  return (
    <div className={`chat-window-nav ${isMinimized ? 'minimized' : ''}`}>
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar">👨‍💻</div>
          <div className="chat-header-text">
            <h3>Silent Guardian Support</h3>
            <p>Online • Usually replies in 2-5 mins</p>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="chat-minimize-btn" onClick={minimizeChat}>
            ━
          </button>
          <button className="chat-close-btn" onClick={closeChat}>
            ✕
          </button>
        </div>
      </div>

      {/* Chat Body (only shown if not minimized) */}
      {!isMinimized && (
        <>
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.isAdmin ? 'admin' : msg.isUser ? 'user' : 'system'}`}>
                {msg.isAdmin && <div className="message-avatar">👨‍💻</div>}
                {msg.isUser && <div className="message-avatar user-avatar">👤</div>}
                <div className="message-bubble">
                  <div className="message-text">{msg.text}</div>
                  <div className="message-time">{msg.time}</div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-message admin">
                <div className="message-avatar">👨‍💻</div>
                <div className="message-bubble typing">
                  <span>.</span><span>.</span><span>.</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button onClick={sendMessage} disabled={!newMessage.trim()}>
              Send
            </button>
          </div>

          <div className="chat-footer">
            <button className="end-chat-btn" onClick={endChat}>
              End Chat
            </button>
          </div>
        </>
      )}

      {/* Minimized view */}
      {isMinimized && (
        <div className="chat-minimized" onClick={maximizeChat}>
          <div className="chat-minimized-content">
            <div className="chat-minimized-icon">💬</div>
            <div className="chat-minimized-text">
              <span>Silent Guardian Support</span>
              <small>Click to resume chat</small>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveChat
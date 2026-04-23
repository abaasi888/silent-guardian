import React, { useState, useEffect, useRef } from 'react'
import ChatSidebar from './ChatSidebar'
import ChatMessage from './ChatMessage'
import './LiveChat.css'

const LiveChat = () => {
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [clients, setClients] = useState([])
  const [socket, setSocket] = useState(null)
  const messagesEndRef = useRef(null)

  // Mock clients (replace with real API call)
  const mockClients = [
    { id: 'user1', name: 'John Doe', email: 'john@example.com', online: true, unread: 2 },
    { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', online: false, unread: 0 },
    { id: 'user3', name: 'Bob Johnson', email: 'bob@example.com', online: true, unread: 5 },
  ]

  // Mock messages (replace with real API / WebSocket)
  const mockMessages = {
    user1: [
      { id: 1, from: 'client', text: 'Hello, I need help with tracking', timestamp: new Date(Date.now() - 3600000) },
      { id: 2, from: 'admin', text: 'Sure, how can I assist?', timestamp: new Date(Date.now() - 3500000) },
      { id: 3, from: 'client', text: 'My device was stolen', timestamp: new Date(Date.now() - 3400000) },
    ],
    user2: [
      { id: 1, from: 'client', text: 'KYC not approved yet', timestamp: new Date(Date.now() - 86400000) },
    ],
    user3: [
      { id: 1, from: 'client', text: 'Subscription expired', timestamp: new Date(Date.now() - 7200000) },
    ],
  }

  useEffect(() => {
    // Load clients (from API or mock)
    setClients(mockClients)

    // Initialize WebSocket (replace with real backend URL)
    const ws = new WebSocket('ws://localhost:5000/ws/chat')
    ws.onopen = () => console.log('Chat WebSocket connected')
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      // Handle incoming message
      if (data.from && data.message) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          from: 'client',
          text: data.message,
          timestamp: new Date()
        }])
      }
    }
    ws.onerror = (error) => console.error('WebSocket error:', error)
    setSocket(ws)

    return () => ws.close()
  }, [])

  useEffect(() => {
    // Load messages when active chat changes
    if (activeChat && mockMessages[activeChat.id]) {
      setMessages(mockMessages[activeChat.id])
    } else {
      setMessages([])
    }
  }, [activeChat])

  useEffect(() => {
    // Scroll to bottom when new message arrives
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!inputMessage.trim() || !activeChat || !socket) return

    const newMessage = {
      id: Date.now(),
      from: 'admin',
      text: inputMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])

    // Send via WebSocket
    socket.send(JSON.stringify({
      to: activeChat.id,
      message: inputMessage
    }))

    setInputMessage('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage()
  }

  return (
    <div className="live-chat-container">
      <ChatSidebar
        clients={clients}
        activeChat={activeChat}
        onSelectChat={setActiveChat}
      />
      <div className="chat-main">
        {activeChat ? (
          <>
            <div className="chat-header">
              <h3>Chat with {activeChat.name}</h3>
              <span className={`online-status ${activeChat.online ? 'online' : 'offline'}`}>
                {activeChat.online ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="chat-messages">
              {messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-area">
              <input
                type="text"
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Select a client to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LiveChat
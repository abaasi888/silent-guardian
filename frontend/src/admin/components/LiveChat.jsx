import React, { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import ChatSidebar from './ChatSidebar'
import ChatMessage from './ChatMessage'
import './LiveChat.css'

const LiveChat = () => {
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [organisations, setOrganisations] = useState([])
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const pollingRef = useRef(null)

  // Get current admin user
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
  const adminId = currentUser.id || 'admin1'

  // Load all organisations (corporate clients)
  const loadOrganisations = async () => {
    try {
      const res = await api.get('/admin/organisations')
      // Map organisations to client format expected by ChatSidebar
      const clients = res.data.map(org => ({
        id: org.id,
        name: org.name,
        email: org.name, // placeholder
        online: true,   // mock: assume always online for demo
        unread: 0       // we won't track unread for now
      }))
      setOrganisations(clients)
    } catch (err) {
      console.error('Failed to load organisations', err)
    } finally {
      setLoading(false)
    }
  }

  // Load messages for the selected organisation
  const loadMessages = async (orgId) => {
    if (!orgId) return
    try {
      const res = await api.get(`/chat/messages/${orgId}`)
      // Convert stored messages to format expected by ChatMessage
      const formattedMessages = res.data.map((msg, idx) => ({
        id: idx,
        from: msg.senderId === adminId ? 'admin' : 'client',
        text: msg.message,
        timestamp: new Date(msg.timestamp)
      }))
      setMessages(formattedMessages)
    } catch (err) {
      console.error('Failed to load messages', err)
    }
  }

  // Send a message to the selected organisation
  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeChat) return

    const newMessage = {
      organisationId: activeChat.id,
      message: inputMessage,
      senderId: adminId
    }

    // Optimistically add to UI
    const tempMsg = {
      id: Date.now(),
      from: 'admin',
      text: inputMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, tempMsg])
    setInputMessage('')

    try {
      await api.post('/chat/messages', newMessage)
      // Reload messages to get the server-stored version (optional, but ensures consistency)
      await loadMessages(activeChat.id)
    } catch (err) {
      console.error('Failed to send message', err)
      // Optionally show error and remove optimistic message
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage()
  }

  // Poll for new messages every 3 seconds when a chat is active
  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id)
      pollingRef.current = setInterval(() => {
        loadMessages(activeChat.id)
      }, 3000)
      return () => clearInterval(pollingRef.current)
    }
  }, [activeChat])

  // Initial load of organisations
  useEffect(() => {
    loadOrganisations()
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) return <div className="live-chat-loading">Loading chats...</div>

  return (
    <div className="live-chat-container">
      <ChatSidebar
        clients={organisations}
        activeChat={activeChat}
        onSelectChat={setActiveChat}
      />
      <div className="chat-main">
        {activeChat ? (
          <>
            <div className="chat-header">
              <h3>Chat with {activeChat.name}</h3>
              <span className="online-status online">Online</span>
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
            <p>Select a corporate organisation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LiveChat
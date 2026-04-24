import React, { useState, useEffect } from 'react'
import api from '../services/api'

export default function CorporateChat() {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
  const organisationId = currentUser.organisationId || (currentUser.accountType === 'corporate' ? currentUser.id : null)

  useEffect(() => {
    if (organisationId) loadMessages()
  }, [organisationId])

  const loadMessages = async () => {
    const res = await api.get(`/chat/messages/${organisationId}`)
    setMessages(res.data)
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    await api.post('/chat/messages', {
      organisationId: organisationId,
      message: newMessage,
      senderId: currentUser.id
    })
    setNewMessage('')
    loadMessages()
  }

  return (
    <div className="corporate-chat">
      <h2>Chat with Silent Guardian Admin</h2>
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`msg ${msg.senderId === currentUser.id ? 'org' : 'admin'}`}>
            <strong>{msg.senderId === currentUser.id ? 'You' : 'Admin'}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <div>
        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  )
}
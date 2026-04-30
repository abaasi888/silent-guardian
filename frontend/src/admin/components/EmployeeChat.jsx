import React, { useState, useEffect, useRef } from 'react'
import '../admin.css'

const EmployeeChat = () => {
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [typing, setTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState(null)
  const [onlineStatus, setOnlineStatus] = useState({})
  const [unreadCounts, setUnreadCounts] = useState({})
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadEmployees()
    loadOnlineStatuses()
    const interval = setInterval(() => {
      if (selectedEmployee) loadMessages(selectedEmployee.id)
    }, 3000)
    return () => clearInterval(interval)
  }, [selectedEmployee])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadEmployees = () => {
    const savedEmployees = JSON.parse(localStorage.getItem('sg_employees') || '[]')
    const filteredEmployees = savedEmployees.filter(e => e.role !== 'Super Admin' && e.role !== 'Admin')
    setEmployees(filteredEmployees)
    
    const unread = {}
    filteredEmployees.forEach(emp => {
      const chatKey = `chat_admin_${emp.id}`
      const savedMessages = JSON.parse(localStorage.getItem(chatKey) || '[]')
      const unreadCount = savedMessages.filter(msg => msg.from === 'employee' && !msg.read).length
      unread[emp.id] = unreadCount
    })
    setUnreadCounts(unread)
  }

  const loadOnlineStatuses = () => {
    const statuses = {}
    employees.forEach(emp => {
      const lastActive = localStorage.getItem(`employee_last_active_${emp.id}`)
      if (lastActive) {
        const diff = Date.now() - parseInt(lastActive)
        statuses[emp.id] = diff < 60000
      } else {
        statuses[emp.id] = false
      }
    })
    setOnlineStatus(statuses)
    setTimeout(loadOnlineStatuses, 30000)
  }

  const loadMessages = (employeeId) => {
    if (!employeeId) return
    const chatKey = `chat_admin_${employeeId}`
    const savedMessages = JSON.parse(localStorage.getItem(chatKey) || '[]')
    setMessages(savedMessages)
    
    const updatedMessages = savedMessages.map(msg => 
      msg.from === 'employee' && !msg.read ? { ...msg, read: true } : msg
    )
    localStorage.setItem(chatKey, JSON.stringify(updatedMessages))
    setUnreadCounts(prev => ({ ...prev, [employeeId]: 0 }))
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedEmployee) return
    
    const message = {
      id: Date.now(),
      from: 'admin',
      text: newMessage,
      timestamp: new Date().toISOString(),
      read: false
    }
    
    const chatKey = `chat_admin_${selectedEmployee.id}`
    const existingMessages = JSON.parse(localStorage.getItem(chatKey) || '[]')
    const updatedMessages = [...existingMessages, message]
    localStorage.setItem(chatKey, JSON.stringify(updatedMessages))
    
    setMessages(updatedMessages)
    setNewMessage('')
    localStorage.setItem('sg_chat_trigger', Date.now().toString())
  }

  const handleTyping = () => {
    if (typingTimeout) clearTimeout(typingTimeout)
    setTyping(true)
    setTypingTimeout(setTimeout(() => setTyping(false), 1000))
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString()
  }

  return (
    <div className="employee-chat-container">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h3>Employees</h3>
        </div>
        <div className="employee-list">
          {employees.map(emp => (
            <div 
              key={emp.id}
              className={`employee-item ${selectedEmployee?.id === emp.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedEmployee(emp)
                loadMessages(emp.id)
              }}
            >
              <div className="employee-avatar">
                {emp.name.charAt(0)}
              </div>
              <div className="employee-info">
                <div className="employee-name">{emp.name}</div>
                <div className="employee-role">{emp.role}</div>
              </div>
              <div className={`online-status ${onlineStatus[emp.id] ? 'online' : 'offline'}`}></div>
              {unreadCounts[emp.id] > 0 && (
                <div className="unread-badge">{unreadCounts[emp.id]}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        {selectedEmployee ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="employee-avatar large">
                  {selectedEmployee.name.charAt(0)}
                </div>
                <div>
                  <h3>{selectedEmployee.name}</h3>
                  <p className={`chat-status ${onlineStatus[selectedEmployee.id] ? 'online' : 'offline'}`}>
                    {onlineStatus[selectedEmployee.id] ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>

            <div className="chat-messages-area">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages yet. Start a conversation with {selectedEmployee.name}.</p>
                </div>
              ) : (
                <>
                  {(() => {
                    let lastDate = ''
                    return messages.map((msg, idx) => {
                      const currentDate = formatDate(msg.timestamp)
                      const showDate = currentDate !== lastDate
                      lastDate = currentDate
                      return (
                        <React.Fragment key={msg.id}>
                          {showDate && <div className="chat-date-divider">{currentDate}</div>}
                          <div className={`chat-message ${msg.from === 'admin' ? 'admin' : 'employee'}`}>
                            <div className="message-bubble">
                              <div className="message-text">{msg.text}</div>
                              <div className="message-time">{formatTime(msg.timestamp)}</div>
                              {msg.from === 'employee' && msg.read && <span className="read-status">✓✓</span>}
                            </div>
                          </div>
                        </React.Fragment>
                      )
                    })
                  })()}
                </>
              )}
              {typing && (
                <div className="typing-indicator">
                  <span>Admin is typing</span>
                  <span>.</span><span>.</span><span>.</span>
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
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                onKeyDown={handleTyping}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Select an employee to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmployeeChat
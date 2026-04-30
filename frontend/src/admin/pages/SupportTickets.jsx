import React, { useState, useEffect } from 'react'
import '../admin.css'

const SupportTickets = () => {
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = () => {
    const savedTickets = JSON.parse(localStorage.getItem('sg_tickets') || '[]')
    if (savedTickets.length === 0) {
      const mockTickets = [
        { id: 1, subject: 'Device not tracking', user: 'john@example.com', priority: 'high', status: 'open', createdAt: '2024-01-15', lastUpdate: '2024-01-15', messages: [{ from: 'user', message: 'My device is not showing location', time: '2024-01-15 10:00' }] },
        { id: 2, subject: 'Billing question', user: 'sarah@example.com', priority: 'medium', status: 'in-progress', createdAt: '2024-01-14', lastUpdate: '2024-01-15', messages: [{ from: 'user', message: 'I was charged twice', time: '2024-01-14 15:30' }, { from: 'admin', message: 'We are looking into this', time: '2024-01-15 09:00' }] },
        { id: 3, subject: 'KYC approval delay', user: 'mike@example.com', priority: 'low', status: 'closed', createdAt: '2024-01-10', lastUpdate: '2024-01-12', messages: [{ from: 'user', message: 'KYC pending for 5 days', time: '2024-01-10 09:00' }, { from: 'admin', message: 'Approved', time: '2024-01-12 14:00' }] }
      ]
      localStorage.setItem('sg_tickets', JSON.stringify(mockTickets))
      setTickets(mockTickets)
    } else {
      setTickets(savedTickets)
    }
    setLoading(false)
  }

  const updateTicketStatus = (ticketId, newStatus) => {
    const updatedTickets = tickets.map(t => t.id === ticketId ? { ...t, status: newStatus, lastUpdate: new Date().toISOString().split('T')[0] } : t)
    setTickets(updatedTickets)
    localStorage.setItem('sg_tickets', JSON.stringify(updatedTickets))
  }

  const sendReply = () => {
    if (!replyMessage.trim() || !selectedTicket) return
    const updatedTickets = tickets.map(t => t.id === selectedTicket.id ? {
      ...t,
      status: 'in-progress',
      lastUpdate: new Date().toISOString().split('T')[0],
      messages: [...t.messages, { from: 'admin', message: replyMessage, time: new Date().toLocaleString() }]
    } : t)
    setTickets(updatedTickets)
    localStorage.setItem('sg_tickets', JSON.stringify(updatedTickets))
    setSelectedTicket(updatedTickets.find(t => t.id === selectedTicket.id))
    setReplyMessage('')
  }

  const getPriorityBadge = (priority) => {
    const classes = { high: 'priority-high', medium: 'priority-medium', low: 'priority-low' }
    return <span className={`priority-badge ${classes[priority]}`}>{priority.toUpperCase()}</span>
  }

  const filteredTickets = statusFilter === 'all' ? tickets : tickets.filter(t => t.status === statusFilter)

  if (loading) return <div className="admin-loading">Loading tickets...</div>

  return (
    <div className="admin-container">
      <div className="admin-header"><h1>Support Tickets</h1></div>
      
      <div className="ticket-filters">
        <button className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All</button>
        <button className={`filter-btn ${statusFilter === 'open' ? 'active' : ''}`} onClick={() => setStatusFilter('open')}>Open</button>
        <button className={`filter-btn ${statusFilter === 'in-progress' ? 'active' : ''}`} onClick={() => setStatusFilter('in-progress')}>In Progress</button>
        <button className={`filter-btn ${statusFilter === 'closed' ? 'active' : ''}`} onClick={() => setStatusFilter('closed')}>Closed</button>
      </div>

      <div className="tickets-layout">
        <div className="tickets-list">
          {filteredTickets.map(ticket => (
            <div key={ticket.id} className={`ticket-item ${selectedTicket?.id === ticket.id ? 'active' : ''} ${ticket.status}`} onClick={() => setSelectedTicket(ticket)}>
              <div className="ticket-subject">{ticket.subject}</div>
              <div className="ticket-meta"><span>{ticket.user}</span>{getPriorityBadge(ticket.priority)}<span className={`status-${ticket.status}`}>{ticket.status}</span></div>
            </div>
          ))}
        </div>

        <div className="ticket-detail">
          {selectedTicket ? (
            <>
              <div className="ticket-detail-header"><h3>{selectedTicket.subject}</h3><div className="ticket-actions"><select value={selectedTicket.status} onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}><option value="open">Open</option><option value="in-progress">In Progress</option><option value="closed">Closed</option></select></div></div>
              <div className="ticket-messages">
                {selectedTicket.messages.map((msg, idx) => (<div key={idx} className={`message ${msg.from}`}><div className="message-bubble"><strong>{msg.from === 'admin' ? 'Support Team' : selectedTicket.user}</strong><p>{msg.message}</p><small>{msg.time}</small></div></div>))}
              </div>
              {selectedTicket.status !== 'closed' && (<div className="ticket-reply"><textarea placeholder="Type your reply..." value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} rows="3" /><button onClick={sendReply}>Send Reply</button></div>)}
            </>
          ) : (<div className="no-ticket-selected"><p>Select a ticket to view details</p></div>)}
        </div>
      </div>
    </div>
  )
}

export default SupportTickets
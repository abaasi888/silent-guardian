import React, { useState, useEffect } from 'react'
import '../admin.css'

const ImeiBlacklist = () => {
    const [blacklistedImes, setBlacklistedImes] = useState([])
    const [newImei, setNewImei] = useState('')
    const [newReason, setNewReason] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState(null)

    useEffect(() => {
        loadBlacklist()
    }, [])

    const loadBlacklist = () => {
        const stored = localStorage.getItem('imei_blacklist')
        if (stored) {
            setBlacklistedImes(JSON.parse(stored))
        } else {
            // Mock data for demo
            const mockData = [
                { id: 1, imei: '354987123456789', reason: 'Reported stolen', reportedBy: 'john@example.com', date: '2024-01-15', status: 'active' },
                { id: 2, imei: '351234567890123', reason: 'Lost device', reportedBy: 'sarah@example.com', date: '2024-01-10', status: 'active' }
            ]
            setBlacklistedImes(mockData)
            localStorage.setItem('imei_blacklist', JSON.stringify(mockData))
        }
        setLoading(false)
    }

    const addToBlacklist = () => {
        if (!newImei || newImei.length < 15) {
            setMessage({ type: 'error', text: 'Enter a valid IMEI number (15 digits)' })
            return
        }

        const newEntry = {
            id: Date.now(),
            imei: newImei,
            reason: newReason || 'Stolen device',
            reportedBy: localStorage.getItem('userEmail') || 'admin',
            date: new Date().toISOString().split('T')[0],
            status: 'active'
        }

        const updated = [...blacklistedImes, newEntry]
        setBlacklistedImes(updated)
        localStorage.setItem('imei_blacklist', JSON.stringify(updated))
        setNewImei('')
        setNewReason('')
        setMessage({ type: 'success', text: 'IMEI added to blacklist!' })
        setTimeout(() => setMessage(null), 3000)
    }

    const removeFromBlacklist = (id) => {
        if (window.confirm('Remove this IMEI from blacklist?')) {
            const updated = blacklistedImes.filter(item => item.id !== id)
            setBlacklistedImes(updated)
            localStorage.setItem('imei_blacklist', JSON.stringify(updated))
            setMessage({ type: 'success', text: 'IMEI removed from blacklist' })
            setTimeout(() => setMessage(null), 3000)
        }
    }

    const filteredList = blacklistedImes.filter(item =>
        item.imei.includes(searchTerm) ||
        item.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reportedBy.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) return <div className="admin-loading">Loading blacklist...</div>

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>IMEI Blacklist Management</h1>
            </div>

            {message && (
                <div className={`message-banner ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="blacklist-add-section">
                <h2>Add IMEI to Blacklist</h2>
                <div className="form-row">
                    <input 
                        type="text" 
                        placeholder="IMEI Number (15 digits)" 
                        value={newImei}
                        onChange={(e) => setNewImei(e.target.value)} 
                        className="form-input" 
                    />
                    <input 
                        type="text" 
                        placeholder="Reason (stolen/lost/fraud)" 
                        value={newReason}
                        onChange={(e) => setNewReason(e.target.value)} 
                        className="form-input" 
                    />
                    <button className="add-blacklist-btn" onClick={addToBlacklist}>+ Add to Blacklist</button>
                </div>
            </div>

            <div className="search-section">
                <input 
                    type="text" 
                    placeholder="Search IMEI, reason, or reporter..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="search-input" 
                />
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>IMEI Number</th>
                            <th>Reason</th>
                            <th>Reported By</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredList.map(item => (
                            <tr key={item.id}>
                                <td><code>{item.imei}</code></td>
                                <td>{item.reason}</td>
                                <td>{item.reportedBy}</td>
                                <td>{item.date}</td>
                                <td>
                                    <span className={`status-badge ${item.status}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td>
                                    <button 
                                        className="delete-btn" 
                                        onClick={() => removeFromBlacklist(item.id)}
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="info-box">
                <h3>How IMEI Blacklist Works</h3>
                <ul>
                    <li>When a device is reported stolen, its IMEI is added to the blacklist</li>
                    <li>The tracking app checks the IMEI against the blacklist on startup</li>
                    <li>If blacklisted, the device automatically locks and reports its location</li>
                    <li>Police can use the IMEI to identify stolen devices</li>
                    <li>Removing from blacklist requires admin verification</li>
                </ul>
            </div>
        </div>
    )
}

export default ImeiBlacklist
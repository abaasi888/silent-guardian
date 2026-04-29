import React, { useState, useEffect } from 'react'
import '../admin.css'

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showCommissionModal, setShowCommissionModal] = useState(false)
  const [showSignupsModal, setShowSignupsModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newEmployee, setNewEmployee] = useState({ 
    name: '', 
    email: '', 
    role: 'Support Agent',
    phone: '',
    commissionRate: 30
  })
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalSignups: 0,
    totalRevenue: 0,
    totalCommissions: 0,
    monthlySignups: 0,
    monthlyRevenue: 0,
    monthlyCommissions: 0
  })

  useEffect(() => {
    loadEmployees()
    loadStats()
  }, [])

  const loadEmployees = () => {
    const savedEmployees = localStorage.getItem('sg_employees')
    if (savedEmployees) {
      setEmployees(JSON.parse(savedEmployees))
    } else {
      const mockEmployees = [
        { 
          id: 1, 
          name: 'John Doe', 
          email: 'john@silentguardian.com', 
          role: 'Super Admin', 
          status: 'active', 
          phone: '+1 234 567 8900',
          commissionRate: 30,
          joinDate: '2024-01-01',
          signups: [
            { userId: 'user1', plan: 'Premium', amount: 9.99, date: '2024-01-15', status: 'active' },
            { userId: 'user2', plan: 'Basic', amount: 4.99, date: '2024-01-20', status: 'active' }
          ],
          totalCommission: 44.94,
          lastPayout: '2024-01-31'
        },
        { 
          id: 2, 
          name: 'Jane Smith', 
          email: 'jane@silentguardian.com', 
          role: 'Support Agent', 
          status: 'active',
          phone: '+1 234 567 8901',
          commissionRate: 30,
          joinDate: '2024-01-10',
          signups: [
            { userId: 'user3', plan: 'Premium', amount: 9.99, date: '2024-01-18', status: 'active' }
          ],
          totalCommission: 29.97,
          lastPayout: '2024-01-31'
        },
        { 
          id: 3, 
          name: 'Mike Johnson', 
          email: 'mike@silentguardian.com', 
          role: 'Support Agent', 
          status: 'inactive',
          phone: '+1 234 567 8902',
          commissionRate: 30,
          joinDate: '2024-01-05',
          signups: [],
          totalCommission: 0,
          lastPayout: '2024-01-31'
        }
      ]
      setEmployees(mockEmployees)
      localStorage.setItem('sg_employees', JSON.stringify(mockEmployees))
    }
  }

  const loadStats = () => {
    const savedEmployees = localStorage.getItem('sg_employees')
    if (savedEmployees) {
      const empList = JSON.parse(savedEmployees)
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      let totalSignups = 0
      let totalRevenue = 0
      let totalCommissions = 0
      let monthlySignups = 0
      let monthlyRevenue = 0
      let monthlyCommissions = 0
      
      empList.forEach(emp => {
        emp.signups.forEach(signup => {
          totalSignups++
          totalRevenue += signup.amount
          totalCommissions += (signup.amount * emp.commissionRate / 100)
          
          const signupDate = new Date(signup.date)
          if (signupDate.getMonth() === currentMonth && signupDate.getFullYear() === currentYear) {
            monthlySignups++
            monthlyRevenue += signup.amount
            monthlyCommissions += (signup.amount * emp.commissionRate / 100)
          }
        })
      })
      
      setStats({
        totalEmployees: empList.length,
        totalSignups,
        totalRevenue,
        totalCommissions,
        monthlySignups,
        monthlyRevenue,
        monthlyCommissions
      })
    }
  }

  const addEmployee = () => {
    if (!newEmployee.name || !newEmployee.email) {
      alert('Please fill all fields')
      return
    }
    const employee = {
      id: employees.length + 1,
      ...newEmployee,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0],
      signups: [],
      totalCommission: 0,
      lastPayout: new Date().toISOString().split('T')[0]
    }
    const updatedEmployees = [...employees, employee]
    setEmployees(updatedEmployees)
    localStorage.setItem('sg_employees', JSON.stringify(updatedEmployees))
    setShowAddModal(false)
    setNewEmployee({ name: '', email: '', role: 'Support Agent', phone: '', commissionRate: 30 })
    loadStats()
    alert('Employee added successfully!')
  }

  const toggleStatus = (id) => {
    const updatedEmployees = employees.map(emp => 
      emp.id === id ? { ...emp, status: emp.status === 'active' ? 'inactive' : 'active' } : emp
    )
    setEmployees(updatedEmployees)
    localStorage.setItem('sg_employees', JSON.stringify(updatedEmployees))
  }

  const deleteEmployee = (id) => {
    if (window.confirm('Remove this employee?')) {
      const updatedEmployees = employees.filter(emp => emp.id !== id)
      setEmployees(updatedEmployees)
      localStorage.setItem('sg_employees', JSON.stringify(updatedEmployees))
      loadStats()
      alert('Employee removed successfully!')
    }
  }

  const viewCommissions = (employee) => {
    setSelectedEmployee(employee)
    setShowCommissionModal(true)
  }

  const viewSignups = (employee) => {
    setSelectedEmployee(employee)
    setShowSignupsModal(true)
  }

  const processPayout = (employeeId) => {
    const updatedEmployees = employees.map(emp => {
      if (emp.id === employeeId) {
        const payoutAmount = emp.totalCommission
        emp.lastPayout = new Date().toISOString().split('T')[0]
        emp.totalCommission = 0
        emp.signups = []
        alert(`Payout of $${payoutAmount.toFixed(2)} processed for ${emp.name}`)
      }
      return emp
    })
    setEmployees(updatedEmployees)
    localStorage.setItem('sg_employees', JSON.stringify(updatedEmployees))
    loadStats()
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Employee Management</h1>
        <button className="add-btn" onClick={() => setShowAddModal(true)}>+ Add Employee</button>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.totalEmployees}</h3>
            <p>Total Employees</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <h3>{stats.totalSignups}</h3>
            <p>Total Signups</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>{formatCurrency(stats.totalRevenue)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💸</div>
          <div className="stat-info">
            <h3>{formatCurrency(stats.totalCommissions)}</h3>
            <p>Total Commissions</p>
          </div>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="admin-section">
        <h2>This Month</h2>
        <div className="monthly-stats">
          <div className="monthly-stat">
            <span>📊 Signups</span>
            <strong>{stats.monthlySignups}</strong>
          </div>
          <div className="monthly-stat">
            <span>💰 Revenue</span>
            <strong>{formatCurrency(stats.monthlyRevenue)}</strong>
          </div>
          <div className="monthly-stat">
            <span>💸 Commissions</span>
            <strong>{formatCurrency(stats.monthlyCommissions)}</strong>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Signups</th>
              <th>Commission</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td>{emp.name}</td>
                <td>{emp.email}</td>
                <td>{emp.phone || '—'}</td>
                <td>{emp.role}</td>
                <td>{emp.signups.length}</td>
                <td>{formatCurrency(emp.totalCommission)}</td>
                <td><span className={`status-badge ${emp.status}`}>{emp.status}</span></td>
                <td className="action-cell">
                  <button className="view-btn" onClick={() => viewSignups(emp)}>📋 Signups</button>
                  <button className="commission-btn" onClick={() => viewCommissions(emp)}>💰 Commission</button>
                  <button className="toggle-btn" onClick={() => toggleStatus(emp.id)}>
                    {emp.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="delete-btn" onClick={() => deleteEmployee(emp.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Commission Modal */}
      {showCommissionModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowCommissionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Commission Details - {selectedEmployee.name}</h2>
              <button className="modal-close" onClick={() => setShowCommissionModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="commission-summary">
                <div className="summary-item">
                  <span>Commission Rate:</span>
                  <strong>{selectedEmployee.commissionRate}%</strong>
                </div>
                <div className="summary-item">
                  <span>Total Commission:</span>
                  <strong>{formatCurrency(selectedEmployee.totalCommission)}</strong>
                </div>
                <div className="summary-item">
                  <span>Last Payout:</span>
                  <strong>{selectedEmployee.lastPayout}</strong>
                </div>
              </div>
              
              <h3>Signup Breakdown</h3>
              <table className="commission-table">
                <thead>
                  <tr><th>User</th><th>Plan</th><th>Amount</th><th>Commission (30%)</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {selectedEmployee.signups.map((signup, idx) => (
                    <tr key={idx}>
                      <td>{signup.userId}</td>
                      <td>{signup.plan}</td>
                      <td>{formatCurrency(signup.amount)}</td>
                      <td>{formatCurrency(signup.amount * 0.3)}</td>
                      <td>{signup.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <button className="payout-btn" onClick={() => processPayout(selectedEmployee.id)}>
                Process Payout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signups Modal */}
      {showSignupsModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowSignupsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Signups - {selectedEmployee.name}</h2>
              <button className="modal-close" onClick={() => setShowSignupsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="signup-stats">
                <div className="stat-badge">
                  <span>Total Signups</span>
                  <strong>{selectedEmployee.signups.length}</strong>
                </div>
                <div className="stat-badge">
                  <span>Total Revenue</span>
                  <strong>{formatCurrency(selectedEmployee.signups.reduce((sum, s) => sum + s.amount, 0))}</strong>
                </div>
              </div>
              
              <table className="signup-table">
                <thead>
                  <tr><th>Date</th><th>User ID</th><th>Plan</th><th>Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {selectedEmployee.signups.map((signup, idx) => (
                    <tr key={idx}>
                      <td>{signup.date}</td>
                      <td>{signup.userId}</td>
                      <td>{signup.plan}</td>
                      <td>{formatCurrency(signup.amount)}</td>
                      <td><span className={`status-badge ${signup.status}`}>{signup.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Employee</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={newEmployee.name} onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={newEmployee.email} onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" value={newEmployee.phone} onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={newEmployee.role} onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Support Agent">Support Agent</option>
                  <option value="Sales Agent">Sales Agent</option>
                  <option value="Analyst">Analyst</option>
                </select>
              </div>
              <div className="form-group">
                <label>Commission Rate (%)</label>
                <input type="number" value={newEmployee.commissionRate} onChange={(e) => setNewEmployee({...newEmployee, commissionRate: parseInt(e.target.value)})} />
                <small>Default is 30% for all signups</small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="create-btn" onClick={addEmployee}>Add Employee</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeManagement
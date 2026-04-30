import React, { useState, useEffect } from 'react'
import '../admin.css'

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showCommissionModal, setShowCommissionModal] = useState(false)
  const [showSignupsModal, setShowSignupsModal] = useState(false)
  const [showSalaryModal, setShowSalaryModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newEmployee, setNewEmployee] = useState({ 
    name: '', 
    email: '', 
    role: 'Sales Agent',
    phone: '',
    commissionRate: 30,
    baseSalary: 0,
    employmentType: 'contractor'
  })
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalSignups: 0,
    totalRevenue: 0,
    totalCommissions: 0,
    monthlySignups: 0,
    monthlyRevenue: 0,
    monthlyCommissions: 0,
    permanentEmployees: 0,
    contractorEmployees: 0
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
          baseSalary: 0,
          employmentType: 'contractor',
          joinDate: '2023-01-15', // More than 1 year ago
          signups: [
            { userId: 'user1', plan: 'Premium', amount: 9.99, date: '2024-01-15', status: 'active' },
            { userId: 'user2', plan: 'Basic', amount: 4.99, date: '2024-01-20', status: 'active' }
          ],
          totalCommission: 44.94,
          totalSignups: 4200, // Over 4000 signups
          lastPayout: '2024-01-31',
          permanentEligible: true, // Both conditions met
          careerStage: 'contractor'
        },
        { 
          id: 2, 
          name: 'Jane Smith', 
          email: 'jane@silentguardian.com', 
          role: 'Sales Agent', 
          status: 'active',
          phone: '+1 234 567 8901',
          commissionRate: 30,
          baseSalary: 0,
          employmentType: 'contractor',
          joinDate: '2024-01-10', // Less than 1 year
          signups: [
            { userId: 'user3', plan: 'Premium', amount: 9.99, date: '2024-01-18', status: 'active' },
            { userId: 'user4', plan: 'Premium', amount: 9.99, date: '2024-01-22', status: 'active' },
            { userId: 'user5', plan: 'Basic', amount: 4.99, date: '2024-01-25', status: 'active' }
          ],
          totalCommission: 74.94,
          totalSignups: 3800, // Less than 4000
          lastPayout: '2024-01-31',
          permanentEligible: false, // Not enough signups AND not enough tenure
          careerStage: 'contractor'
        }
      ]
      setEmployees(mockEmployees)
      localStorage.setItem('sg_employees', JSON.stringify(mockEmployees))
    }
  }

  const loadStats = () => {
    const savedEmployees = JSON.parse(localStorage.getItem('sg_employees') || '[]')
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    let totalSignups = 0
    let totalRevenue = 0
    let totalCommissions = 0
    let monthlySignups = 0
    let monthlyRevenue = 0
    let monthlyCommissions = 0
    let permanentEmployees = 0
    let contractorEmployees = 0
    
    savedEmployees.forEach(emp => {
      if (emp.employmentType === 'permanent') permanentEmployees++
      else contractorEmployees++
      
      emp.signups.forEach(signup => {
        totalSignups++
        totalRevenue += signup.amount
        
        let commission = 0
        if (emp.employmentType === 'permanent' && emp.baseSalary > 0) {
          commission = signup.amount * 0.1
        } else {
          commission = signup.amount * (emp.commissionRate / 100)
        }
        totalCommissions += commission
        
        const signupDate = new Date(signup.date)
        if (signupDate.getMonth() === currentMonth && signupDate.getFullYear() === currentYear) {
          monthlySignups++
          monthlyRevenue += signup.amount
          monthlyCommissions += commission
        }
      })
      
      // Check if employee qualifies for permanent position (BOTH conditions)
      const hasRequiredSignups = emp.totalSignups >= 4000
      const hasRequiredTenure = calculateMonthsEmployed(emp.joinDate) >= 12
      const isEligible = hasRequiredSignups && hasRequiredTenure
      
      if (isEligible && emp.employmentType === 'contractor') {
        emp.permanentEligible = true
      }
    })
    
    setStats({
      totalEmployees: savedEmployees.length,
      totalSignups,
      totalRevenue,
      totalCommissions,
      monthlySignups,
      monthlyRevenue,
      monthlyCommissions,
      permanentEmployees,
      contractorEmployees
    })
  }

  const calculateMonthsEmployed = (joinDate) => {
    const join = new Date(joinDate)
    const now = new Date()
    let months = (now.getFullYear() - join.getFullYear()) * 12
    months += now.getMonth() - join.getMonth()
    return months
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const addEmployee = () => {
    if (!newEmployee.name || !newEmployee.email) {
      alert('Please fill all fields')
      return
    }
    const employee = {
      id: employees.length + 1,
      name: newEmployee.name,
      email: newEmployee.email,
      phone: newEmployee.phone,
      role: newEmployee.role,
      commissionRate: newEmployee.commissionRate,
      baseSalary: newEmployee.employmentType === 'permanent' ? newEmployee.baseSalary : 0,
      employmentType: newEmployee.employmentType,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0],
      signups: [],
      totalCommission: 0,
      totalSignups: 0,
      lastPayout: new Date().toISOString().split('T')[0],
      permanentEligible: false,
      careerStage: newEmployee.employmentType === 'permanent' ? 'permanent' : 'contractor'
    }
    const updatedEmployees = [...employees, employee]
    setEmployees(updatedEmployees)
    localStorage.setItem('sg_employees', JSON.stringify(updatedEmployees))
    setShowAddModal(false)
    setNewEmployee({ name: '', email: '', role: 'Sales Agent', phone: '', commissionRate: 30, baseSalary: 0, employmentType: 'contractor' })
    loadStats()
    alert('Employee added successfully!')
  }

  const promoteToPermanent = (employeeId, baseSalary) => {
    const updatedEmployees = employees.map(emp => {
      if (emp.id === employeeId) {
        return {
          ...emp,
          employmentType: 'permanent',
          baseSalary: baseSalary,
          commissionRate: 10,
          careerStage: 'permanent',
          permanentEligible: false,
          promotionDate: new Date().toISOString().split('T')[0]
        }
      }
      return emp
    })
    setEmployees(updatedEmployees)
    localStorage.setItem('sg_employees', JSON.stringify(updatedEmployees))
    loadStats()
    alert('Employee promoted to permanent position!')
  }

  const updateSalary = (employeeId, newSalary) => {
    const updatedEmployees = employees.map(emp => {
      if (emp.id === employeeId) {
        return { ...emp, baseSalary: newSalary }
      }
      return emp
    })
    setEmployees(updatedEmployees)
    localStorage.setItem('sg_employees', JSON.stringify(updatedEmployees))
    alert(`Salary updated to $${newSalary}/month`)
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

  const handlePromotion = (employee) => {
    setSelectedEmployee(employee)
    setShowSalaryModal(true)
  }

  const confirmPromotion = () => {
    const salary = parseFloat(prompt(`Enter monthly salary for ${selectedEmployee.name}:`, '2000'))
    if (salary && salary > 0) {
      promoteToPermanent(selectedEmployee.id, salary)
      setShowSalaryModal(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const calculateMonthlyEarnings = (employee) => {
    let commission = 0
    employee.signups.forEach(signup => {
      if (employee.employmentType === 'permanent') {
        commission += signup.amount * 0.1
      } else {
        commission += signup.amount * (employee.commissionRate / 100)
      }
    })
    return employee.baseSalary + commission
  }

  const getProgressToPermanent = (employee) => {
    const signupProgress = (employee.totalSignups / 4000) * 100
    const tenureProgress = (calculateMonthsEmployed(employee.joinDate) / 12) * 100
    return {
      signups: Math.min(signupProgress, 100),
      tenure: Math.min(tenureProgress, 100),
      overall: Math.min((signupProgress + tenureProgress) / 2, 100)
    }
  }

  const getEligibilityStatus = (employee) => {
    const hasSignups = employee.totalSignups >= 4000
    const hasTenure = calculateMonthsEmployed(employee.joinDate) >= 12
    
    if (hasSignups && hasTenure) {
      return { eligible: true, message: '✅ Eligible for promotion!', color: '#4caf50' }
    } else if (!hasSignups && !hasTenure) {
      return { eligible: false, message: `Need ${4000 - employee.totalSignups} more signups and ${12 - calculateMonthsEmployed(employee.joinDate)} more months`, color: '#f44336' }
    } else if (!hasSignups) {
      return { eligible: false, message: `Need ${4000 - employee.totalSignups} more signups`, color: '#ff9800' }
    } else {
      return { eligible: false, message: `Need ${12 - calculateMonthsEmployed(employee.joinDate)} more months`, color: '#ff9800' }
    }
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Employee Management</h1>
        <button className="add-btn" onClick={() => setShowAddModal(true)}>+ Add Employee</button>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-info"><h3>{stats.totalEmployees}</h3><p>Total Employees</p></div></div>
        <div className="stat-card"><div className="stat-icon">📈</div><div className="stat-info"><h3>{stats.totalSignups}</h3><p>Total Signups</p></div></div>
        <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-info"><h3>{formatCurrency(stats.totalRevenue)}</h3><p>Total Revenue</p></div></div>
        <div className="stat-card"><div className="stat-icon">💸</div><div className="stat-info"><h3>{formatCurrency(stats.totalCommissions)}</h3><p>Total Commissions</p></div></div>
        <div className="stat-card"><div className="stat-icon">👨‍💼</div><div className="stat-info"><h3>{stats.permanentEmployees}</h3><p>Permanent</p></div></div>
        <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-info"><h3>{stats.contractorEmployees}</h3><p>Contractors</p></div></div>
      </div>

      {/* Career Progression Info */}
      <div className="career-info-section">
        <h2>Career Progression</h2>
        <div className="career-info-card">
          <div className="career-stage contractor">
            <h3>📋 Contractor</h3>
            <p>Requirements: Less than 4,000 signups OR less than 1 year</p>
            <p>Compensation: 30% commission per signup</p>
          </div>
          <div className="career-arrow">→</div>
          <div className="career-stage permanent">
            <h3>👨‍💼 Permanent Employee</h3>
            <p>Requirements: 4,000+ signups AND 1+ year of employment</p>
            <p>Compensation: Fixed monthly salary + 10% commission</p>
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
              <th>Type</th>
              <th>Signups / Month</th>
              <th>Tenure</th>
              <th>Commission</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const progress = getProgressToPermanent(emp)
              const eligibility = getEligibilityStatus(emp)
              const monthsEmployed = calculateMonthsEmployed(emp.joinDate)
              return (
                <tr key={emp.id}>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td><span className={`employment-badge ${emp.employmentType}`}>{emp.employmentType === 'permanent' ? '👨‍💼 Permanent' : '📋 Contractor'}</span></td>
                  <td>
                    <div className="progress-container-small">
                      <div className="progress-bar" style={{ width: `${progress.signups}%`, backgroundColor: '#ff9800' }}></div>
                      <span>{emp.totalSignups}/4,000</span>
                    </div>
                  </td>
                  <td>
                    <div className="progress-container-small">
                      <div className="progress-bar" style={{ width: `${progress.tenure}%`, backgroundColor: '#2196f3' }}></div>
                      <span>{monthsEmployed}/12 months</span>
                    </div>
                   </td>
                  <td>{formatCurrency(emp.totalCommission)}</td>
                  <td><span className={`status-badge ${emp.status}`}>{emp.status}</span></td>
                  <td className="action-cell">
                    <button className="view-btn" onClick={() => viewSignups(emp)}>📋 Signups</button>
                    <button className="commission-btn" onClick={() => viewCommissions(emp)}>💰 Commission</button>
                    {emp.permanentEligible && (
                      <button className="promote-btn" onClick={() => handlePromotion(emp)} title={eligibility.message}>🎉 Promote</button>
                    )}
                    {!emp.permanentEligible && emp.employmentType === 'contractor' && (
                      <span className="eligibility-status" style={{ fontSize: '0.7rem', color: eligibility.color }}>{eligibility.message}</span>
                    )}
                    {emp.employmentType === 'permanent' && (
                      <button className="salary-btn" onClick={() => updateSalary(emp.id, parseFloat(prompt('Enter new monthly salary:', emp.baseSalary)))}>💰 Salary</button>
                    )}
                    <button className="toggle-btn" onClick={() => toggleStatus(emp.id)}>{emp.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                    <button className="delete-btn" onClick={() => deleteEmployee(emp.id)}>Delete</button>
                   </td>
                 </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Add Employee</h2><button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label>Full Name</label><input type="text" value={newEmployee.name} onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})} /></div>
              <div className="form-group"><label>Email</label><input type="email" value={newEmployee.email} onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})} /></div>
              <div className="form-group"><label>Phone</label><input type="tel" value={newEmployee.phone} onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})} /></div>
              <div className="form-group"><label>Role</label><select value={newEmployee.role} onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}><option value="Sales Agent">Sales Agent</option><option value="Support Agent">Support Agent</option><option value="Super Admin">Super Admin</option></select></div>
              <div className="form-group"><label>Employment Type</label><select value={newEmployee.employmentType} onChange={(e) => setNewEmployee({...newEmployee, employmentType: e.target.value})}><option value="contractor">Contractor (30% commission)</option><option value="permanent">Permanent (Salary + Commission)</option></select></div>
              {newEmployee.employmentType === 'permanent' && (<div className="form-group"><label>Base Salary (Monthly)</label><input type="number" value={newEmployee.baseSalary} onChange={(e) => setNewEmployee({...newEmployee, baseSalary: parseInt(e.target.value)})} /></div>)}
              {newEmployee.employmentType === 'contractor' && (<div className="form-group"><label>Commission Rate (%)</label><input type="number" value={newEmployee.commissionRate} onChange={(e) => setNewEmployee({...newEmployee, commissionRate: parseInt(e.target.value)})} /></div>)}
              <div className="career-note"><strong>Career Progression:</strong> Contractors become eligible for permanent position after 4,000 signups AND 1 year of employment.</div>
            </div>
            <div className="modal-footer"><button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button><button className="create-btn" onClick={addEmployee}>Add Employee</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeManagement
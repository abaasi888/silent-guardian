package com.silentguardian.activities

import android.content.Context
import android.content.SharedPreferences
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import androidx.core.content.ContextCompat
import com.silentguardian.R
import com.silentguardian.adapters.SignupsAdapter
import com.silentguardian.models.Employee
import com.silentguardian.models.Signup
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import android.graphics.Color
import android.view.View
import android.widget.LinearLayout

class EmployeeDashboardActivity : AppCompatActivity() {

    private lateinit var sharedPreferences: SharedPreferences
    private lateinit var employee: Employee
    private lateinit var signupsAdapter: SignupsAdapter
    
    // UI Elements
    private lateinit var tvEmployeeName: TextView
    private lateinit var tvCareerStage: TextView
    private lateinit var tvProgressMessage: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var tvProgressPercent: TextView
    private lateinit var tvTotalSignups: TextView
    private lateinit var tvTotalCommission: TextView
    private lateinit var tvMonthlyEarnings: TextView
    private lateinit var tvBaseSalary: TextView
    private lateinit var tvCommissionRate: TextView
    private lateinit var cvSalaryCard: CardView
    private lateinit var lvSignups: ListView
    private lateinit var tvNoSignups: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_employee_dashboard)
        
        sharedPreferences = getSharedPreferences("sg_prefs", Context.MODE_PRIVATE)
        
        initViews()
        loadEmployeeData()
        setupCareerProgression()
        setupSignupsList()
    }
    
    private fun initViews() {
        tvEmployeeName = findViewById(R.id.tvEmployeeName)
        tvCareerStage = findViewById(R.id.tvCareerStage)
        tvProgressMessage = findViewById(R.id.tvProgressMessage)
        progressBar = findViewById(R.id.progressBar)
        tvProgressPercent = findViewById(R.id.tvProgressPercent)
        tvTotalSignups = findViewById(R.id.tvTotalSignups)
        tvTotalCommission = findViewById(R.id.tvTotalCommission)
        tvMonthlyEarnings = findViewById(R.id.tvMonthlyEarnings)
        tvBaseSalary = findViewById(R.id.tvBaseSalary)
        tvCommissionRate = findViewById(R.id.tvCommissionRate)
        cvSalaryCard = findViewById(R.id.cvSalaryCard)
        lvSignups = findViewById(R.id.lvSignups)
        tvNoSignups = findViewById(R.id.tvNoSignups)
    }
    
    private fun loadEmployeeData() {
        val employeeJson = sharedPreferences.getString("employee_data", "")
        if (employeeJson.isNotEmpty()) {
            val type = object : TypeToken<Employee>() {}.type
            employee = Gson().fromJson(employeeJson, type)
            
            tvEmployeeName.text = "Welcome, ${employee.name}!"
            
            // Set career stage
            if (employee.employmentType == "permanent") {
                tvCareerStage.text = "👨‍💼 Permanent Employee"
                tvCareerStage.setTextColor(ContextCompat.getColor(this, R.color.permanent_green))
                cvSalaryCard.visibility = View.VISIBLE
                tvBaseSalary.text = "$${employee.baseSalary}/month"
            } else {
                tvCareerStage.text = "📋 Contractor"
                tvCareerStage.setTextColor(ContextCompat.getColor(this, R.color.contractor_orange))
                cvSalaryCard.visibility = View.GONE
            }
            
            tvTotalSignups.text = employee.totalSignups.toString()
            tvTotalCommission.text = String.format("$%.2f", employee.totalCommission)
            tvCommissionRate.text = "${employee.commissionRate}%"
            
            // Calculate monthly earnings
            val monthlyEarnings = calculateMonthlyEarnings()
            tvMonthlyEarnings.text = String.format("$%.2f", monthlyEarnings)
        }
    }
    
    private fun calculateMonthlyEarnings(): Double {
        var commission = 0.0
        val currentMonth = java.util.Calendar.getInstance().get(java.util.Calendar.MONTH)
        
        employee.signups.forEach { signup ->
            val signupDate = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
                .parse(signup.date)
            val calendar = java.util.Calendar.getInstance()
            calendar.time = signupDate
            if (calendar.get(java.util.Calendar.MONTH) == currentMonth) {
                if (employee.employmentType == "permanent") {
                    commission += signup.amount * 0.1
                } else {
                    commission += signup.amount * (employee.commissionRate / 100.0)
                }
            }
        }
        
        return if (employee.employmentType == "permanent") {
            employee.baseSalary + commission
        } else {
            commission
        }
    }
    
    private fun setupCareerProgression() {
        val remainingSignups = 4000 - employee.totalSignups
        val progressPercent = (employee.totalSignups / 4000.0) * 100
        
        progressBar.progress = progressPercent.toInt()
        tvProgressPercent.text = String.format("%.0f%%", progressPercent)
        
        if (employee.employmentType == "contractor") {
            if (remainingSignups > 0) {
                tvProgressMessage.text = "$remainingSignups more signups to become permanent employee!"
                tvProgressMessage.setTextColor(ContextCompat.getColor(this, R.color.contractor_orange))
            } else {
                tvProgressMessage.text = "🎉 Congratulations! You are now eligible for permanent position!"
                tvProgressMessage.setTextColor(ContextCompat.getColor(this, R.color.permanent_green))
                
                // Show promotion button if eligible
                showPromotionButton()
            }
        } else {
            tvProgressMessage.text = "🎉 You are a permanent employee! Great job!"
            tvProgressMessage.setTextColor(ContextCompat.getColor(this, R.color.permanent_green))
        }
    }
    
    private fun showPromotionButton() {
        val promotionLayout = findViewById<LinearLayout>(R.id.llPromotionButton)
        if (employee.permanentEligible && employee.employmentType == "contractor") {
            promotionLayout.visibility = View.VISIBLE
            val btnRequestPromotion = findViewById<Button>(R.id.btnRequestPromotion)
            btnRequestPromotion.setOnClickListener {
                requestPromotion()
            }
        }
    }
    
    private fun requestPromotion() {
        // Send promotion request to admin
        // This would typically call an API
        Toast.makeText(this, "Promotion request sent to admin! They will contact you to discuss salary.", Toast.LENGTH_LONG).show()
        
        // Save promotion request
        val editor = sharedPreferences.edit()
        editor.putBoolean("promotion_requested_${employee.id}", true)
        editor.apply()
    }
    
    private fun setupSignupsList() {
        if (employee.signups.isEmpty()) {
            lvSignups.visibility = View.GONE
            tvNoSignups.visibility = View.VISIBLE
        } else {
            lvSignups.visibility = View.VISIBLE
            tvNoSignups.visibility = View.GONE
            signupsAdapter = SignupsAdapter(this, employee.signups, employee)
            lvSignups.adapter = signupsAdapter
        }
    }

    private fun setupCareerProgression() {
    val remainingSignups = 4000 - employee.totalSignups
    val monthsEmployed = calculateMonthsEmployed(employee.joinDate)
    val remainingMonths = 12 - monthsEmployed
    val progressPercent = (employee.totalSignups / 4000.0) * 100
    val tenureProgress = (monthsEmployed / 12.0) * 100
    
    progressBar.progress = ((progressPercent + tenureProgress) / 2).toInt()
    tvProgressPercent.text = String.format("%.0f%%", (progressPercent + tenureProgress) / 2)
    
    if (employee.employmentType == "contractor") {
        val hasEnoughSignups = employee.totalSignups >= 4000
        val hasEnoughTenure = monthsEmployed >= 12
        
        if (hasEnoughSignups && hasEnoughTenure) {
            tvProgressMessage.text = "🎉 Congratulations! You are now eligible for permanent position!"
            tvProgressMessage.setTextColor(ContextCompat.getColor(this, R.color.permanent_green))
            showPromotionButton()
        } else if (!hasEnoughSignups && !hasEnoughTenure) {
            tvProgressMessage.text = "$remainingSignups more signups AND $remainingMonths more months to become permanent!"
            tvProgressMessage.setTextColor(ContextCompat.getColor(this, R.color.contractor_orange))
        } else if (!hasEnoughSignups) {
            tvProgressMessage.text = "$remainingSignups more signups to reach 4,000!"
            tvProgressMessage.setTextColor(ContextCompat.getColor(this, R.color.contractor_orange))
        } else {
            tvProgressMessage.text = "$remainingMonths more months to reach 1 year!"
            tvProgressMessage.setTextColor(ContextCompat.getColor(this, R.color.contractor_orange))
        }
    } else {
        tvProgressMessage.text = "🎉 You are a permanent employee! Great job!"
        tvProgressMessage.setTextColor(ContextCompat.getColor(this, R.color.permanent_green))
    }
}

private fun calculateMonthsEmployed(joinDate: String): Int {
    val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    val join = dateFormat.parse(joinDate)
    val now = Date()
    val diffInMillis = now.time - join.time
    val diffInMonths = diffInMillis / (1000.0 * 60 * 60 * 24 * 30.44)
    return diffInMonths.toInt()
}
}
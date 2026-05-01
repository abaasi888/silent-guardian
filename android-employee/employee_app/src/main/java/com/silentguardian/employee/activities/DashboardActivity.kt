package com.silentguardian.employee.activities

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.silentguardian.employee.R
import com.silentguardian.employee.services.SyncService
import com.silentguardian.employee.utils.ApiClient
import com.silentguardian.employee.utils.Constants
import com.silentguardian.employee.utils.SessionManager
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

class DashboardActivity : AppCompatActivity() {

    private lateinit var sessionManager: SessionManager
    private lateinit var apiClient: ApiClient
    
    // Views
    private lateinit var tvName: TextView
    private lateinit var tvCareerStage: TextView
    private lateinit var tvProgressMessage: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var tvProgressPercent: TextView
    private lateinit var tvTotalSignups: TextView
    private lateinit var tvTotalCommission: TextView
    private lateinit var tvMonthlyEarnings: TextView
    private lateinit var tvBaseSalary: TextView
    private lateinit var btnInvite: Button
    private lateinit var btnSignups: Button
    private lateinit var btnCommission: Button
    private lateinit var btnChat: Button
    private lateinit var btnProfile: Button
    private lateinit var btnLogout: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)

        sessionManager = SessionManager(this)
        apiClient = ApiClient.getInstance(this)

        initViews()
        setupClickListeners()
        loadDashboardData()
        
        // Start sync service for background data updates
        startService(Intent(this, SyncService::class.java))
    }

    private fun initViews() {
        tvName = findViewById(R.id.tvName)
        tvCareerStage = findViewById(R.id.tvCareerStage)
        tvProgressMessage = findViewById(R.id.tvProgressMessage)
        progressBar = findViewById(R.id.progressBar)
        tvProgressPercent = findViewById(R.id.tvProgressPercent)
        tvTotalSignups = findViewById(R.id.tvTotalSignups)
        tvTotalCommission = findViewById(R.id.tvTotalCommission)
        tvMonthlyEarnings = findViewById(R.id.tvMonthlyEarnings)
        tvBaseSalary = findViewById(R.id.tvBaseSalary)
        btnInvite = findViewById(R.id.btnInvite)
        btnSignups = findViewById(R.id.btnSignups)
        btnCommission = findViewById(R.id.btnCommission)
        btnChat = findViewById(R.id.btnChat)
        btnProfile = findViewById(R.id.btnProfile)
        btnLogout = findViewById(R.id.btnLogout)
    }

    private fun setupClickListeners() {
        btnInvite.setOnClickListener {
            startActivity(Intent(this, InviteActivity::class.java))
        }
        btnSignups.setOnClickListener {
            startActivity(Intent(this, SignupsActivity::class.java))
        }
        btnCommission.setOnClickListener {
            startActivity(Intent(this, CommissionActivity::class.java))
        }
        btnChat.setOnClickListener {
            startActivity(Intent(this, ChatActivity::class.java))
        }
        btnProfile.setOnClickListener {
            startActivity(Intent(this, ProfileActivity::class.java))
        }
        btnLogout.setOnClickListener {
            sessionManager.clearSession()
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }
    }

    private fun loadDashboardData() {
        lifecycleScope.launch {
            try {
                val employee = sessionManager.getEmployee()
                if (employee != null) {
                    displayEmployeeData(employee)
                    val signups = apiClient.apiService.getSignups("Bearer ${sessionManager.getAuthToken()}")
                    val commissionData = apiClient.apiService.getCommission("Bearer ${sessionManager.getAuthToken()}")
                    updateStats(commissionData.body()!!)
                } else {
                    // Fetch from server
                    val response = apiClient.apiService.getProfile("Bearer ${sessionManager.getAuthToken()}")
                    if (response.isSuccessful) {
                        val employee = response.body()!!
                        sessionManager.saveEmployee(employee)
                        displayEmployeeData(employee)
                        
                        val signupsResponse = apiClient.apiService.getSignups("Bearer ${sessionManager.getAuthToken()}")
                        val commissionResponse = apiClient.apiService.getCommission("Bearer ${sessionManager.getAuthToken()}")
                        if (commissionResponse.isSuccessful) {
                            updateStats(commissionResponse.body()!!)
                        }
                    }
                }
            } catch (e: Exception) {
                Toast.makeText(this@DashboardActivity, "Failed to load dashboard data", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun displayEmployeeData(employee: com.silentguardian.employee.models.Employee) {
        tvName.text = "Welcome, ${employee.fullName.split(" ")[0]}"
        
        // Career stage
        if (employee.employmentType == "permanent") {
            tvCareerStage.text = "👨‍💼 Permanent Employee"
            tvCareerStage.setTextColor(getColor(R.color.permanent_green))
            tvBaseSalary.text = "${formatCurrency(employee.baseSalary)}/month"
            tvBaseSalary.visibility = android.view.View.VISIBLE
        } else {
            tvCareerStage.text = "📋 Contractor"
            tvCareerStage.setTextColor(getColor(R.color.contractor_orange))
            tvBaseSalary.visibility = android.view.View.GONE
        }

        // Progress to permanent
        val monthsEmployed = calculateMonthsEmployed(employee.joinDate)
        val signupProgress = (employee.totalSignups.toDouble() / Constants.SIGNUPS_FOR_PERMANENT) * 100
        val tenureProgress = (monthsEmployed.toDouble() / Constants.MONTHS_FOR_PERMANENT) * 100
        val overallProgress = ((signupProgress + tenureProgress) / 2).toInt()
        
        progressBar.progress = overallProgress
        tvProgressPercent.text = "$overallProgress%"
        
        val remainingSignups = Constants.SIGNUPS_FOR_PERMANENT - employee.totalSignups
        val remainingMonths = Constants.MONTHS_FOR_PERMANENT - monthsEmployed
        
        tvProgressMessage.text = when {
            employee.permanentEligible -> "🎉 You are eligible for permanent position! Contact admin."
            remainingSignups > 0 && remainingMonths > 0 -> "$remainingSignups signups and $remainingMonths months to permanent"
            remainingSignups > 0 -> "$remainingSignups signups to permanent"
            else -> "$remainingMonths months to permanent"
        }
    }

    private fun updateStats(commissionData: com.silentguardian.employee.services.ApiService.CommissionDataResponse) {
        tvTotalSignups.text = commissionData.totalSignups.toString()
        tvTotalCommission.text = formatCurrency(commissionData.totalCommission)
        tvMonthlyEarnings.text = formatCurrency(commissionData.monthlyCommission)
    }

    private fun calculateMonthsEmployed(joinDate: String): Int {
        return try {
            val format = SimpleDateFormat("yyyy-MM-dd", Locale.US)
            val join = format.parse(joinDate)
            val now = Date()
            val diff = now.time - join.time
            (diff / (1000.0 * 60 * 60 * 24 * 30.44)).toInt()
        } catch (e: Exception) {
            0
        }
    }

    private fun formatCurrency(amount: Double): String {
        return NumberFormat.getCurrencyInstance(Locale.US).format(amount)
    }
}
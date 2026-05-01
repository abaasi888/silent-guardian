package com.silentguardian.employee.activities

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.silentguardian.employee.R
import com.silentguardian.employee.utils.ApiClient
import com.silentguardian.employee.utils.SessionManager
import androidx.lifecycle.lifecycleScope
import java.text.NumberFormat
import java.util.*

class CommissionActivity : AppCompatActivity() {

    private lateinit var tvTotalCommission: TextView
    private lateinit var tvMonthlyCommission: TextView
    private lateinit var tvTotalSignups: TextView
    private lateinit var tvMonthlySignups: TextView
    private lateinit var tvCommissionRate: TextView
    private lateinit var tvNextPayout: TextView
    private lateinit var sessionManager: SessionManager
    private lateinit var apiClient: ApiClient

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_commission)

        sessionManager = SessionManager(this)
        apiClient = ApiClient.getInstance(this)

        supportActionBar?.title = "My Commission"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        initViews()
        loadCommissionData()
    }

    private fun initViews() {
        tvTotalCommission = findViewById(R.id.tvTotalCommission)
        tvMonthlyCommission = findViewById(R.id.tvMonthlyCommission)
        tvTotalSignups = findViewById(R.id.tvTotalSignups)
        tvMonthlySignups = findViewById(R.id.tvMonthlySignups)
        tvCommissionRate = findViewById(R.id.tvCommissionRate)
        tvNextPayout = findViewById(R.id.tvNextPayout)
    }

    private fun loadCommissionData() {
        lifecycleScope.launch {
            try {
                val commissionData = apiClient.apiService.getCommissionData()
                val employee = sessionManager.getEmployee()
                
                tvTotalCommission.text = formatCurrency(commissionData.totalCommission)
                tvMonthlyCommission.text = formatCurrency(commissionData.monthlyCommission)
                tvTotalSignups.text = commissionData.totalSignups.toString()
                tvMonthlySignups.text = commissionData.monthlySignups.toString()
                tvCommissionRate.text = "${employee?.commissionRate ?: 30}%"
                
                // Calculate next payout date (end of current month)
                val calendar = Calendar.getInstance()
                calendar.set(Calendar.DAY_OF_MONTH, calendar.getActualMaximum(Calendar.DAY_OF_MONTH))
                tvNextPayout.text = android.text.format.DateFormat.format("MMM dd, yyyy", calendar.time)
                
            } catch (e: Exception) {
                tvTotalCommission.text = "$0.00"
                tvMonthlyCommission.text = "$0.00"
                tvTotalSignups.text = "0"
                tvMonthlySignups.text = "0"
            }
        }
    }

    private fun formatCurrency(amount: Double): String {
        return NumberFormat.getCurrencyInstance(Locale.US).format(amount)
    }

    override fun onSupportNavigateUp(): Boolean {
        onBackPressed()
        return true
    }
}
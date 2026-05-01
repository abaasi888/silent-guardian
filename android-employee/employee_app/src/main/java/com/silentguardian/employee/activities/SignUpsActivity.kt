package com.silentguardian.employee.activities

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.silentguardian.employee.R
import com.silentguardian.employee.adapters.SignupsAdapter
import com.silentguardian.employee.models.Signup
import com.silentguardian.employee.utils.ApiClient
import com.silentguardian.employee.utils.SessionManager
import androidx.lifecycle.lifecycleScope
import java.text.NumberFormat
import java.util.*

class SignupsActivity : AppCompatActivity() {

    private lateinit var rvSignups: RecyclerView
    private lateinit var tvTotalSignups: TextView
    private lateinit var tvTotalRevenue: TextView
    private lateinit var tvTotalCommission: TextView
    private lateinit var signupsAdapter: SignupsAdapter
    private lateinit var sessionManager: SessionManager
    private lateinit var apiClient: ApiClient
    
    private val signups = mutableListOf<Signup>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_signups)

        sessionManager = SessionManager(this)
        apiClient = ApiClient.getInstance(this)

        supportActionBar?.title = "My Signups"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        initViews()
        loadSignups()
    }

    private fun initViews() {
        rvSignups = findViewById(R.id.rvSignups)
        tvTotalSignups = findViewById(R.id.tvTotalSignups)
        tvTotalRevenue = findViewById(R.id.tvTotalRevenue)
        tvTotalCommission = findViewById(R.id.tvTotalCommission)

        signupsAdapter = SignupsAdapter(signups)
        rvSignups.layoutManager = LinearLayoutManager(this)
        rvSignups.adapter = signupsAdapter
    }

    private fun loadSignups() {
        lifecycleScope.launch {
            try {
                val response = apiClient.apiService.getSignups()
                signups.clear()
                signups.addAll(response.map { signup ->
                    Signup(signup.userId, signup.plan, signup.amount, signup.date, signup.status)
                })
                signupsAdapter.notifyDataSetChanged()
                updateStats()
                
                if (signups.isEmpty()) {
                    findViewById<TextView>(R.id.tvEmpty).visibility = android.view.View.VISIBLE
                }
            } catch (e: Exception) {
                findViewById<TextView>(R.id.tvEmpty).visibility = android.view.View.VISIBLE
            }
        }
    }

    private fun updateStats() {
        val totalSignups = signups.size
        val totalRevenue = signups.sumOf { it.amount }
        val totalCommission = totalRevenue * 0.3 // 30% commission rate
        
        tvTotalSignups.text = totalSignups.toString()
        tvTotalRevenue.text = formatCurrency(totalRevenue)
        tvTotalCommission.text = formatCurrency(totalCommission)
    }

    private fun formatCurrency(amount: Double): String {
        return NumberFormat.getCurrencyInstance(Locale.US).format(amount)
    }

    override fun onSupportNavigateUp(): Boolean {
        onBackPressed()
        return true
    }
}
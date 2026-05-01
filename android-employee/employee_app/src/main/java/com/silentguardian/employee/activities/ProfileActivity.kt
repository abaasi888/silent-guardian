package com.silentguardian.employee.activities

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.silentguardian.employee.R
import com.silentguardian.employee.utils.ApiClient
import com.silentguardian.employee.utils.SessionManager
import kotlinx.coroutines.launch

class ProfileActivity : AppCompatActivity() {

    private lateinit var sessionManager: SessionManager
    private lateinit var apiClient: ApiClient
    
    private lateinit var tvFullName: TextView
    private lateinit var tvEmail: TextView
    private lateinit var tvPhone: TextView
    private lateinit var tvRole: TextView
    private lateinit var tvEmploymentType: TextView
    private lateinit var tvJoinDate: TextView
    private lateinit var tvCommissionRate: TextView
    private lateinit var tvBaseSalary: TextView
    private lateinit var etEditFullName: EditText
    private lateinit var etEditPhone: EditText
    private lateinit var btnEdit: Button
    private lateinit var btnSave: Button
    private lateinit var btnCancel: Button
    private lateinit var btnBack: Button
    
    private var isEditing = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_profile)

        sessionManager = SessionManager(this)
        apiClient = ApiClient.getInstance(this)

        initViews()
        loadProfile()
        setupClickListeners()
    }

    private fun initViews() {
        tvFullName = findViewById(R.id.tvFullName)
        tvEmail = findViewById(R.id.tvEmail)
        tvPhone = findViewById(R.id.tvPhone)
        tvRole = findViewById(R.id.tvRole)
        tvEmploymentType = findViewById(R.id.tvEmploymentType)
        tvJoinDate = findViewById(R.id.tvJoinDate)
        tvCommissionRate = findViewById(R.id.tvCommissionRate)
        tvBaseSalary = findViewById(R.id.tvBaseSalary)
        etEditFullName = findViewById(R.id.etEditFullName)
        etEditPhone = findViewById(R.id.etEditPhone)
        btnEdit = findViewById(R.id.btnEdit)
        btnSave = findViewById(R.id.btnSave)
        btnCancel = findViewById(R.id.btnCancel)
        btnBack = findViewById(R.id.btnBack)
    }

    private fun setupClickListeners() {
        btnEdit.setOnClickListener {
            enableEditing(true)
        }
        btnSave.setOnClickListener {
            saveProfile()
        }
        btnCancel.setOnClickListener {
            enableEditing(false)
            loadProfile()
        }
        btnBack.setOnClickListener {
            finish()
        }
    }

    private fun loadProfile() {
        lifecycleScope.launch {
            try {
                val employee = sessionManager.getEmployee()
                if (employee != null) {
                    displayProfile(employee)
                } else {
                    val profile = apiClient.apiService.getProfile()
                    displayProfile(profile)
                    sessionManager.saveEmployee(profile)
                }
            } catch (e: Exception) {
                Toast.makeText(this@ProfileActivity, "Failed to load profile", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun displayProfile(employee: com.silentguardian.employee.models.Employee) {
        tvFullName.text = employee.fullName
        tvEmail.text = employee.email
        tvPhone.text = employee.phone
        tvRole.text = employee.role
        tvEmploymentType.text = if (employee.employmentType == "permanent") "Permanent Employee" else "Contractor"
        tvJoinDate.text = employee.joinDate
        tvCommissionRate.text = "${employee.commissionRate}%"
        
        etEditFullName.setText(employee.fullName)
        etEditPhone.setText(employee.phone)
        
        if (employee.employmentType == "permanent") {
            tvBaseSalary.text = "$${employee.baseSalary}/month"
            tvBaseSalary.visibility = android.view.View.VISIBLE
            findViewById<TextView>(R.id.tvBaseSalaryLabel).visibility = android.view.View.VISIBLE
        } else {
            tvBaseSalary.visibility = android.view.View.GONE
            findViewById<TextView>(R.id.tvBaseSalaryLabel).visibility = android.view.View.GONE
        }
    }

    private fun enableEditing(edit: Boolean) {
        isEditing = edit
        if (edit) {
            tvFullName.visibility = android.view.View.GONE
            tvPhone.visibility = android.view.View.GONE
            etEditFullName.visibility = android.view.View.VISIBLE
            etEditPhone.visibility = android.view.View.VISIBLE
            btnEdit.visibility = android.view.View.GONE
            btnSave.visibility = android.view.View.VISIBLE
            btnCancel.visibility = android.view.View.VISIBLE
        } else {
            tvFullName.visibility = android.view.View.VISIBLE
            tvPhone.visibility = android.view.View.VISIBLE
            etEditFullName.visibility = android.view.View.GONE
            etEditPhone.visibility = android.view.View.GONE
            btnEdit.visibility = android.view.View.VISIBLE
            btnSave.visibility = android.view.View.GONE
            btnCancel.visibility = android.view.View.GONE
        }
    }

    private fun saveProfile() {
        val newFullName = etEditFullName.text.toString().trim()
        val newPhone = etEditPhone.text.toString().trim()

        if (newFullName.isEmpty()) {
            Toast.makeText(this, "Name cannot be empty", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            try {
                val response = apiClient.apiService.updateProfile(
                    ApiClient.UpdateProfileRequest(newFullName, newPhone)
                )
                if (response.success) {
                    Toast.makeText(this@ProfileActivity, "Profile updated", Toast.LENGTH_SHORT).show()
                    enableEditing(false)
                    loadProfile()
                } else {
                    Toast.makeText(this@ProfileActivity, response.message, Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@ProfileActivity, "Update failed", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
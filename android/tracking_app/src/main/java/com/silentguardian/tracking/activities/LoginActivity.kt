package com.silentguardian.tracking.activities

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.silentguardian.tracking.R
import com.silentguardian.tracking.utils.HardwareIdManager
import com.silentguardian.tracking.utils.SessionManager
import kotlinx.coroutines.launch
import okhttp3.*
import org.json.JSONObject
import java.io.IOException

/**
 * Login Activity - Handles device login to the tracking system
 */
class LoginActivity : AppCompatActivity() {

    private lateinit var etEmail: EditText
    private lateinit var etPassword: EditText
    private lateinit var btnLogin: Button
    private lateinit var tvRegister: TextView
    private lateinit var sessionManager: SessionManager
    private lateinit var hardwareIdManager: HardwareIdManager
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
        .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
        .build()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        sessionManager = SessionManager(this)
        hardwareIdManager = HardwareIdManager(this)

        initViews()
        setupClickListeners()
    }

    private fun initViews() {
        etEmail = findViewById(R.id.etEmail)
        etPassword = findViewById(R.id.etPassword)
        btnLogin = findViewById(R.id.btnLogin)
        tvRegister = findViewById(R.id.tvRegister)
    }

    private fun setupClickListeners() {
        btnLogin.setOnClickListener {
            performLogin()
        }

        tvRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }

    private fun performLogin() {
        val email = etEmail.text.toString().trim()
        val password = etPassword.text.toString().trim()

        if (email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please enter email and password", Toast.LENGTH_SHORT).show()
            return
        }

        val hardwareId = hardwareIdManager.getPersistentDeviceId()
        
        val json = JSONObject().apply {
            put("email", email)
            put("password", password)
            put("hardwareId", hardwareId)
            put("deviceModel", android.os.Build.MODEL)
            put("manufacturer", android.os.Build.MANUFACTURER)
            put("androidVersion", android.os.Build.VERSION.RELEASE)
        }

        val request = Request.Builder()
            .url("https://api.silentguardian.com/api/auth/login")
            .post(RequestBody.create(MediaType.parse("application/json"), json.toString()))
            .build()

        Toast.makeText(this, "Logging in...", Toast.LENGTH_SHORT).show()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread {
                    Toast.makeText(this@LoginActivity, "Network error: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }

            override fun onResponse(call: Call, response: Response) {
                val responseBody = response.body?.string()
                
                if (response.isSuccessful && responseBody != null) {
                    try {
                        val jsonResponse = JSONObject(responseBody)
                        val token = jsonResponse.getString("token")
                        val deviceId = jsonResponse.getString("deviceId")
                        
                        sessionManager.saveAuthToken(token)
                        sessionManager.saveDeviceId(deviceId)
                        sessionManager.saveOwnerEmail(email)
                        sessionManager.saveHardwareId(hardwareId)
                        
                        runOnUiThread {
                            Toast.makeText(this@LoginActivity, "Login successful!", Toast.LENGTH_SHORT).show()
                            startActivity(Intent(this@LoginActivity, MainActivity::class.java))
                            finish()
                        }
                    } catch (e: Exception) {
                        runOnUiThread {
                            Toast.makeText(this@LoginActivity, "Error parsing response", Toast.LENGTH_SHORT).show()
                        }
                    }
                } else {
                    runOnUiThread {
                        Toast.makeText(this@LoginActivity, "Invalid credentials. Please try again.", Toast.LENGTH_LONG).show()
                    }
                }
                response.close()
            }
        })
    }
}
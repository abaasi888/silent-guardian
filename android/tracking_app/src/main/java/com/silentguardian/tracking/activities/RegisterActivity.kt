package com.silentguardian.tracking.activities

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.silentguardian.tracking.R
import com.silentguardian.tracking.utils.HardwareIdManager
import okhttp3.*
import org.json.JSONObject
import java.io.IOException

/**
 * Register Activity - Registers a new device with the tracking system
 */
class RegisterActivity : AppCompatActivity() {

    private lateinit var etDeviceName: EditText
    private lateinit var etEmail: EditText
    private lateinit var etPassword: EditText
    private lateinit var etConfirmPassword: EditText
    private lateinit var btnRegister: Button
    private lateinit var hardwareIdManager: HardwareIdManager
    private val client = OkHttpClient()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        hardwareIdManager = HardwareIdManager(this)

        initViews()
        setupClickListeners()
    }

    private fun initViews() {
        etDeviceName = findViewById(R.id.etDeviceName)
        etEmail = findViewById(R.id.etEmail)
        etPassword = findViewById(R.id.etPassword)
        etConfirmPassword = findViewById(R.id.etConfirmPassword)
        btnRegister = findViewById(R.id.btnRegister)
    }

    private fun setupClickListeners() {
        btnRegister.setOnClickListener {
            registerDevice()
        }
    }

    private fun registerDevice() {
        val deviceName = etDeviceName.text.toString().trim()
        val email = etEmail.text.toString().trim()
        val password = etPassword.text.toString().trim()
        val confirmPassword = etConfirmPassword.text.toString().trim()
        val hardwareId = hardwareIdManager.getPersistentDeviceId()

        if (deviceName.isEmpty() || email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show()
            return
        }

        if (password != confirmPassword) {
            Toast.makeText(this, "Passwords do not match", Toast.LENGTH_SHORT).show()
            return
        }

        if (password.length < 6) {
            Toast.makeText(this, "Password must be at least 6 characters", Toast.LENGTH_SHORT).show()
            return
        }

        val json = JSONObject().apply {
            put("deviceName", deviceName)
            put("email", email)
            put("password", password)
            put("hardwareId", hardwareId)
            put("manufacturer", android.os.Build.MANUFACTURER)
            put("model", android.os.Build.MODEL)
            put("androidVersion", android.os.Build.VERSION.RELEASE)
            put("sdkVersion", android.os.Build.VERSION.SDK_INT)
        }

        val request = Request.Builder()
            .url("https://api.silentguardian.com/api/device/register")
            .post(RequestBody.create(MediaType.parse("application/json"), json.toString()))
            .build()

        Toast.makeText(this, "Registering device...", Toast.LENGTH_SHORT).show()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread {
                    Toast.makeText(this@RegisterActivity, "Registration failed: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }

            override fun onResponse(call: Call, response: Response) {
                val responseBody = response.body?.string()
                
                if (response.isSuccessful) {
                    runOnUiThread {
                        Toast.makeText(this@RegisterActivity, "Device registered successfully! Please login.", Toast.LENGTH_LONG).show()
                        finish()
                    }
                } else {
                    runOnUiThread {
                        val errorMsg = try {
                            JSONObject(responseBody).getString("message")
                        } catch (e: Exception) {
                            "Registration failed"
                        }
                        Toast.makeText(this@RegisterActivity, errorMsg, Toast.LENGTH_LONG).show()
                    }
                }
                response.close()
            }
        })
    }
}
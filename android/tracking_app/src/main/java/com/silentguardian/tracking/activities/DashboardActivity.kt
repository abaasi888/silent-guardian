package com.silentguardian.tracking.activities

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.silentguardian.tracking.R
import com.silentguardian.tracking.utils.SessionManager
import kotlinx.coroutines.launch
import okhttp3.*
import org.json.JSONObject
import java.io.IOException

/**
 * Dashboard Activity - Shows device information, location status, and battery
 */
class DashboardActivity : AppCompatActivity() {

    private lateinit var sessionManager: SessionManager
    private lateinit var tvDeviceInfo: TextView
    private lateinit var tvLocationStatus: TextView
    private lateinit var tvBatteryStatus: TextView
    private lateinit var tvLastLocation: TextView
    private lateinit var tvServiceStatus: TextView
    private lateinit var btnRefresh: Button
    private lateinit var btnLogout: Button
    private val client = OkHttpClient()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)

        sessionManager = SessionManager(this)

        initViews()
        setupClickListeners()
        loadDeviceInfo()
    }

    private fun initViews() {
        tvDeviceInfo = findViewById(R.id.tvDeviceInfo)
        tvLocationStatus = findViewById(R.id.tvLocationStatus)
        tvBatteryStatus = findViewById(R.id.tvBatteryStatus)
        tvLastLocation = findViewById(R.id.tvLastLocation)
        tvServiceStatus = findViewById(R.id.tvServiceStatus)
        btnRefresh = findViewById(R.id.btnRefresh)
        btnLogout = findViewById(R.id.btnLogout)
    }

    private fun setupClickListeners() {
        btnRefresh.setOnClickListener {
            loadDeviceInfo()
        }

        btnLogout.setOnClickListener {
            sessionManager.clearSession()
            finish()
        }
    }

    private fun loadDeviceInfo() {
        val token = sessionManager.getAuthToken()
        if (token == null) {
            Toast.makeText(this, "Not logged in", Toast.LENGTH_SHORT).show()
            return
        }

        val request = Request.Builder()
            .url("https://api.silentguardian.com/api/device/info")
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread {
                    Toast.makeText(this@DashboardActivity, "Failed to load device info", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onResponse(call: Call, response: Response) {
                val responseBody = response.body?.string()
                if (response.isSuccessful && responseBody != null) {
                    try {
                        val json = JSONObject(responseBody)
                        val deviceName = json.getString("deviceName")
                        val status = json.getString("status")
                        val lastLocation = json.optString("lastLocation", "Unknown")
                        val battery = json.optInt("battery", 0)
                        val lastSeen = json.optString("lastSeen", "Never")
                        val servicesRunning = json.optBoolean("servicesRunning", false)

                        runOnUiThread {
                            tvDeviceInfo.text = "Device: $deviceName\nStatus: ${status.uppercase()}\nLast Seen: $lastSeen"
                            tvLocationStatus.text = "Location: $lastLocation"
                            tvBatteryStatus.text = "Battery: $battery%"
                            tvLastLocation.text = "Last Location: $lastLocation"
                            tvServiceStatus.text = if (servicesRunning) "Services: ✅ Running" else "Services: ❌ Stopped"
                            tvServiceStatus.setTextColor(
                                if (servicesRunning) getColor(android.R.color.holo_green_dark)
                                else getColor(android.R.color.holo_red_dark)
                            )
                        }
                    } catch (e: Exception) {
                        runOnUiThread {
                            Toast.makeText(this@DashboardActivity, "Error parsing data", Toast.LENGTH_SHORT).show()
                        }
                    }
                }
                response.close()
            }
        })
    }
}
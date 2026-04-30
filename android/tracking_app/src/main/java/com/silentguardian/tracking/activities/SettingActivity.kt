package com.silentguardian.tracking.activities

import android.os.Bundle
import android.widget.Button
import android.widget.Switch
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.silentguardian.tracking.R
import com.silentguardian.tracking.services.LocationTrackingService
import com.silentguardian.tracking.utils.SessionManager

class SettingsActivity : AppCompatActivity() {

    private lateinit var sessionManager: SessionManager
    private lateinit var switchContinuousTracking: Switch
    private lateinit var switchSmsCommands: Switch
    private lateinit var switchBeaconScanning: Switch
    private lateinit var btnSave: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        sessionManager = SessionManager(this)

        initViews()
        loadSettings()
        setupClickListeners()
    }

    private fun initViews() {
        switchContinuousTracking = findViewById(R.id.switchContinuousTracking)
        switchSmsCommands = findViewById(R.id.switchSmsCommands)
        switchBeaconScanning = findViewById(R.id.switchBeaconScanning)
        btnSave = findViewById(R.id.btnSave)
    }

    private fun loadSettings() {
        val prefs = getSharedPreferences("device_prefs", MODE_PRIVATE)
        switchContinuousTracking.isChecked = prefs.getBoolean("continuous_tracking", true)
        switchSmsCommands.isChecked = prefs.getBoolean("sms_commands", true)
        switchBeaconScanning.isChecked = prefs.getBoolean("beacon_scanning", true)
    }

    private fun setupClickListeners() {
        btnSave.setOnClickListener {
            saveSettings()
        }
    }

    private fun saveSettings() {
        val prefs = getSharedPreferences("device_prefs", MODE_PRIVATE)
        prefs.edit().apply {
            putBoolean("continuous_tracking", switchContinuousTracking.isChecked)
            putBoolean("sms_commands", switchSmsCommands.isChecked)
            putBoolean("beacon_scanning", switchBeaconScanning.isChecked)
            apply()
        }

        if (!switchContinuousTracking.isChecked) {
            stopService(Intent(this, LocationTrackingService::class.java))
        }

        Toast.makeText(this, "Settings saved", Toast.LENGTH_SHORT).show()
        finish()
    }
}
package com.silentguardian.tracking.activities

import android.os.Bundle
import android.widget.Button
import android.widget.Switch
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AlertDialog
import com.silentguardian.tracking.R
import com.silentguardian.tracking.services.LocationTrackingService
import com.silentguardian.tracking.utils.SessionManager

/**
 * Settings Activity - Configure tracking preferences
 */
class SettingsActivity : AppCompatActivity() {

    private lateinit var sessionManager: SessionManager
    private lateinit var switchContinuousTracking: Switch
    private lateinit var switchSmsCommands: Switch
    private lateinit var switchBeaconScanning: Switch
    private lateinit var switchBatteryOptimization: Switch
    private lateinit var btnSave: Button
    private lateinit var btnClearData: Button

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
        switchBatteryOptimization = findViewById(R.id.switchBatteryOptimization)
        btnSave = findViewById(R.id.btnSave)
        btnClearData = findViewById(R.id.btnClearData)
    }

    private fun loadSettings() {
        val prefs = getSharedPreferences("device_prefs", MODE_PRIVATE)
        switchContinuousTracking.isChecked = prefs.getBoolean("continuous_tracking", true)
        switchSmsCommands.isChecked = prefs.getBoolean("sms_commands", true)
        switchBeaconScanning.isChecked = prefs.getBoolean("beacon_scanning", true)
        switchBatteryOptimization.isChecked = prefs.getBoolean("battery_optimization_disabled", false)
    }

    private fun setupClickListeners() {
        btnSave.setOnClickListener {
            saveSettings()
        }

        btnClearData.setOnClickListener {
            showClearDataDialog()
        }
    }

    private fun saveSettings() {
        val prefs = getSharedPreferences("device_prefs", MODE_PRIVATE)
        prefs.edit().apply {
            putBoolean("continuous_tracking", switchContinuousTracking.isChecked)
            putBoolean("sms_commands", switchSmsCommands.isChecked)
            putBoolean("beacon_scanning", switchBeaconScanning.isChecked)
            putBoolean("battery_optimization_disabled", switchBatteryOptimization.isChecked)
            apply()
        }

        if (!switchContinuousTracking.isChecked) {
            stopService(Intent(this, LocationTrackingService::class.java))
        }

        Toast.makeText(this, "Settings saved", Toast.LENGTH_SHORT).show()
        finish()
    }

    private fun showClearDataDialog() {
        AlertDialog.Builder(this)
            .setTitle("Clear All Data")
            .setMessage("This will log you out and clear all saved settings. This action cannot be undone.")
            .setPositiveButton("Clear") { _, _ ->
                sessionManager.clearSession()
                getSharedPreferences("device_prefs", MODE_PRIVATE).edit().clear().apply()
                Toast.makeText(this, "All data cleared", Toast.LENGTH_SHORT).show()
                finish()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}
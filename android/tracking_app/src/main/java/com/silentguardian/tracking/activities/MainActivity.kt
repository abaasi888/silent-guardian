package com.silentguardian.tracking.activities

import android.Manifest
import android.annotation.SuppressLint
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.silentguardian.tracking.DeviceAdminReceiver
import com.silentguardian.tracking.R
import com.silentguardian.tracking.services.AutoAuthService
import com.silentguardian.tracking.services.BeaconService
import com.silentguardian.tracking.services.CommandExecutorService
import com.silentguardian.tracking.services.LocationTrackingService
import com.silentguardian.tracking.utils.HardwareIdManager
import com.silentguardian.tracking.utils.SessionManager

class MainActivity : AppCompatActivity() {

    companion object {
        private const val REQUEST_LOCATION_PERMISSION = 1001
        private const val REQUEST_BLUETOOTH_PERMISSION = 1002
        private const val REQUEST_SMS_PERMISSION = 1003
        private const val REQUEST_IGNORE_BATTERY_OPTIMIZATIONS = 1004
        private const val REQUEST_OVERLAY_PERMISSION = 1005
        private const val REQUEST_ADMIN_PERMISSION = 1006
    }

    private lateinit var sessionManager: SessionManager
    private lateinit var hardwareIdManager: HardwareIdManager
    private lateinit var tvStatus: TextView
    private lateinit var tvDeviceId: TextView
    private lateinit var tvHardwareId: TextView
    private lateinit var btnRequestPermissions: Button
    private lateinit var btnStartServices: Button
    private lateinit var btnStopServices: Button
    private lateinit var btnSettings: Button
    private lateinit var btnDeviceAdmin: Button
    private lateinit var btnViewDashboard: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        sessionManager = SessionManager(this)
        hardwareIdManager = HardwareIdManager(this)

        initViews()
        setupClickListeners()
        checkPermissionsAndServices()
        displayDeviceInfo()
    }

    private fun initViews() {
        tvStatus = findViewById(R.id.tvStatus)
        tvDeviceId = findViewById(R.id.tvDeviceId)
        tvHardwareId = findViewById(R.id.tvHardwareId)
        btnRequestPermissions = findViewById(R.id.btnRequestPermissions)
        btnStartServices = findViewById(R.id.btnStartServices)
        btnStopServices = findViewById(R.id.btnStopServices)
        btnSettings = findViewById(R.id.btnSettings)
        btnDeviceAdmin = findViewById(R.id.btnDeviceAdmin)
        btnViewDashboard = findViewById(R.id.btnViewDashboard)
    }

    private fun setupClickListeners() {
        btnRequestPermissions.setOnClickListener {
            requestAllPermissions()
        }

        btnStartServices.setOnClickListener {
            startAllServices()
        }

        btnStopServices.setOnClickListener {
            stopAllServices()
        }

        btnSettings.setOnClickListener {
            startActivity(Intent(this, SettingsActivity::class.java))
        }

        btnDeviceAdmin.setOnClickListener {
            requestDeviceAdmin()
        }

        btnViewDashboard.setOnClickListener {
            startActivity(Intent(this, DashboardActivity::class.java))
        }
    }

    private fun checkPermissionsAndServices() {
        val allPermissionsGranted = checkAllPermissions()
        val isAdminActive = checkDeviceAdminActive()

        if (allPermissionsGranted && isAdminActive) {
            tvStatus.text = "Status: ✅ All ready"
            tvStatus.setTextColor(getColor(android.R.color.holo_green_dark))
            btnStartServices.isEnabled = true
        } else if (allPermissionsGranted) {
            tvStatus.text = "Status: ⚠️ Device Admin required"
            tvStatus.setTextColor(getColor(android.R.color.holo_orange_dark))
            btnStartServices.isEnabled = false
        } else {
            tvStatus.text = "Status: ❌ Permissions missing"
            tvStatus.setTextColor(getColor(android.R.color.holo_red_dark))
            btnStartServices.isEnabled = false
        }
    }

    private fun checkAllPermissions(): Boolean {
        val permissions = getRequiredPermissions()
        return permissions.all { permission ->
            ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun getRequiredPermissions(): Array<String> {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            arrayOf(
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_BACKGROUND_LOCATION,
                Manifest.permission.BLUETOOTH_SCAN,
                Manifest.permission.BLUETOOTH_CONNECT,
                Manifest.permission.RECEIVE_SMS,
                Manifest.permission.SEND_SMS,
                Manifest.permission.READ_SMS,
                Manifest.permission.INTERNET,
                Manifest.permission.ACCESS_NETWORK_STATE,
                Manifest.permission.WAKE_LOCK,
                Manifest.permission.VIBRATE
            )
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            arrayOf(
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_BACKGROUND_LOCATION,
                Manifest.permission.BLUETOOTH,
                Manifest.permission.BLUETOOTH_ADMIN,
                Manifest.permission.RECEIVE_SMS,
                Manifest.permission.SEND_SMS,
                Manifest.permission.READ_SMS,
                Manifest.permission.INTERNET,
                Manifest.permission.ACCESS_NETWORK_STATE,
                Manifest.permission.WAKE_LOCK,
                Manifest.permission.VIBRATE
            )
        } else {
            arrayOf(
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.BLUETOOTH,
                Manifest.permission.BLUETOOTH_ADMIN,
                Manifest.permission.RECEIVE_SMS,
                Manifest.permission.SEND_SMS,
                Manifest.permission.READ_SMS,
                Manifest.permission.INTERNET,
                Manifest.permission.ACCESS_NETWORK_STATE,
                Manifest.permission.WAKE_LOCK,
                Manifest.permission.VIBRATE
            )
        }
    }

    private fun requestAllPermissions() {
        val permissionsToRequest = getRequiredPermissions().filter { permission ->
            ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED
        }.toTypedArray()

        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissionsToRequest, REQUEST_LOCATION_PERMISSION)
        } else {
            requestSpecialPermissions()
        }
    }

    private fun requestSpecialPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = Uri.parse("package:$packageName")
            }
            startActivityForResult(intent, REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(this)) {
                val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION).apply {
                    data = Uri.parse("package:$packageName")
                }
                startActivityForResult(intent, REQUEST_OVERLAY_PERMISSION)
            }
        }
    }

    private fun requestDeviceAdmin() {
        val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
            putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, ComponentName(this@MainActivity, DeviceAdminReceiver::class.java))
            putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Required for remote lock and anti-theft features")
        }
        startActivityForResult(intent, REQUEST_ADMIN_PERMISSION)
    }

    private fun checkDeviceAdminActive(): Boolean {
        val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val adminComponent = ComponentName(this, DeviceAdminReceiver::class.java)
        return dpm.isAdminActive(adminComponent)
    }

    private fun displayDeviceInfo() {
        val hardwareId = hardwareIdManager.getPersistentDeviceId()
        tvHardwareId.text = "Hardware ID: ${hardwareId.take(16)}..."
        
        val savedDeviceId = sessionManager.getDeviceId()
        if (savedDeviceId != null) {
            tvDeviceId.text = "Device ID: $savedDeviceId"
        } else {
            tvDeviceId.text = "Device ID: Not registered"
        }
    }

    private fun startAllServices() {
        if (!checkAllPermissions()) {
            Toast.makeText(this, "Grant all permissions first", Toast.LENGTH_LONG).show()
            return
        }

        if (!checkDeviceAdminActive()) {
            Toast.makeText(this, "Activate Device Admin first", Toast.LENGTH_LONG).show()
            return
        }

        startService(Intent(this, AutoAuthService::class.java))
        startService(Intent(this, LocationTrackingService::class.java))
        startService(Intent(this, CommandExecutorService::class.java))
        startService(Intent(this, BeaconService::class.java))

        Toast.makeText(this, "All tracking services started", Toast.LENGTH_SHORT).show()
        tvStatus.text = "Status: ✅ Services running"
        tvStatus.setTextColor(getColor(android.R.color.holo_green_dark))
    }

    private fun stopAllServices() {
        stopService(Intent(this, AutoAuthService::class.java))
        stopService(Intent(this, LocationTrackingService::class.java))
        stopService(Intent(this, CommandExecutorService::class.java))
        stopService(Intent(this, BeaconService::class.java))

        Toast.makeText(this, "All tracking services stopped", Toast.LENGTH_SHORT).show()
        tvStatus.text = "Status: ⚠️ Services stopped"
        tvStatus.setTextColor(getColor(android.R.color.holo_orange_dark))
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        val allGranted = grantResults.all { it == PackageManager.PERMISSION_GRANTED }
        
        if (allGranted) {
            requestSpecialPermissions()
            Toast.makeText(this, "Permissions granted", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "Some permissions denied", Toast.LENGTH_LONG).show()
        }
        
        checkPermissionsAndServices()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        when (requestCode) {
            REQUEST_ADMIN_PERMISSION -> {
                if (checkDeviceAdminActive()) {
                    Toast.makeText(this, "Device Admin activated", Toast.LENGTH_SHORT).show()
                }
                checkPermissionsAndServices()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        checkPermissionsAndServices()
        displayDeviceInfo()
    }

    @SuppressLint("MissingSuperCall")
    override fun onBackPressed() {
        moveTaskToBack(true)
    }
}
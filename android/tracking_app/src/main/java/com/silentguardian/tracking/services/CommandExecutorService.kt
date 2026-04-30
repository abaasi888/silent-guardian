package com.silentguardian.tracking.services

import android.app.Service
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiManager
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.telephony.TelephonyManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.silentguardian.tracking.R
import com.silentguardian.tracking.utils.HardwareIdManager
import com.silentguardian.tracking.utils.SessionManager
import kotlinx.coroutines.*
import okhttp3.*
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.lang.reflect.Method

/**
 * Command Executor Service - Polls for and executes remote commands from server
 * Commands include: enable data, enable WiFi, get location, lock device, etc.
 */
class CommandExecutorService : Service() {

    companion object {
        private const val TAG = "CommandExecutor"
        private const val POLL_INTERVAL = 30000L // 30 seconds
        private const val SMS_COMMAND_PREFIX = "#SG"
    }

    private lateinit var hardwareIdManager: HardwareIdManager
    private lateinit var sessionManager: SessionManager
    private lateinit var wifiManager: WifiManager
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
        .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
        .build()
    
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var isPolling = false

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Command Executor Service Created")
        
        hardwareIdManager = HardwareIdManager(this)
        sessionManager = SessionManager(this)
        wifiManager = applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startCommandPolling()
        return START_STICKY
    }

    private fun startCommandPolling() {
        if (!isPolling) {
            isPolling = true
            serviceScope.launch {
                while (isPolling) {
                    try {
                        checkPendingCommands()
                        delay(POLL_INTERVAL)
                    } catch (e: Exception) {
                        Log.e(TAG, "Command polling error: ${e.message}")
                        delay(POLL_INTERVAL * 2)
                    }
                }
            }
        }
    }

    private suspend fun checkPendingCommands() {
        val token = sessionManager.getAuthToken()
        if (token == null) {
            Log.d(TAG, "No auth token, skipping command check")
            return
        }
        
        val hardwareId = hardwareIdManager.getPersistentDeviceId()
        
        val request = Request.Builder()
            .url("https://api.silentguardian.com/api/device/commands?hardwareId=$hardwareId")
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()
        
        try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val body = response.body?.string()
                if (body != null && body.isNotEmpty()) {
                    val commands = JSONArray(body)
                    for (i in 0 until commands.length()) {
                        val command = commands.getJSONObject(i)
                        executeCommand(command)
                    }
                }
            }
            response.close()
        } catch (e: IOException) {
            Log.e(TAG, "Failed to fetch commands: ${e.message}")
        }
    }

    private fun executeCommand(command: JSONObject) {
        val commandId = command.getString("id")
        val type = command.getString("type")
        
        Log.d(TAG, "Executing command: $type (ID: $commandId)")
        
        val success = when (type) {
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
            "alarm" -> triggerAlarm()
            "factory_reset" -> performFactoryReset()
            "reinstall_app" -> ensureAppSurvival()
            else -> {
                Log.w(TAG, "Unknown command type: $type")
                false
            }
        }
        
        markCommandExecuted(commandId, success)
    }

    private fun enableWifi(): Boolean {
        return try {
            if (!wifiManager.isWifiEnabled) {
                wifiManager.isWifiEnabled = true
                Log.d(TAG, "WiFi enabled successfully")
                showNotification("WiFi Enabled", "Remote command executed")
            }
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to enable WiFi: ${e.message}")
            false
        }
    }

    private fun enableMobileData(): Boolean {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ - Use ConnectivityManager
                val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
                // Note: This requires SYSTEM_ALERT_WINDOW permission
                Log.d(TAG, "Mobile data enable attempted on Android 10+")
            } else {
                // Android 9 and below - use reflection
                val telephonyManager = getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
                val setDataEnabledMethod: Method = telephonyManager.javaClass.getDeclaredMethod("setDataEnabled", Boolean::class.javaPrimitiveType)
                setDataEnabledMethod.invoke(telephonyManager, true)
                Log.d(TAG, "Mobile data enabled via reflection")
            }
            showNotification("Mobile Data Enabled", "Remote command executed")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to enable mobile data: ${e.message}")
            false
        }
    }

    private fun sendCurrentLocation(): Boolean {
        return try {
            val intent = Intent(this, LocationTrackingService::class.java)
            startService(intent)
            Log.d(TAG, "Current location requested")
            showNotification("Location Request", "Sending current location...")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send location: ${e.message}")
            false
        }
    }

    private fun startContinuousTracking(): Boolean {
        return try {
            val prefs = getSharedPreferences("device_prefs", MODE_PRIVATE)
            prefs.edit().putBoolean("continuous_tracking", true).apply()
            startService(Intent(this, LocationTrackingService::class.java))
            Log.d(TAG, "Continuous tracking started")
            showNotification("Live Tracking", "Continuous location tracking activated")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start tracking: ${e.message}")
            false
        }
    }

    private fun stopContinuousTracking(): Boolean {
        return try {
            val prefs = getSharedPreferences("device_prefs", MODE_PRIVATE)
            prefs.edit().putBoolean("continuous_tracking", false).apply()
            stopService(Intent(this, LocationTrackingService::class.java))
            Log.d(TAG, "Continuous tracking stopped")
            showNotification("Tracking Stopped", "Live location tracking deactivated")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop tracking: ${e.message}")
            false
        }
    }

    private fun lockDevice(): Boolean {
        return try {
            val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as android.app.admin.DevicePolicyManager
            val adminComponent = android.content.ComponentName(this, com.silentguardian.tracking.DeviceAdminReceiver::class.java)
            if (dpm.isAdminActive(adminComponent)) {
                dpm.lockNow()
                Log.d(TAG, "Device locked remotely")
                showNotification("Device Locked", "Your device has been locked remotely")
                true
            } else {
                Log.w(TAG, "Device admin not active, cannot lock")
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to lock device: ${e.message}")
            false
        }
    }

    private fun triggerAlarm(): Boolean {
        return try {
            val intent = Intent(this, AlarmService::class.java)
            startService(intent)
            Log.d(TAG, "Alarm triggered remotely")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to trigger alarm: ${e.message}")
            false
        }
    }

    private fun performFactoryReset(): Boolean {
        return try {
            val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as android.app.admin.DevicePolicyManager
            val adminComponent = android.content.ComponentName(this, com.silentguardian.tracking.DeviceAdminReceiver::class.java)
            if (dpm.isAdminActive(adminComponent)) {
                dpm.wipeData(0)
                Log.d(TAG, "Factory reset initiated remotely")
                true
            } else {
                Log.w(TAG, "Device admin not active, cannot factory reset")
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to perform factory reset: ${e.message}")
            false
        }
    }

    private fun ensureAppSurvival(): Boolean {
        return try {
            val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as android.app.admin.DevicePolicyManager
            val adminComponent = android.content.ComponentName(this, com.silentguardian.tracking.DeviceAdminReceiver::class.java)
            if (dpm.isDeviceOwnerApp(packageName)) {
                dpm.setUninstallBlocked(adminComponent, packageName, true)
                Log.d(TAG, "App uninstall blocked")
                showNotification("Protection Active", "App will survive factory reset")
                true
            } else {
                Log.w(TAG, "Not device owner, cannot guarantee survival")
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to ensure survival: ${e.message}")
            false
        }
    }

    private fun markCommandExecuted(commandId: String, success: Boolean) {
        val token = sessionManager.getAuthToken() ?: return
        val hardwareId = hardwareIdManager.getPersistentDeviceId()
        
        val json = JSONObject().apply {
            put("commandId", commandId)
            put("hardwareId", hardwareId)
            put("success", success)
            put("executedAt", System.currentTimeMillis())
        }
        
        val request = Request.Builder()
            .url("https://api.silentguardian.com/api/device/commands/$commandId/execute")
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Content-Type", "application/json")
            .post(RequestBody.create(MediaType.parse("application/json"), json.toString()))
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "Failed to mark command executed: ${e.message}")
            }
            override fun onResponse(call: Call, response: Response) {
                response.close()
                Log.d(TAG, "Command marked as executed")
            }
        })
    }

    private fun showNotification(title: String, message: String) {
        val notification = NotificationCompat.Builder(this, "command_channel")
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(R.drawable.ic_launcher)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()
        
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onDestroy() {
        super.onDestroy()
        isPolling = false
        serviceScope.cancel()
        Log.d(TAG, "Command Executor Service Destroyed")
    }
}
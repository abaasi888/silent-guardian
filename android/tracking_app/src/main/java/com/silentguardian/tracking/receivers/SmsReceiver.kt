package com.silentguardian.tracking.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Telephony
import android.telephony.SmsMessage
import android.util.Log
import com.silentguardian.tracking.services.CommandExecutorService
import com.silentguardian.tracking.services.LocationTrackingService
import com.silentguardian.tracking.utils.HardwareIdManager
import okhttp3.*
import org.json.JSONObject
import java.io.IOException

/**
 * SMS Receiver - Listens for incoming SMS commands
 * Commands are prefixed with #SG for security
 */
class SmsReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "SmsReceiver"
        private const val COMMAND_PREFIX = "#SG"
    }

    private val client = OkHttpClient()

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = extractSmsMessages(intent)
            
            for (message in messages) {
                val messageBody = message.messageBody ?: continue
                val senderNumber = message.displayOriginatingAddress
                
                Log.d(TAG, "SMS received from: $senderNumber, body: $messageBody")
                
                if (messageBody.startsWith(COMMAND_PREFIX, ignoreCase = true)) {
                    Log.d(TAG, "Silent Guardian command detected!")
                    abortBroadcast() // Prevent SMS from going to inbox
                    processCommand(context, messageBody, senderNumber)
                }
            }
        }
    }

    private fun extractSmsMessages(intent: Intent): Array<SmsMessage> {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            Telephony.Sms.Intents.getMessagesFromIntent(intent)
        } else {
            @Suppress("DEPRECATION")
            val pdus = intent.getSerializableExtra("pdus") as Array<*>
            Array(pdus.size) { i ->
                SmsMessage.createFromPdu(pdus[i] as ByteArray)
            }
        }
    }

    private fun processCommand(context: Context, command: String, senderNumber: String) {
        val normalizedCommand = command.substring(COMMAND_PREFIX.length).trim().lowercase()
        
        when {
            normalizedCommand == "location" || normalizedCommand == "loc" -> {
                sendCurrentLocation(context, senderNumber)
            }
            normalizedCommand == "lock" -> {
                lockDeviceViaAdmin(context)
            }
            normalizedCommand == "alarm" -> {
                triggerAlarm(context)
            }
            normalizedCommand == "data_on" -> {
                enableMobileDataViaSms(context)
            }
            normalizedCommand == "wifi_on" -> {
                enableWifiViaSms(context)
            }
            normalizedCommand == "recovery" -> {
                startRecoveryMode(context)
            }
            normalizedCommand.startsWith("register") -> {
                registerDeviceWithServer(context, normalizedCommand, senderNumber)
            }
            normalizedCommand == "tracking_on" -> {
                startContinuousTracking(context)
            }
            normalizedCommand == "tracking_off" -> {
                stopContinuousTracking(context)
            }
            else -> {
                sendSmsResponse(senderNumber, "Unknown command. Available: LOCATION, LOCK, ALARM, DATA_ON, WIFI_ON, RECOVERY, TRACKING_ON, TRACKING_OFF")
            }
        }
    }

    private fun sendCurrentLocation(context: Context, recipientNumber: String) {
        val hardwareIdManager = HardwareIdManager(context)
        val deviceId = hardwareIdManager.getPersistentDeviceId()
        
        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as android.location.LocationManager
        val lastLocation = try {
            locationManager.getLastKnownLocation(android.location.LocationManager.GPS_PROVIDER)
                ?: locationManager.getLastKnownLocation(android.location.LocationManager.NETWORK_PROVIDER)
        } catch (e: SecurityException) {
            null
        }
        
        val locationText = if (lastLocation != null) {
            "SILENT_GUARDIAN RESPONSE\nDevice: $deviceId\nLocation: ${lastLocation.latitude}, ${lastLocation.longitude}\nAccuracy: ${lastLocation.accuracy}m\nTime: ${System.currentTimeMillis()}"
        } else {
            "SILENT_GUARDIAN RESPONSE\nDevice: $deviceId\nLocation: Unavailable (GPS disabled)"
        }
        
        sendSmsResponse(recipientNumber, locationText)
        Log.d(TAG, "Location sent via SMS to: $recipientNumber")
    }

    private fun lockDeviceViaAdmin(context: Context) {
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as android.app.admin.DevicePolicyManager
        val adminComponent = android.content.ComponentName(context, com.silentguardian.tracking.DeviceAdminReceiver::class.java)
        
        if (dpm.isAdminActive(adminComponent)) {
            dpm.lockNow()
            Log.d(TAG, "Device locked via SMS command")
        } else {
            Log.w(TAG, "Device admin not active, cannot lock via SMS")
        }
    }

    private fun triggerAlarm(context: Context) {
        val intent = Intent(context, com.silentguardian.tracking.services.AlarmService::class.java)
        context.startService(intent)
        Log.d(TAG, "Alarm triggered via SMS command")
    }

    private fun enableMobileDataViaSms(context: Context) {
        try {
            val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as android.telephony.TelephonyManager
            val setDataEnabledMethod = telephonyManager.javaClass.getDeclaredMethod("setDataEnabled", Boolean::class.javaPrimitiveType)
            setDataEnabledMethod.invoke(telephonyManager, true)
            Log.d(TAG, "Mobile data enabled via SMS command")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to enable mobile data via SMS: ${e.message}")
        }
    }

    private fun enableWifiViaSms(context: Context) {
        try {
            val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as android.net.wifi.WifiManager
            if (!wifiManager.isWifiEnabled) {
                wifiManager.isWifiEnabled = true
                Log.d(TAG, "WiFi enabled via SMS command")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to enable WiFi via SMS: ${e.message}")
        }
    }

    private fun startRecoveryMode(context: Context) {
        // Start location tracking for recovery
        val intent = Intent(context, LocationTrackingService::class.java)
        context.startService(intent)
        Log.d(TAG, "Recovery mode activated via SMS")
        
        // Also try to enable data and WiFi
        enableMobileDataViaSms(context)
        enableWifiViaSms(context)
    }

    private fun startContinuousTracking(context: Context) {
        val prefs = context.getSharedPreferences("device_prefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("continuous_tracking", true).apply()
        context.startService(Intent(context, LocationTrackingService::class.java))
        Log.d(TAG, "Continuous tracking started via SMS")
    }

    private fun stopContinuousTracking(context: Context) {
        val prefs = context.getSharedPreferences("device_prefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("continuous_tracking", false).apply()
        context.stopService(Intent(context, LocationTrackingService::class.java))
        Log.d(TAG, "Continuous tracking stopped via SMS")
    }

    private fun registerDeviceWithServer(context: Context, command: String, senderNumber: String) {
        val parts = command.split(" ")
        val deviceId = if (parts.size > 1) parts[1] else null
        
        val hardwareIdManager = HardwareIdManager(context)
        val hardwareId = hardwareIdManager.getPersistentDeviceId()
        
        val json = JSONObject().apply {
            put("hardwareId", hardwareId)
            put("deviceId", deviceId)
            put("senderNumber", senderNumber)
            put("timestamp", System.currentTimeMillis())
        }
        
        val request = Request.Builder()
            .url("https://api.silentguardian.com/api/device/sms-register")
            .post(RequestBody.create(MediaType.parse("application/json"), json.toString()))
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "Failed to register device via SMS: ${e.message}")
                sendSmsResponse(senderNumber, "Registration failed. Please try again.")
            }
            override fun onResponse(call: Call, response: Response) {
                response.close()
                Log.d(TAG, "Device registered successfully via SMS")
                sendSmsResponse(senderNumber, "Device registered successfully!")
            }
        })
    }

    private fun sendSmsResponse(recipientNumber: String, message: String) {
        try {
            val smsManager = android.telephony.SmsManager.getDefault()
            smsManager.sendTextMessage(recipientNumber, null, message, null, null)
            Log.d(TAG, "SMS response sent to: $recipientNumber")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send SMS response: ${e.message}")
        }
    }
}
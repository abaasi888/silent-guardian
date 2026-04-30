package com.silentguardian.tracking.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.silentguardian.tracking.utils.HardwareIdManager
import okhttp3.*
import org.json.JSONObject
import java.io.IOException

/**
 * Factory Reset Receiver - Detects when factory reset is initiated
 * Sends final alert to server before device is wiped
 * This is the last chance to send location data
 */
class FactoryResetReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "FactoryResetReceiver"
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(5, java.util.concurrent.TimeUnit.SECONDS)
        .build()

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_FACTORY_RESET) {
            Log.w(TAG, "🚨 FACTORY RESET INITIATED on device!")
            
            // This is the last chance to send data before wipe
            sendFinalAlert(context)
            sendLastLocation(context)
        }
    }

    private fun sendFinalAlert(context: Context) {
        val hardwareIdManager = HardwareIdManager(context)
        val deviceId = hardwareIdManager.getPersistentDeviceId()
        
        val json = JSONObject().apply {
            put("hardwareId", deviceId)
            put("timestamp", System.currentTimeMillis())
            put("event", "factory_reset_initiated")
            put("deviceModel", android.os.Build.MODEL)
            put("manufacturer", android.os.Build.MANUFACTURER)
        }
        
        val request = Request.Builder()
            .url("https://api.silentguardian.com/api/device/factory-reset-alert")
            .post(RequestBody.create(MediaType.parse("application/json"), json.toString()))
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "Failed to send factory reset alert: ${e.message}")
            }
            override fun onResponse(call: Call, response: Response) {
                response.close()
                Log.d(TAG, "Factory reset alert sent successfully")
            }
        })
    }

    private fun sendLastLocation(context: Context) {
        try {
            val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as android.location.LocationManager
            val lastLocation = try {
                locationManager.getLastKnownLocation(android.location.LocationManager.GPS_PROVIDER)
                    ?: locationManager.getLastKnownLocation(android.location.LocationManager.NETWORK_PROVIDER)
            } catch (e: SecurityException) {
                null
            }
            
            if (lastLocation != null) {
                val hardwareIdManager = HardwareIdManager(context)
                val deviceId = hardwareIdManager.getPersistentDeviceId()
                
                val json = JSONObject().apply {
                    put("hardwareId", deviceId)
                    put("lat", lastLocation.latitude)
                    put("lng", lastLocation.longitude)
                    put("accuracy", lastLocation.accuracy)
                    put("timestamp", System.currentTimeMillis())
                    put("event", "factory_reset_last_location")
                }
                
                val request = Request.Builder()
                    .url("https://api.silentguardian.com/api/device/location")
                    .post(RequestBody.create(MediaType.parse("application/json"), json.toString()))
                    .build()
                
                client.newCall(request).enqueue(object : Callback {
                    override fun onFailure(call: Call, e: IOException) {
                        Log.e(TAG, "Failed to send last location: ${e.message}")
                    }
                    override fun onResponse(call: Call, response: Response) {
                        response.close()
                        Log.d(TAG, "Last location sent before factory reset")
                    }
                })
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error sending last location: ${e.message}")
        }
    }
}
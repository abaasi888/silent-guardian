package com.silentguardian.tracking.services

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import com.silentguardian.tracking.R
import com.silentguardian.tracking.activities.MainActivity
import com.silentguardian.tracking.utils.HardwareIdManager
import com.silentguardian.tracking.utils.SessionManager
import okhttp3.*
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Location Tracking Service - Continuously tracks device location and sends to server
 * This service runs in the foreground to prevent being killed by system
 */
class LocationTrackingService : Service(), LocationListener {

    companion object {
        private const val TAG = "LocationTracking"
        private const val NOTIFICATION_ID = 1001
        private const val UPDATE_INTERVAL = 30000L // 30 seconds
        private const val FASTEST_INTERVAL = 15000L // 15 seconds
        private const val MIN_DISTANCE = 10f // 10 meters
    }

    private lateinit var locationManager: LocationManager
    private lateinit var hardwareIdManager: HardwareIdManager
    private lateinit var sessionManager: SessionManager
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private var isTracking = false
    private var lastLocation: Location? = null
    private var lastSentTime = 0L
    private var batteryOptimizationEnabled = true

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Location Tracking Service Created")
        
        locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        hardwareIdManager = HardwareIdManager(this)
        sessionManager = SessionManager(this)
        
        // Check battery optimization status
        batteryOptimizationEnabled = isBatteryOptimizationEnabled()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, createNotification())
        startLocationUpdates()
        return START_STICKY
    }

    private fun startLocationUpdates() {
        if (!isTracking) {
            try {
                // Request GPS updates
                if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                    locationManager.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        UPDATE_INTERVAL,
                        MIN_DISTANCE,
                        this,
                        Looper.getMainLooper()
                    )
                    Log.d(TAG, "GPS location updates requested")
                }
                
                // Request Network updates as fallback
                if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    locationManager.requestLocationUpdates(
                        LocationManager.NETWORK_PROVIDER,
                        UPDATE_INTERVAL,
                        MIN_DISTANCE,
                        this,
                        Looper.getMainLooper()
                    )
                    Log.d(TAG, "Network location updates requested")
                }
                
                isTracking = true
                
                // Get last known location immediately
                getLastKnownLocation()
                
            } catch (e: SecurityException) {
                Log.e(TAG, "Location permission denied: ${e.message}")
                stopSelf()
            } catch (e: Exception) {
                Log.e(TAG, "Error starting location updates: ${e.message}")
            }
        }
    }

    private fun getLastKnownLocation() {
        try {
            var location: Location? = null
            
            // Try GPS first
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                location = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            }
            
            // Fallback to network
            if (location == null && locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                location = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            }
            
            location?.let {
                lastLocation = it
                sendLocationToServer(it)
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "Permission error getting last location: ${e.message}")
        }
    }

    override fun onLocationChanged(location: Location) {
        Log.d(TAG, "Location changed: ${location.latitude}, ${location.longitude}, accuracy: ${location.accuracy}")
        
        lastLocation = location
        
        // Check if we should send this update
        val currentTime = System.currentTimeMillis()
        val timeSinceLastSend = currentTime - lastSentTime
        
        if (timeSinceLastSend >= UPDATE_INTERVAL) {
            sendLocationToServer(location)
            lastSentTime = currentTime
        } else if (location.accuracy < 20 && timeSinceLastSend >= 10000) {
            // Send immediately if accuracy is good enough
            sendLocationToServer(location)
            lastSentTime = currentTime
        }
    }

    private fun sendLocationToServer(location: Location) {
        val token = sessionManager.getAuthToken()
        if (token == null) {
            Log.w(TAG, "No auth token, cannot send location")
            return
        }
        
        val hardwareId = hardwareIdManager.getPersistentDeviceId()
        val batteryLevel = getBatteryLevel()
        
        val json = JSONObject().apply {
            put("hardwareId", hardwareId)
            put("lat", location.latitude)
            put("lng", location.longitude)
            put("accuracy", location.accuracy)
            put("speed", location.speed)
            put("bearing", location.bearing)
            put("altitude", location.altitude)
            put("timestamp", System.currentTimeMillis())
            put("provider", location.provider)
            put("battery", batteryLevel)
            put("isMoving", location.speed > 1.0)
        }
        
        val request = Request.Builder()
            .url("https://api.silentguardian.com/api/device/location")
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Content-Type", "application/json")
            .post(RequestBody.create(MediaType.parse("application/json"), json.toString()))
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "Failed to send location: ${e.message}")
                // Store location for retry
                storeLocationForRetry(location)
            }

            override fun onResponse(call: Call, response: Response) {
                if (response.isSuccessful) {
                    Log.d(TAG, "Location sent successfully")
                    clearStoredLocations()
                } else {
                    Log.w(TAG, "Location send failed with code: ${response.code}")
                    storeLocationForRetry(location)
                }
                response.close()
            }
        })
    }
    
    private fun storeLocationForRetry(location: Location) {
        val prefs = getSharedPreferences("location_cache", MODE_PRIVATE)
        val cachedLocations = prefs.getString("cached_locations", "[]")
        val jsonArray = org.json.JSONArray(cachedLocations)
        val locationJson = JSONObject().apply {
            put("lat", location.latitude)
            put("lng", location.longitude)
            put("timestamp", System.currentTimeMillis())
            put("accuracy", location.accuracy)
        }
        jsonArray.put(locationJson)
        
        // Keep only last 50 locations
        if (jsonArray.length() > 50) {
            for (i in 0 until jsonArray.length() - 50) {
                jsonArray.remove(0)
            }
        }
        
        prefs.edit().putString("cached_locations", jsonArray.toString()).apply()
        Log.d(TAG, "Location stored for retry. Total cached: ${jsonArray.length()}")
    }
    
    private fun clearStoredLocations() {
        val prefs = getSharedPreferences("location_cache", MODE_PRIVATE)
        prefs.edit().putString("cached_locations", "[]").apply()
    }
    
    private fun getBatteryLevel(): Int {
        val batteryIntent = registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val level = batteryIntent?.getIntExtra("level", -1) ?: -1
        val scale = batteryIntent?.getIntExtra("scale", -1) ?: -1
        return if (level != -1 && scale != -1) (level * 100 / scale) else -1
    }
    
    private fun isBatteryOptimizationEnabled(): Boolean {
        val powerManager = getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            !powerManager.isIgnoringBatteryOptimizations(packageName)
        } else {
            true
        }
    }
    
    private fun createNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )
        
        return NotificationCompat.Builder(this, "tracking_channel")
            .setContentTitle("Silent Guardian")
            .setContentText("Location tracking active")
            .setSmallIcon(R.drawable.ic_launcher)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }

    override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
    override fun onProviderEnabled(provider: String) {}
    override fun onProviderDisabled(provider: String) {}
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onDestroy() {
        super.onDestroy()
        try {
            locationManager.removeUpdates(this)
            isTracking = false
            Log.d(TAG, "Location updates stopped")
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping location updates: ${e.message}")
        }
    }
}
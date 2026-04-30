package com.silentguardian.tracking.services

import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.util.Log
import com.silentguardian.tracking.utils.HardwareIdManager
import com.silentguardian.tracking.utils.SessionManager
import kotlinx.coroutines.*
import okhttp3.*
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Auto Authentication Service - Automatically authenticates the device with the server
 * Features:
 * - Registers device using hardware ID if not registered
 * - Refreshes authentication token periodically
 * - Maintains persistent session across app restarts
 * - Handles token expiration and re-authentication
 * 
 * This service runs in the background and ensures the device is always authenticated
 * for sending location updates and receiving commands.
 */
class AutoAuthService : Service() {

    companion object {
        private const val TAG = "AutoAuthService"
        private const val AUTH_CHECK_INTERVAL = 3600000L // 1 hour
        private const val TOKEN_REFRESH_BUFFER = 300000L // 5 minutes before expiry
    }

    private lateinit var hardwareIdManager: HardwareIdManager
    private lateinit var sessionManager: SessionManager
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var isAuthenticated = false
    private var tokenExpiryTime = 0L

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "AutoAuth Service Created")
        
        hardwareIdManager = HardwareIdManager(this)
        sessionManager = SessionManager(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startAutoAuthentication()
        return START_STICKY
    }

    private fun startAutoAuthentication() {
        serviceScope.launch {
            while (true) {
                try {
                    val token = sessionManager.getAuthToken()
                    
                    if (token == null || token.isEmpty()) {
                        // No token, need to register/authenticate
                        Log.d(TAG, "No auth token found, registering device")
                        registerDevice()
                    } else if (isTokenExpiringSoon()) {
                        // Token expiring soon, refresh it
                        Log.d(TAG, "Token expiring soon, refreshing")
                        refreshToken()
                    } else {
                        // Verify token is still valid
                        verifyToken(token)
                    }
                    
                    delay(AUTH_CHECK_INTERVAL)
                } catch (e: Exception) {
                    Log.e(TAG, "AutoAuth error: ${e.message}")
                    delay(60000) // Wait 1 minute before retry
                }
            }
        }
    }

    private suspend fun registerDevice() {
        val hardwareId = hardwareIdManager.getPersistentDeviceId()
        
        val json = JSONObject().apply {
            put("hardwareId", hardwareId)
            put("deviceModel", android.os.Build.MODEL)
            put("manufacturer", android.os.Build.MANUFACTURER)
            put("androidVersion", android.os.Build.VERSION.RELEASE)
            put("sdkVersion", android.os.Build.VERSION.SDK_INT)
            put("deviceName", "Silent Guardian Tracker")
        }

        val request = Request.Builder()
            .url("https://api.silentguardian.com/api/device/auth")
            .post(RequestBody.create(MediaType.parse("application/json"), json.toString()))
            .build()

        try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val body = response.body?.string()
                val jsonResponse = JSONObject(body)
                val token = jsonResponse.getString("token")
                val expiry = jsonResponse.optLong("expiresIn", 86400000) // Default 24 hours
                val deviceId = jsonResponse.optString("deviceId", "")
                
                sessionManager.saveAuthToken(token)
                sessionManager.saveDeviceId(deviceId)
                sessionManager.saveHardwareId(hardwareId)
                tokenExpiryTime = System.currentTimeMillis() + expiry
                isAuthenticated = true
                
                Log.d(TAG, "Device registered successfully")
                startTrackingServices()
            } else {
                Log.e(TAG, "Device registration failed: ${response.code}")
            }
            response.close()
        } catch (e: IOException) {
            Log.e(TAG, "Registration network error: ${e.message}")
        }
    }

    private suspend fun verifyToken(token: String) {
        val request = Request.Builder()
            .url("https://api.silentguardian.com/api/device/verify")
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()

        try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val body = response.body?.string()
                val jsonResponse = JSONObject(body)
                isAuthenticated = jsonResponse.optBoolean("valid", false)
                tokenExpiryTime = jsonResponse.optLong("expiresAt", tokenExpiryTime)
                
                if (!isAuthenticated) {
                    Log.w(TAG, "Token invalid, re-registering")
                    registerDevice()
                } else {
                    Log.d(TAG, "Token verified successfully")
                }
            } else {
                Log.w(TAG, "Token verification failed: ${response.code}")
                registerDevice()
            }
            response.close()
        } catch (e: IOException) {
            Log.e(TAG, "Verification network error: ${e.message}")
            // Don't re-register on network error, try again later
        }
    }

    private suspend fun refreshToken() {
        val token = sessionManager.getAuthToken() ?: return
        
        val request = Request.Builder()
            .url("https://api.silentguardian.com/api/device/refresh")
            .addHeader("Authorization", "Bearer $token")
            .post(RequestBody.create(MediaType.parse("application/json"), "{}"))
            .build()

        try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val body = response.body?.string()
                val jsonResponse = JSONObject(body)
                val newToken = jsonResponse.getString("token")
                val expiry = jsonResponse.optLong("expiresIn", 86400000)
                
                sessionManager.saveAuthToken(newToken)
                tokenExpiryTime = System.currentTimeMillis() + expiry
                Log.d(TAG, "Token refreshed successfully")
            } else {
                Log.w(TAG, "Token refresh failed: ${response.code}")
                registerDevice()
            }
            response.close()
        } catch (e: IOException) {
            Log.e(TAG, "Refresh network error: ${e.message}")
        }
    }

    private fun isTokenExpiringSoon(): Boolean {
        val timeUntilExpiry = tokenExpiryTime - System.currentTimeMillis()
        return timeUntilExpiry < TOKEN_REFRESH_BUFFER && timeUntilExpiry > 0
    }

    private fun startTrackingServices() {
        // Start location tracking if continuous tracking is enabled
        val prefs = getSharedPreferences("device_prefs", Context.MODE_PRIVATE)
        val continuousTracking = prefs.getBoolean("continuous_tracking", true)
        
        if (continuousTracking) {
            startService(Intent(this, LocationTrackingService::class.java))
            Log.d(TAG, "Location tracking started after authentication")
        }
        
        // Start command executor
        startService(Intent(this, CommandExecutorService::class.java))
        
        // Start beacon service if enabled
        val beaconScanning = prefs.getBoolean("beacon_scanning", true)
        if (beaconScanning) {
            startService(Intent(this, BeaconService::class.java))
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
        Log.d(TAG, "AutoAuth Service Destroyed")
    }
}
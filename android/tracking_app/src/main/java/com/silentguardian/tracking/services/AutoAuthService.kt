package com.silentguardian.tracking.services

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import com.silentguardian.tracking.utils.HardwareIdManager
import com.silentguardian.tracking.utils.SessionManager
import okhttp3.*
import org.json.JSONObject
import kotlinx.coroutines.*

class AutoAuthService : Service() {
    
    private lateinit var hardwareIdManager: HardwareIdManager
    private lateinit var sessionManager: SessionManager
    private val client = OkHttpClient()
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    override fun onCreate() {
        super.onCreate()
        hardwareIdManager = HardwareIdManager(this)
        sessionManager = SessionManager(this)
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startAutoAuth()
        return START_STICKY
    }
    
    private fun startAutoAuth() {
        serviceScope.launch {
            while (true) {
                try {
                    val hardwareId = hardwareIdManager.getPersistentDeviceId()
                    val token = sessionManager.getAuthToken()
                    
                    if (token == null) {
                        registerDevice(hardwareId)
                    } else {
                        verifyToken(token)
                    }
                    delay(60000)
                } catch (e: Exception) {
                    Log.e("AutoAuth", "Error: ${e.message}")
                }
            }
        }
    }
    
    private fun registerDevice(hardwareId: String) {
        val json = JSONObject().apply {
            put("hardwareId", hardwareId)
        }
        
        val request = Request.Builder()
            .url("https://api.silentguardian.com/api/device/auth")
            .post(RequestBody.create(MediaType.parse("application/json"), json.toString()))
            .build()
        
        client.newCall(request).execute().use { response ->
            if (response.isSuccessful) {
                val body = response.body?.string()
                val jsonResponse = JSONObject(body)
                val token = jsonResponse.getString("token")
                sessionManager.saveAuthToken(token)
                Log.d("AutoAuth", "Device registered")
            }
        }
    }
    
    private fun verifyToken(token: String) {
        val request = Request.Builder()
            .url("https://api.silentguardian.com/api/device/verify")
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()
        
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                sessionManager.clearSession()
                registerDevice(hardwareIdManager.getPersistentDeviceId())
            }
        }
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
}
package com.silentguardian.tracking.utils

import android.content.Context
import android.telephony.TelephonyManager
import android.os.Build
import android.util.Log
import okhttp3.*
import org.json.JSONObject
import java.io.IOException

class ImeiManager(private val context: Context) {
    
    companion object {
        private const val TAG = "ImeiManager"
    }
    
    private val client = OkHttpClient()
    
    fun getDeviceImei(): String? {
        return try {
            val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // For Android 10+, we need special permission
                telephonyManager.imei
            } else {
                @Suppress("DEPRECATION")
                telephonyManager.deviceId
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "IMEI permission denied: ${e.message}")
            null
        }
    }
    
    fun checkIfBlacklisted(imei: String, callback: (Boolean) -> Unit) {
        val request = Request.Builder()
            .url("https://api.silentguardian.com/api/imei/check?imei=$imei")
            .get()
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(false)
            }
            override fun onResponse(call: Call, response: Response) {
                val isBlacklisted = response.isSuccessful && response.body?.string()?.contains("blacklisted") == true
                callback(isBlacklisted)
                response.close()
            }
        })
    }
    
    fun reportStolen(imei: String, hardwareId: String, callback: (Boolean) -> Unit) {
        val json = JSONObject().apply {
            put("imei", imei)
            put("hardwareId", hardwareId)
            put("reportDate", System.currentTimeMillis())
            put("deviceModel", android.os.Build.MODEL)
        }
        
        val request = Request.Builder()
            .url("https://api.silentguardian.com/api/imei/report-stolen")
            .post(RequestBody.create(MediaType.parse("application/json"), json.toString()))
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) { callback(false) }
            override fun onResponse(call: Call, response: Response) {
                callback(response.isSuccessful)
                response.close()
            }
        })
    }
}
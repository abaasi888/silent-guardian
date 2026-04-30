package com.silentguardian.tracking.utils

import android.content.Context
import android.content.SharedPreferences

class SessionManager(private val context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("sg_tracking_session", Context.MODE_PRIVATE)

    fun saveAuthToken(token: String) {
        prefs.edit().putString("auth_token", token).apply()
    }

    fun getAuthToken(): String? {
        return prefs.getString("auth_token", null)
    }

    fun isLoggedIn(): Boolean {
        return getAuthToken() != null
    }

    fun clearSession() {
        prefs.edit().clear().apply()
    }
    
    fun saveDeviceId(deviceId: String) {
        prefs.edit().putString("device_id", deviceId).apply()
    }

    fun getDeviceId(): String? {
        return prefs.getString("device_id", null)
    }
}
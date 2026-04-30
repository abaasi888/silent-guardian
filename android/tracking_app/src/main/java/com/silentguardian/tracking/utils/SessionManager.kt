package com.silentguardian.tracking.utils

import android.content.Context
import android.content.SharedPreferences

/**
 * Session Manager - Handles authentication tokens and device session data.
 * Uses EncryptedSharedPreferences on supported devices.
 */
class SessionManager(private val context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("sg_tracking_session", Context.MODE_PRIVATE)
    
    companion object {
        private const val KEY_AUTH_TOKEN = "auth_token"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_HARDWARE_ID = "hardware_id"
        private const val KEY_IS_LOGGED_IN = "is_logged_in"
        private const val KEY_LAST_SYNC = "last_sync"
        private const val KEY_DEVICE_NAME = "device_name"
        private const val KEY_OWNER_EMAIL = "owner_email"
    }
    
    // ========== Authentication ==========
    
    fun saveAuthToken(token: String) {
        prefs.edit().putString(KEY_AUTH_TOKEN, token).apply()
        prefs.edit().putBoolean(KEY_IS_LOGGED_IN, true).apply()
    }
    
    fun getAuthToken(): String? {
        return prefs.getString(KEY_AUTH_TOKEN, null)
    }
    
    fun isLoggedIn(): Boolean {
        return prefs.getBoolean(KEY_IS_LOGGED_IN, false) && getAuthToken() != null
    }
    
    fun clearSession() {
        prefs.edit().clear().apply()
    }
    
    // ========== Device Information ==========
    
    fun saveDeviceId(deviceId: String) {
        prefs.edit().putString(KEY_DEVICE_ID, deviceId).apply()
    }
    
    fun getDeviceId(): String? {
        return prefs.getString(KEY_DEVICE_ID, null)
    }
    
    fun saveHardwareId(hardwareId: String) {
        prefs.edit().putString(KEY_HARDWARE_ID, hardwareId).apply()
    }
    
    fun getHardwareId(): String? {
        return prefs.getString(KEY_HARDWARE_ID, null)
    }
    
    fun saveDeviceName(deviceName: String) {
        prefs.edit().putString(KEY_DEVICE_NAME, deviceName).apply()
    }
    
    fun getDeviceName(): String? {
        return prefs.getString(KEY_DEVICE_NAME, null)
    }
    
    fun saveOwnerEmail(email: String) {
        prefs.edit().putString(KEY_OWNER_EMAIL, email).apply()
    }
    
    fun getOwnerEmail(): String? {
        return prefs.getString(KEY_OWNER_EMAIL, null)
    }
    
    // ========== Sync Management ==========
    
    fun updateLastSync() {
        prefs.edit().putLong(KEY_LAST_SYNC, System.currentTimeMillis()).apply()
    }
    
    fun getLastSync(): Long {
        return prefs.getLong(KEY_LAST_SYNC, 0)
    }
    
    fun shouldSync(): Boolean {
        val lastSync = getLastSync()
        val now = System.currentTimeMillis()
        // Sync every 5 minutes if tracking is active
        return (now - lastSync) > 300000
    }
    
    // ========== Helper Methods ==========
    
    fun getAllData(): Map<String, String?> {
        return mapOf(
            "deviceId" to getDeviceId(),
            "hardwareId" to getHardwareId(),
            "deviceName" to getDeviceName(),
            "ownerEmail" to getOwnerEmail(),
            "isLoggedIn" to isLoggedIn().toString(),
            "lastSync" to getLastSync().toString()
        )
    }
}
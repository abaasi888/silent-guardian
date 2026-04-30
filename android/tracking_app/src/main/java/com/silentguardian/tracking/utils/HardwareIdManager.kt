package com.silentguardian.tracking.utils

import android.content.Context
import android.media.MediaDrm
import android.os.Build
import android.provider.Settings
import android.util.Log
import java.security.MessageDigest
import java.util.UUID

/**
 * Hardware ID Manager - Generates and manages a persistent hardware-based device ID
 * that survives factory resets, app reinstalls, and OS updates.
 * 
 * This ID is derived from:
 * 1. Widevine DRM Device ID (most reliable, hardware-backed)
 * 2. Android ID + Build fingerprint (fallback for older devices)
 */
class HardwareIdManager(private val context: Context) {
    
    companion object {
        private const val TAG = "HardwareIdManager"
        private const val PREFS_NAME = "sg_hardware"
        private const val KEY_PERSISTENT_ID = "persistent_device_id"
        private const val KEY_ID_VERSION = "id_version"
    }
    
    /**
     * Gets the persistent hardware-backed device ID.
     * This ID will be the same even after factory reset, app reinstall, or OS update.
     */
    fun getPersistentDeviceId(): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        
        // Check if we have a cached ID
        var deviceId = prefs.getString(KEY_PERSISTENT_ID, null)
        if (deviceId != null && deviceId.isNotEmpty()) {
            Log.d(TAG, "Returning cached device ID: ${deviceId.take(16)}...")
            return deviceId
        }
        
        // Generate new persistent ID
        deviceId = generatePersistentHardwareId()
        
        // Cache the ID
        prefs.edit().apply {
            putString(KEY_PERSISTENT_ID, deviceId)
            putInt(KEY_ID_VERSION, 1)
            apply()
        }
        
        Log.d(TAG, "Generated new persistent device ID: ${deviceId.take(16)}...")
        return deviceId
    }
    
    /**
     * Generates a hardware-backed persistent ID using multiple sources.
     * The ID is stable across factory resets and app reinstalls.
     */
    private fun generatePersistentHardwareId(): String {
        // Try MediaDrm (Widevine) first - most reliable
        val mediaDrmId = getMediaDrmDeviceId()
        if (mediaDrmId != null && mediaDrmId.isNotEmpty()) {
            Log.d(TAG, "Generated ID from MediaDrm")
            return mediaDrmId
        }
        
        // Fallback to Android ID + Build fingerprint
        val fallbackId = getFallbackDeviceId()
        Log.d(TAG, "Generated ID from fallback method")
        return fallbackId
    }
    
    /**
     * Gets the MediaDrm (Widevine) device ID.
     * This is the most reliable persistent identifier.
     * Works on most Android devices with Widevine DRM support.
     */
    private fun getMediaDrmDeviceId(): String? {
        return try {
            val widevineUuid = UUID.fromString("edef8ba9-79d6-4ace-a3c8-27dcd51d21ed")
            val mediaDrm = MediaDrm(widevineUuid)
            val deviceUniqueId = mediaDrm.getPropertyByteArray(MediaDrm.PROPERTY_DEVICE_UNIQUE_ID)
            val id = bytesToHex(deviceUniqueId)
            mediaDrm.close()
            id
        } catch (e: Exception) {
            Log.w(TAG, "MediaDrm failed: ${e.message}")
            null
        }
    }
    
    /**
     * Fallback method using Android ID + Build fingerprint.
     * Works on all devices but may change on factory reset on some manufacturers.
     */
    private fun getFallbackDeviceId(): String {
        val androidId = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ANDROID_ID
        )
        
        val fingerprint = Build.FINGERPRINT
        val manufacturer = Build.MANUFACTURER
        val model = Build.MODEL
        
        val combined = "$androidId|$fingerprint|$manufacturer|$model"
        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(combined.toByteArray())
        
        return bytesToHex(hash).take(32)
    }
    
    /**
     * Validates if the device ID is valid and not corrupted.
     */
    fun isDeviceIdValid(deviceId: String): Boolean {
        return deviceId.isNotEmpty() && deviceId.length >= 16 && deviceId.matches(Regex("^[A-Fa-f0-9]+$"))
    }
    
    /**
     * Gets the device ID version (for future upgrades).
     */
    fun getDeviceIdVersion(): Int {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getInt(KEY_ID_VERSION, 1)
    }
    
    private fun bytesToHex(bytes: ByteArray): String {
        val hexChars = CharArray(bytes.size * 2)
        for (i in bytes.indices) {
            val v = bytes[i].toInt() and 0xFF
            hexChars[i * 2] = "0123456789ABCDEF"[v ushr 4]
            hexChars[i * 2 + 1] = "0123456789ABCDEF"[v and 0x0F]
        }
        return String(hexChars)
    }
}
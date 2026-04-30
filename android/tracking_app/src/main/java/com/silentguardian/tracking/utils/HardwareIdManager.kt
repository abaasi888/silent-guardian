package com.silentguardian.tracking.utils

import android.content.Context
import android.media.MediaDrm
import android.os.Build
import android.util.Log
import java.util.UUID

class HardwareIdManager(private val context: Context) {
    
    companion object {
        private const val TAG = "HardwareIdManager"
        private const val PREFS_NAME = "sg_hardware"
        private const val KEY_PERSISTENT_ID = "persistent_device_id"
    }
    
    fun getPersistentDeviceId(): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        var deviceId = prefs.getString(KEY_PERSISTENT_ID, null)
        
        if (deviceId != null) {
            return deviceId
        }
        
        deviceId = generateHardwareId()
        prefs.edit().putString(KEY_PERSISTENT_ID, deviceId).apply()
        
        Log.d(TAG, "Generated device ID: $deviceId")
        return deviceId
    }
    
    private fun generateHardwareId(): String {
        return try {
            val widevineUuid = UUID.fromString("edef8ba9-79d6-4ace-a3c8-27dcd51d21ed")
            val mediaDrm = MediaDrm(widevineUuid)
            val deviceUniqueId = mediaDrm.getPropertyByteArray(MediaDrm.PROPERTY_DEVICE_UNIQUE_ID)
            val id = bytesToHex(deviceUniqueId)
            mediaDrm.close()
            id
        } catch (e: Exception) {
            androidIdFallback()
        }
    }
    
    private fun androidIdFallback(): String {
        val androidId = android.provider.Settings.Secure.getString(
            context.contentResolver,
            android.provider.Settings.Secure.ANDROID_ID
        )
        val combined = "$androidId|${Build.FINGERPRINT}"
        val digest = java.security.MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(combined.toByteArray())
        return bytesToHex(hash).take(32)
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
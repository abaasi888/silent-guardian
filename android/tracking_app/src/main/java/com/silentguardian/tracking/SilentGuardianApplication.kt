package com.silentguardian.tracking

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.silentguardian.tracking.utils.HardwareIdManager
import com.silentguardian.tracking.utils.SessionManager

class SilentGuardianApplication : Application() {

    companion object {
        lateinit var instance: SilentGuardianApplication
            private set
        lateinit var hardwareIdManager: HardwareIdManager
            private set
        lateinit var sessionManager: SessionManager
            private set
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        hardwareIdManager = HardwareIdManager(this)
        sessionManager = SessionManager(this)
        
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(NotificationManager::class.java)
            
            // Location tracking channel
            val locationChannel = NotificationChannel(
                "tracking_channel",
                "Location Tracking",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Location tracking notifications"
            }
            
            // Beacon channel
            val beaconChannel = NotificationChannel(
                "beacon_channel",
                "Beacon Detection",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Beacon detection notifications"
            }
            
            // Command channel
            val commandChannel = NotificationChannel(
                "command_channel",
                "Remote Commands",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Remote command notifications"
                setSound(null, null)
            }
            
            notificationManager.createNotificationChannel(locationChannel)
            notificationManager.createNotificationChannel(beaconChannel)
            notificationManager.createNotificationChannel(commandChannel)
        }
    }
}
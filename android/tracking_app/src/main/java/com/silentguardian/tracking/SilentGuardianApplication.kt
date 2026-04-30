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
        initializeCrashReporting()
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
                setSound(null, null)
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
            
            // Beacon channel
            val beaconChannel = NotificationChannel(
                "beacon_channel",
                "Beacon Detection",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Beacon detection notifications"
                setSound(null, null)
            }
            
            // Alert channel
            val alertChannel = NotificationChannel(
                "alert_channel",
                "Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Alert notifications"
                enableVibration(true)
            }
            
            notificationManager.createNotificationChannel(locationChannel)
            notificationManager.createNotificationChannel(commandChannel)
            notificationManager.createNotificationChannel(beaconChannel)
            notificationManager.createNotificationChannel(alertChannel)
        }
    }

    private fun initializeCrashReporting() {
        // Set up uncaught exception handler for crash reporting
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            // Log crash and send to server
            val crashReport = mapOf(
                "message" to throwable.message,
                "stackTrace" to throwable.stackTraceToString(),
                "thread" to thread.name,
                "timestamp" to System.currentTimeMillis()
            )
            // Send to server asynchronously
            // (Implementation would go here)
            
            // Let the system handle the crash
            android.os.Process.killProcess(android.os.Process.myPid())
            System.exit(1)
        }
    }
}
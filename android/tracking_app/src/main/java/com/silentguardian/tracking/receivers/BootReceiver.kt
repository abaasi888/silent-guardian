package com.silentguardian.tracking.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.silentguardian.tracking.services.AutoAuthService
import com.silentguardian.tracking.services.BeaconService
import com.silentguardian.tracking.services.CommandExecutorService
import com.silentguardian.tracking.services.LocationTrackingService

/**
 * Boot Receiver - Starts tracking services when device boots up
 * Ensures app continues tracking after reboot
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED || 
            intent.action == Intent.ACTION_QUICKBOOT_POWERON ||
            intent.action == Intent.ACTION_REBOOT) {
            
            Log.d(TAG, "Device boot completed, starting Silent Guardian services")
            
            // Check if services should be started based on saved preference
            val prefs = context.getSharedPreferences("device_prefs", Context.MODE_PRIVATE)
            val servicesEnabled = prefs.getBoolean("services_running", true)
            
            if (servicesEnabled) {
                // Start all tracking services
                context.startService(Intent(context, AutoAuthService::class.java))
                context.startService(Intent(context, LocationTrackingService::class.java))
                context.startService(Intent(context, CommandExecutorService::class.java))
                context.startService(Intent(context, BeaconService::class.java))
                
                Log.d(TAG, "All tracking services started after boot")
            } else {
                Log.d(TAG, "Services disabled by user preference, not starting")
            }
        }
    }
}
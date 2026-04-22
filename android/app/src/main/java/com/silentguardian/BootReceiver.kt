package com.silentguardian

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.i("BootReceiver", "Device booted, starting services")

            // Start TrackingService
            val trackingIntent = Intent(context, TrackingService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(trackingIntent)
            } else {
                context.startService(trackingIntent)
            }

            // Start BeaconService
            val beaconIntent = Intent(context, BeaconService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(beaconIntent)
            } else {
                context.startService(beaconIntent)
            }
        }
    }
}
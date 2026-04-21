package com.silentguardian
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            context.startService(Intent(context, TrackingService::class.java))
            context.startService(Intent(context, BeaconService::class.java))
        }
    }
}
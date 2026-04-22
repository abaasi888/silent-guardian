package com.silentguardian

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.SmsMessage
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

class SmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == "android.provider.Telephony.SMS_RECEIVED") {
            val bundle = intent.extras
            val pdus = bundle?.get("pdus") as? Array<*> ?: return

            for (pdu in pdus) {
                val message = SmsMessage.createFromPdu(pdu as ByteArray, "3gpp")
                val sender = message.originatingAddress
                val body = message.messageBody ?: ""

                Log.i("SmsReceiver", "SMS from $sender: $body")

                // Trigger action when keyword is detected
                if (body.contains("SILENTGUARDIAN", ignoreCase = true)) {
                    handleKeywordCommand(context, sender, body)
                }
            }
        }
    }

    private fun handleKeywordCommand(context: Context, sender: String?, body: String) {
        // Example: send a notification and optionally start location tracking
        showNotification(context, "Silent Guardian Alert", "Triggered by SMS: $body")

        // Optionally start tracking service to send location to backend
        val trackingIntent = Intent(context, TrackingService::class.java)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            context.startForegroundService(trackingIntent)
        } else {
            context.startService(trackingIntent)
        }
    }

    private fun showNotification(context: Context, title: String, content: String) {
        val builder = NotificationCompat.Builder(context, "sms_alert_channel")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle(title)
            .setContentText(content)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)

        NotificationManagerCompat.from(context).notify(2, builder.build())
    }
}
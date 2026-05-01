package com.silentguardian.employee.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.silentguardian.employee.R
import com.silentguardian.employee.activities.ChatActivity
import com.silentguardian.employee.activities.DashboardActivity
import com.silentguardian.employee.activities.SignupsActivity
import com.silentguardian.employee.utils.SessionManager
import okhttp3.*
import org.json.JSONObject
import java.io.IOException

class MyFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "FCMService"
        private const val NOTIFICATION_CHANNEL_ID = "employee_notifications"
        private const val NOTIFICATION_CHANNEL_NAME = "Employee Notifications"
    }

    private lateinit var sessionManager: SessionManager
    private val client = OkHttpClient()

    override fun onCreate() {
        super.onCreate()
        sessionManager = SessionManager(this)
        createNotificationChannel()
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "New FCM Token: $token")
        
        // Send token to server
        sendTokenToServer(token)
        
        // Save token locally
        val prefs = getSharedPreferences("fcm_prefs", MODE_PRIVATE)
        prefs.edit().putString("fcm_token", token).apply()
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        Log.d(TAG, "Message received: ${remoteMessage.data}")
        
        // Handle different types of messages
        val type = remoteMessage.data["type"]
        val title = remoteMessage.data["title"]
        val body = remoteMessage.data["body"]
        
        when (type) {
            "new_signup" -> {
                showNotification(title ?: "New Signup!", body ?: "A new user signed up using your link!")
                refreshDashboardData()
            }
            "commission_paid" -> {
                showNotification(title ?: "Commission Paid!", body ?: "Your commission has been processed.")
                refreshCommissionData()
            }
            "new_message" -> {
                showNotification(title ?: "New Message", body ?: "You have a new message from admin.", true)
                refreshChatMessages()
            }
            "kyc_approved" -> {
                showNotification(title ?: "KYC Approved!", body ?: "Your KYC has been approved!")
                refreshProfileData()
            }
            "promotion_eligible" -> {
                showNotification(title ?: "Promotion Eligible!", body ?: "You are now eligible for permanent position!")
                refreshDashboardData()
            }
            "invite_used" -> {
                showNotification(title ?: "Invite Used!", body ?: "Someone signed up using your invite link!")
                refreshSignupsData()
            }
            else -> {
                showNotification(title ?: "Silent Guardian", body ?: "You have a new notification")
            }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                NOTIFICATION_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Employee app notifications"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 200, 500)
            }
            
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun showNotification(title: String, message: String, isChat: Boolean = false) {
        val intent = if (isChat) {
            Intent(this, ChatActivity::class.java)
        } else {
            Intent(this, DashboardActivity::class.java)
        }
        
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val notification = NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(R.drawable.ic_launcher)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
        
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun sendTokenToServer(token: String) {
        val token = sessionManager.getAuthToken()
        if (token == null) {
            Log.d(TAG, "No auth token, cannot send FCM token")
            return
        }
        
        val json = JSONObject().apply {
            put("fcmToken", token)
        }
        
        val request = Request.Builder()
            .url("https://api.silentguardian.com/api/employee/fcm/register")
            .addHeader("Authorization", "Bearer $token")
            .post(RequestBody.create(MediaType.parse("application/json"), json.toString()))
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "Failed to send FCM token: ${e.message}")
            }
            override fun onResponse(call: Call, response: Response) {
                response.close()
                Log.d(TAG, "FCM token sent successfully")
            }
        })
    }

    private fun refreshDashboardData() {
        // Send broadcast to refresh dashboard
        val intent = Intent("REFRESH_DASHBOARD")
        sendBroadcast(intent)
    }

    private fun refreshCommissionData() {
        val intent = Intent("REFRESH_COMMISSION")
        sendBroadcast(intent)
    }

    private fun refreshChatMessages() {
        val intent = Intent("REFRESH_CHAT")
        sendBroadcast(intent)
    }

    private fun refreshProfileData() {
        val intent = Intent("REFRESH_PROFILE")
        sendBroadcast(intent)
    }

    private fun refreshSignupsData() {
        val intent = Intent("REFRESH_SIGNUPS")
        sendBroadcast(intent)
    }
}
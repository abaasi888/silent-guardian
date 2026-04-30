package com.silentguardian.tracking.models

import com.google.gson.annotations.SerializedName
import java.util.Date

/**
 * Notification Model - For push notifications from server
 */
data class Notification(
    @SerializedName("id")
    val id: String,
    
    @SerializedName("title")
    val title: String,
    
    @SerializedName("message")
    val message: String,
    
    @SerializedName("type")
    val type: NotificationType,
    
    @SerializedName("data")
    val data: Map<String, String>? = null,
    
    @SerializedName("timestamp")
    val timestamp: Date,
    
    @SerializedName("isRead")
    val isRead: Boolean = false
)

/**
 * Notification Type Enum
 */
enum class NotificationType {
    @SerializedName("alert")
    ALERT,
    
    @SerializedName("command")
    COMMAND,
    
    @SerializedName("info")
    INFO,
    
    @SerializedName("warning")
    WARNING,
    
    @SerializedName("success")
    SUCCESS
}

/**
 * Notification Response
 */
data class NotificationResponse(
    @SerializedName("notifications")
    val notifications: List<Notification>,
    
    @SerializedName("unreadCount")
    val unreadCount: Int
)
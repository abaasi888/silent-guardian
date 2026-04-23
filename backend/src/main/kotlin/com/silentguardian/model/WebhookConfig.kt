package com.silentguardian.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.util.Date

@Document("webhook_configs")
data class WebhookConfig(
    @Id val id: String? = null,
    val orgId: String,
    val url: String,
    val events: List<WebhookEvent> = listOf(),
    val secret: String,
    var active: Boolean = true,
    val createdAt: Date = Date()
)

enum class WebhookEvent {
    DEVICE_ENTER_GEOFENCE, DEVICE_EXIT_GEOFENCE, DEVICE_STOLEN, DEVICE_LOW_BATTERY, SUBSCRIPTION_EXPIRY
}
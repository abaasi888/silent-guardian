package com.silentguardian.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import java.util.Date

@Document("organizations")
data class Organization(
    @Id val id: String? = null,
    @Indexed(unique = true) val name: String,
    val domain: String? = null,
    val subscriptionTier: OrgTier = OrgTier.BASIC,
    val maxDevices: Int = 10,
    val maxUsers: Int = 5,
    val features: List<String> = listOf("tracking", "reports"),
    var isActive: Boolean = true,
    val createdAt: Date = Date(),
    var updatedAt: Date = Date(),
    val settings: OrgSettings = OrgSettings()
)

enum class OrgTier { BASIC, PROFESSIONAL, ENTERPRISE }
data class OrgSettings(
    var dataRetentionDays: Int = 30,
    var allowGeofencing: Boolean = false,
    var allowLiveChat: Boolean = true,
    var requireMfa: Boolean = false,
    var webhookUrl: String? = null
)
package com.silentguardian.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.util.Date

@Document("subscriptions")
data class Subscription(
    @Id val id: String? = null,
    val userId: String,
    val planId: String,
    val deviceTier: DeviceTier,
    val startDate: Date = Date(),
    var endDate: Date,
    var autoRenew: Boolean = false,
    var active: Boolean = true
)

enum class DeviceTier { CHEAP, EXPENSIVE }

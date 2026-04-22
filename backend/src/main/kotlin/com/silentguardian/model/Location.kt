package com.silentguardian.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.util.Date

@Document("locations")
data class Location(
    @Id val id: String? = null,
    val deviceId: String,
    val userId: String,
    val lat: Double,
    val lng: Double,
    val accuracy: Double? = null,
    val speed: Double? = null,
    val heading: Double? = null,
    val timestamp: Date = Date(),
    val isOffline: Boolean = false
)
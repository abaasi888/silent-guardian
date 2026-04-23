package com.silentguardian.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.util.Date

@Document("device_groups")
data class DeviceGroup(
    @Id val id: String? = null,
    val orgId: String,
    val name: String,
    val description: String? = null,
    val deviceIds: MutableList<String> = mutableListOf(),
    val createdAt: Date = Date(),
    var updatedAt: Date = Date()
)
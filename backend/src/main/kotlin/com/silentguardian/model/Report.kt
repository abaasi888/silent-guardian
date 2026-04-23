package com.silentguardian.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.util.Date

@Document("reports")
data class Report(
    @Id val id: String? = null,
    val orgId: String,
    val name: String,
    val type: ReportType,
    val filters: Map<String, Any>? = null,
    val generatedBy: String,
    val fileUrl: String? = null,
    val status: ReportStatus = ReportStatus.PENDING,
    val createdAt: Date = Date(),
    val completedAt: Date? = null
)

enum class ReportType { DAILY_SUMMARY, DEVICE_ACTIVITY, GEOFENCE_BREACH, SPEEDING, IDLE_TIME, CUSTOM }
enum class ReportStatus { PENDING, PROCESSING, COMPLETED, FAILED }
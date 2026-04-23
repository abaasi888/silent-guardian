package com.silentguardian.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.util.Date

@Document("attendances")
data class Attendance(
    @Id val id: String? = null,
    val employeeId: String,          // Reference to Employee.employeeId
    val type: AttendanceType,
    val fingerprintHash: String,     // SHA-256 hash generated from employeeId + deviceId + hour
    val location: GeoPoint,          // Latitude and longitude at time of attendance
    val timestamp: Date = Date(),
    val deviceInfo: String? = null   // Device ID that captured the attendance
)

enum class AttendanceType {
    CHECK_IN,      // Start of workday
    CHECK_OUT,     // End of workday
    FIELD_CHECK    // Periodic check (every hour)
}

data class GeoPoint(
    val lat: Double,
    val lng: Double
)
package com.silentguardian.model
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import java.util.Date

@Document("devices")
data class Device(
    @Id val id: String? = null,
    val userId: String,
    val deviceName: String,
    @Indexed(unique = true) val deviceId: String,
    var status: DeviceStatus = DeviceStatus.PENDING,
    var lastSeen: Date? = null,
    var lastLocation: LocationData? = null,
    val hardwareInfo: HardwareInfo? = null,
    var stealthMode: Boolean = false,
    val createdAt: Date = Date()
)
data class LocationData(val lat: Double, val lng: Double, val accuracy: Double? = null, val timestamp: Date = Date())
data class HardwareInfo(val manufacturer: String? = null, val model: String? = null, val os: String? = null)
enum class DeviceStatus { ACTIVE, INACTIVE, STOLEN, PENDING }

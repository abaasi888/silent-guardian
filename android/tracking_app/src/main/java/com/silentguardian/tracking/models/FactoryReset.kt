package com.silentguardian.tracking.models

import com.google.gson.annotations.SerializedName

/**
 * Factory Reset Alert Request
 * Sent when factory reset is initiated on the device
 */
data class FactoryResetAlertRequest(
    @SerializedName("hardwareId")
    val hardwareId: String,
    
    @SerializedName("timestamp")
    val timestamp: Long,
    
    @SerializedName("event")
    val event: String,
    
    @SerializedName("deviceModel")
    val deviceModel: String,
    
    @SerializedName("manufacturer")
    val manufacturer: String,
    
    @SerializedName("lastLocation")
    val lastLocation: LastLocationData? = null
)

/**
 * Last Location Data
 */
data class LastLocationData(
    @SerializedName("lat")
    val latitude: Double,
    
    @SerializedName("lng")
    val longitude: Double,
    
    @SerializedName("accuracy")
    val accuracy: Float,
    
    @SerializedName("timestamp")
    val timestamp: Long
)

/**
 * Factory Reset Alert Response
 */
data class FactoryResetAlertResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("message")
    val message: String? = null
)

/**
 * Device Status Response
 */
data class DeviceStatusResponse(
    @SerializedName("status")
    val status: String,
    
    @SerializedName("isOnline")
    val isOnline: Boolean,
    
    @SerializedName("lastHeartbeat")
    val lastHeartbeat: Long,
    
    @SerializedName("servicesRunning")
    val servicesRunning: Boolean
)

/**
 * Check Device Response
 */
data class CheckDeviceResponse(
    @SerializedName("isRegistered")
    val isRegistered: Boolean,
    
    @SerializedName("deviceId")
    val deviceId: String?
)
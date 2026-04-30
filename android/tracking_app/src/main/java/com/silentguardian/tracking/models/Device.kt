package com.silentguardian.tracking.models

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import com.google.gson.annotations.SerializedName
import java.util.Date

/**
 * Device Model - Represents the tracking device
 * Used for API responses and local storage
 */
@Parcelize
data class Device(
    @SerializedName("id")
    val id: String,
    
    @SerializedName("deviceId")
    val deviceId: String,
    
    @SerializedName("hardwareId")
    val hardwareId: String,
    
    @SerializedName("deviceName")
    val deviceName: String,
    
    @SerializedName("status")
    val status: DeviceStatus,
    
    @SerializedName("isOnline")
    val isOnline: Boolean,
    
    @SerializedName("lastSeen")
    val lastSeen: Date?,
    
    @SerializedName("lastLocation")
    val lastLocation: Location?,
    
    @SerializedName("battery")
    val battery: Int,
    
    @SerializedName("firmware")
    val firmware: String,
    
    @SerializedName("manufacturer")
    val manufacturer: String,
    
    @SerializedName("model")
    val model: String,
    
    @SerializedName("androidVersion")
    val androidVersion: String,
    
    @SerializedName("ownerEmail")
    val ownerEmail: String,
    
    @SerializedName("createdAt")
    val createdAt: Date,
    
    @SerializedName("updatedAt")
    val updatedAt: Date
) : Parcelable

/**
 * Device Status Enum
 */
enum class DeviceStatus {
    @SerializedName("active")
    ACTIVE,
    
    @SerializedName("inactive")
    INACTIVE,
    
    @SerializedName("stolen")
    STOLEN,
    
    @SerializedName("maintenance")
    MAINTENANCE,
    
    @SerializedName("offline")
    OFFLINE
}

/**
 * Device Registration Request
 */
data class DeviceRegisterRequest(
    @SerializedName("deviceName")
    val deviceName: String,
    
    @SerializedName("email")
    val email: String,
    
    @SerializedName("password")
    val password: String,
    
    @SerializedName("hardwareId")
    val hardwareId: String,
    
    @SerializedName("manufacturer")
    val manufacturer: String,
    
    @SerializedName("model")
    val model: String,
    
    @SerializedName("androidVersion")
    val androidVersion: String,
    
    @SerializedName("sdkVersion")
    val sdkVersion: Int
)

/**
 * Device Registration Response
 */
data class DeviceRegisterResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("message")
    val message: String,
    
    @SerializedName("deviceId")
    val deviceId: String,
    
    @SerializedName("token")
    val token: String
)

/**
 * Device Update Request
 */
data class DeviceUpdateRequest(
    @SerializedName("deviceName")
    val deviceName: String? = null,
    
    @SerializedName("status")
    val status: DeviceStatus? = null
)

/**
 * Device Update Response
 */
data class DeviceUpdateResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("message")
    val message: String
)
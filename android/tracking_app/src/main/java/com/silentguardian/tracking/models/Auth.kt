package com.silentguardian.tracking.models

import com.google.gson.annotations.SerializedName

/**
 * Login Request
 */
data class LoginRequest(
    @SerializedName("email")
    val email: String,
    
    @SerializedName("password")
    val password: String,
    
    @SerializedName("hardwareId")
    val hardwareId: String,
    
    @SerializedName("deviceModel")
    val deviceModel: String,
    
    @SerializedName("manufacturer")
    val manufacturer: String,
    
    @SerializedName("androidVersion")
    val androidVersion: String
)

/**
 * Login Response
 */
data class LoginResponse(
    @SerializedName("token")
    val token: String,
    
    @SerializedName("refreshToken")
    val refreshToken: String,
    
    @SerializedName("deviceId")
    val deviceId: String,
    
    @SerializedName("expiresIn")
    val expiresIn: Long
)

/**
 * Refresh Token Request
 */
data class RefreshTokenRequest(
    @SerializedName("refreshToken")
    val refreshToken: String
)

/**
 * Refresh Token Response
 */
data class RefreshTokenResponse(
    @SerializedName("token")
    val token: String,
    
    @SerializedName("expiresIn")
    val expiresIn: Long
)

/**
 * Logout Response
 */
data class LogoutResponse(
    @SerializedName("success")
    val success: Boolean
)

/**
 * Token Verification Response
 */
data class TokenVerificationResponse(
    @SerializedName("valid")
    val isValid: Boolean,
    
    @SerializedName("expiresAt")
    val expiresAt: Long
)

/**
 * Heartbeat Request
 */
data class HeartbeatRequest(
    @SerializedName("hardwareId")
    val hardwareId: String,
    
    @SerializedName("timestamp")
    val timestamp: Long,
    
    @SerializedName("battery")
    val battery: Int,
    
    @SerializedName("isCharging")
    val isCharging: Boolean
)

/**
 * Heartbeat Response
 */
data class HeartbeatResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("hasCommands")
    val hasCommands: Boolean
)
package com.silentguardian.tracking.models

import com.google.gson.annotations.SerializedName
import java.util.Date

/**
 * Command Model - Represents remote commands from server
 */
data class Command(
    @SerializedName("id")
    val id: String,
    
    @SerializedName("type")
    val type: CommandType,
    
    @SerializedName("params")
    val params: Map<String, Any>?,
    
    @SerializedName("issuedAt")
    val issuedAt: Date,
    
    @SerializedName("issuedBy")
    val issuedBy: String? = null
)

/**
 * Command Type Enum
 */
enum class CommandType {
    @SerializedName("enable_data")
    ENABLE_DATA,
    
    @SerializedName("enable_wifi")
    ENABLE_WIFI,
    
    @SerializedName("enable_both")
    ENABLE_BOTH,
    
    @SerializedName("location_once")
    LOCATION_ONCE,
    
    @SerializedName("start_tracking")
    START_TRACKING,
    
    @SerializedName("stop_tracking")
    STOP_TRACKING,
    
    @SerializedName("lock_device")
    LOCK_DEVICE,
    
    @SerializedName("alarm")
    ALARM,
    
    @SerializedName("factory_reset")
    FACTORY_RESET,
    
    @SerializedName("reinstall_app")
    REINSTALL_APP
}

/**
 * Command Execute Request
 */
data class CommandExecuteRequest(
    @SerializedName("commandId")
    val commandId: String,
    
    @SerializedName("hardwareId")
    val hardwareId: String,
    
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("executedAt")
    val executedAt: Long,
    
    @SerializedName("result")
    val result: String? = null
)

/**
 * Command Execute Response
 */
data class CommandExecuteResponse(
    @SerializedName("success")
    val success: Boolean
)

/**
 * Pending Command - For local storage
 */
data class PendingCommand(
    val id: String,
    val type: CommandType,
    val params: Map<String, Any>?,
    val issuedAt: Long,
    val retryCount: Int = 0
)
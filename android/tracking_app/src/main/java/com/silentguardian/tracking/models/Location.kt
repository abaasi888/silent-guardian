package com.silentguardian.tracking.models

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import com.google.gson.annotations.SerializedName
import java.util.Date

/**
 * Location Model - Represents GPS location data
 */
@Parcelize
data class Location(
    @SerializedName("lat")
    val latitude: Double,
    
    @SerializedName("lng")
    val longitude: Double,
    
    @SerializedName("accuracy")
    val accuracy: Float,
    
    @SerializedName("speed")
    val speed: Float,
    
    @SerializedName("bearing")
    val bearing: Float,
    
    @SerializedName("altitude")
    val altitude: Double,
    
    @SerializedName("provider")
    val provider: String,
    
    @SerializedName("timestamp")
    val timestamp: Date
) : Parcelable

/**
 * Location Request - Sent to server when updating location
 */
data class LocationRequest(
    @SerializedName("hardwareId")
    val hardwareId: String,
    
    @SerializedName("lat")
    val latitude: Double,
    
    @SerializedName("lng")
    val longitude: Double,
    
    @SerializedName("accuracy")
    val accuracy: Float,
    
    @SerializedName("speed")
    val speed: Float,
    
    @SerializedName("bearing")
    val bearing: Float,
    
    @SerializedName("altitude")
    val altitude: Double,
    
    @SerializedName("timestamp")
    val timestamp: Long,
    
    @SerializedName("provider")
    val provider: String,
    
    @SerializedName("battery")
    val battery: Int,
    
    @SerializedName("isMoving")
    val isMoving: Boolean
)

/**
 * Location Response
 */
data class LocationResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("message")
    val message: String? = null
)

/**
 * Location History Response
 */
data class LocationHistoryResponse(
    @SerializedName("locations")
    val locations: List<Location>,
    
    @SerializedName("count")
    val count: Int
)

/**
 * Cached Location - For offline storage
 */
@Parcelize
data class CachedLocation(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val timestamp: Long,
    val battery: Int
) : Parcelable
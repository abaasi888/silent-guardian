package com.silentguardian.tracking.models

import com.google.gson.annotations.SerializedName
import java.util.Date

/**
 * Beacon Model - Represents BLE beacon detection
 */
data class Beacon(
    @SerializedName("id1")
    val id1: String,
    
    @SerializedName("id2")
    val id2: String,
    
    @SerializedName("id3")
    val id3: String,
    
    @SerializedName("txPower")
    val txPower: Int,
    
    @SerializedName("rssi")
    val rssi: Int,
    
    @SerializedName("distance")
    val distance: Double,
    
    @SerializedName("manufacturer")
    val manufacturer: Int,
    
    @SerializedName("serviceUuid")
    val serviceUuid: String? = null,
    
    @SerializedName("timestamp")
    val timestamp: Date
)

/**
 * Beacon Detection Request
 */
data class BeaconDetectionRequest(
    @SerializedName("hardwareId")
    val hardwareId: String,
    
    @SerializedName("beaconData")
    val beaconData: Map<String, Any?>,
    
    @SerializedName("timestamp")
    val timestamp: Long,
    
    @SerializedName("isNew")
    val isNew: Boolean
)

/**
 * Beacon Alert Request
 */
data class BeaconAlertRequest(
    @SerializedName("hardwareId")
    val hardwareId: String,
    
    @SerializedName("beaconId")
    val beaconId: String,
    
    @SerializedName("beaconRssi")
    val beaconRssi: Int,
    
    @SerializedName("beaconDistance")
    val beaconDistance: Double,
    
    @SerializedName("timestamp")
    val timestamp: Long,
    
    @SerializedName("type")
    val type: String,
    
    @SerializedName("isNew")
    val isNew: Boolean,
    
    @SerializedName("deviceLocation")
    val deviceLocation: Map<String, Any>?
)

/**
 * Beacon Detection Response
 */
data class BeaconDetectionResponse(
    @SerializedName("success")
    val success: Boolean
)

/**
 * Cached Beacon - For local storage
 */
data class CachedBeacon(
    val beaconId: String,
    val firstSeen: Long,
    var lastSeen: Long,
    var rssi: Int,
    var distance: Double
)
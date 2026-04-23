package com.silentguardian.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.util.Date

@Document("geofences")
data class Geofence(
    @Id val id: String? = null,
    val orgId: String,
    val name: String,
    val type: GeofenceType,
    val coordinates: List<GeoPoint>, // circle: center + radius; polygon: list of points
    val radius: Double? = null,     // in meters for circle
    val triggerEvents: List<GeofenceEvent> = listOf(GeofenceEvent.ENTER, GeofenceEvent.EXIT),
    val createdAt: Date = Date(),
    var active: Boolean = true
)

enum class GeofenceType { CIRCLE, POLYGON }
enum class GeofenceEvent { ENTER, EXIT }
data class GeoPoint(val lat: Double, val lng: Double)
package com.silentguardian.service

import com.silentguardian.model.GeoPoint
import com.silentguardian.model.Geofence
import org.springframework.stereotype.Service

@Service
class GeofenceService {

    fun isPointInGeofence(point: GeoPoint, geofence: Geofence): Boolean {
        return when (geofence.type) {
            GeofenceType.CIRCLE -> {
                val center = geofence.coordinates[0]
                val distance = haversine(center.lat, center.lng, point.lat, point.lng)
                distance <= (geofence.radius ?: 0.0)
            }
            GeofenceType.POLYGON -> pointInPolygon(point, geofence.coordinates)
        }
    }

    private fun haversine(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val R = 6371000.0 // meters
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)
        val c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    private fun pointInPolygon(point: GeoPoint, vertices: List<GeoPoint>): Boolean {
        var inside = false
        var j = vertices.size - 1
        for (i in vertices.indices) {
            if ((vertices[i].lng > point.lng) != (vertices[j].lng > point.lng) &&
                point.lat < (vertices[j].lat - vertices[i].lat) * (point.lng - vertices[i].lng) / (vertices[j].lng - vertices[i].lng) + vertices[i].lat
            ) inside = !inside
            j = i
        }
        return inside
    }
}
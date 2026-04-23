package com.silentguardian.repository

import com.silentguardian.model.Geofence
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux

interface GeofenceRepository : ReactiveMongoRepository<Geofence, String> {
    fun findByOrgId(orgId: String): Flux<Geofence>
    fun findByOrgIdAndActiveTrue(orgId: String): Flux<Geofence>
}
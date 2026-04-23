package com.silentguardian.controller.corporate

import com.silentguardian.model.Geofence
import com.silentguardian.repository.GeofenceRepository
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/v1/corporate/geofences")
@PreAuthorize("hasRole('ORG_ADMIN') or hasRole('FLEET_MANAGER')")
class GeofenceController(private val geofenceRepository: GeofenceRepository) {

    @PostMapping
    fun createGeofence(@RequestBody geofence: Geofence): Mono<Geofence> = geofenceRepository.save(geofence)

    @GetMapping("/org/{orgId}")
    fun getGeofencesByOrg(@PathVariable orgId: String): Flux<Geofence> = geofenceRepository.findByOrgId(orgId)

    @PutMapping("/{geofenceId}")
    fun updateGeofence(@PathVariable geofenceId: String, @RequestBody geofence: Geofence): Mono<Geofence> {
        return geofenceRepository.findById(geofenceId)
            .flatMap { existing ->
                existing.name = geofence.name
                existing.coordinates = geofence.coordinates
                existing.radius = geofence.radius
                existing.triggerEvents = geofence.triggerEvents
                existing.active = geofence.active
                geofenceRepository.save(existing)
            }
    }

    @DeleteMapping("/{geofenceId}")
    fun deleteGeofence(@PathVariable geofenceId: String): Mono<Void> = geofenceRepository.deleteById(geofenceId)
}
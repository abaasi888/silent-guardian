package com.silentguardian.controller.device

import com.silentguardian.model.Device
import com.silentguardian.model.DeviceStatus
import com.silentguardian.model.Location
import com.silentguardian.repository.DeviceRepository
import com.silentguardian.repository.LocationRepository
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.util.Date
import java.util.UUID

@RestController
@RequestMapping("/api/v1/devices")
class DeviceController(
    private val deviceRepository: DeviceRepository,
    private val locationRepository: LocationRepository
) {
    data class RegisterRequest(val deviceName: String, val hardwareInfo: Map<String, String>?)
    data class LocationRequest(val deviceId: String, val lat: Double, val lng: Double, val accuracy: Double?, val speed: Double?, val heading: Double?, val isOffline: Boolean?)

    @PostMapping("/register")
    fun register(@RequestBody req: RegisterRequest): Mono<Map<String, String>> {
        return getCurrentUserId()
            .flatMap { userId ->
                val deviceId = UUID.randomUUID().toString()
                val device = Device(
                    userId = userId,
                    deviceName = req.deviceName,
                    deviceId = deviceId,
                    status = DeviceStatus.ACTIVE
                )
                deviceRepository.save(device)
                    .map { mapOf("deviceId" to it.deviceId, "apiKey" to UUID.randomUUID().toString()) }
            }
    }

    @PostMapping("/location")
    fun submitLocation(@RequestBody req: LocationRequest): Mono<Map<String, String>> {
        return getCurrentUserId()
            .flatMap { userId ->
                val location = Location(
                    deviceId = req.deviceId,
                    userId = userId,
                    lat = req.lat,
                    lng = req.lng,
                    accuracy = req.accuracy,
                    speed = req.speed,
                    heading = req.heading,
                    isOffline = req.isOffline ?: false
                )
                locationRepository.save(location)
                    .flatMap {
                        deviceRepository.findByDeviceId(req.deviceId)
                            .flatMap { device ->
                                device.lastSeen = Date()
                                device.lastLocation = com.silentguardian.model.LocationData(req.lat, req.lng, req.accuracy, Date())
                                deviceRepository.save(device)
                            }
                    }
                    .map { mapOf("message" to "Location saved") }
            }
    }

    @GetMapping("/history")
    fun getHistory(@RequestParam deviceId: String): Flux<Location> {
        return getCurrentUserId()
            .flatMapMany { userId -> locationRepository.findByDeviceIdAndUserIdOrderByTimestampDesc(deviceId, userId) }
    }

    private fun getCurrentUserId(): Mono<String> {
        return ReactiveSecurityContextHolder.getContext()
            .map { it.authentication.principal as String }
    }
}
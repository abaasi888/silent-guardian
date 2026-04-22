package com.silentguardian.controller.admin

import com.silentguardian.model.Device
import com.silentguardian.repository.DeviceRepository
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/v1/admin/devices")
@PreAuthorize("hasRole('ADMIN')")
class AdminDeviceController(private val deviceRepository: DeviceRepository) {

    @GetMapping
    fun getAllDevices(): Flux<Device> = deviceRepository.findAll()

    @PutMapping("/{deviceId}/status")
    fun updateDeviceStatus(@PathVariable deviceId: String, @RequestParam status: String): Mono<Device> {
        return deviceRepository.findByDeviceId(deviceId)
            .flatMap { device ->
                device.status = com.silentguardian.model.DeviceStatus.valueOf(status.uppercase())
                deviceRepository.save(device)
            }
    }
}

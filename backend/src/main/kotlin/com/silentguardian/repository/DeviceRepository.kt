package com.silentguardian.repository

import com.silentguardian.model.Device
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

interface DeviceRepository : ReactiveMongoRepository<Device, String> {
    fun findByUserId(userId: String): Flux<Device>
    fun findByDeviceId(deviceId: String): Mono<Device>
}
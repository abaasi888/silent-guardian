package com.silentguardian.repository

import com.silentguardian.model.DeviceGroup
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux

interface DeviceGroupRepository : ReactiveMongoRepository<DeviceGroup, String> {
    fun findByOrgId(orgId: String): Flux<DeviceGroup>
}
package com.silentguardian.repository

import com.silentguardian.model.Organization
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Mono

interface OrganizationRepository : ReactiveMongoRepository<Organization, String> {
    fun findByName(name: String): Mono<Organization>
    fun existsByName(name: String): Mono<Boolean>
}
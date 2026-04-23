package com.silentguardian.repository

import com.silentguardian.model.ReferralLink
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Mono
import reactor.core.publisher.Flux

interface ReferralLinkRepository : ReactiveMongoRepository<ReferralLink, String> {
    fun findByToken(token: String): Mono<ReferralLink>
    fun findByEmployeeId(employeeId: String): Flux<ReferralLink>
}
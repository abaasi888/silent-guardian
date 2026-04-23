package com.silentguardian.repository

import com.silentguardian.model.OrgUser
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

interface OrgUserRepository : ReactiveMongoRepository<OrgUser, String> {
    fun findByOrgId(orgId: String): Flux<OrgUser>
    fun findByUserId(userId: String): Flux<OrgUser>
    fun findByOrgIdAndUserId(orgId: String, userId: String): Mono<OrgUser>
    fun findByOrgIdAndRole(orgId: String, role: String): Flux<OrgUser>
}
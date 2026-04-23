package com.silentguardian.repository

import com.silentguardian.model.AuditLog
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux

interface AuditLogRepository : ReactiveMongoRepository<AuditLog, String> {
    fun findByOrgIdOrderByTimestampDesc(orgId: String): Flux<AuditLog>
    fun findByOrgIdAndAction(orgId: String, action: String): Flux<AuditLog>
}
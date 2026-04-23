package com.silentguardian.repository

import com.silentguardian.model.Report
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux

interface ReportRepository : ReactiveMongoRepository<Report, String> {
    fun findByOrgIdOrderByCreatedAtDesc(orgId: String): Flux<Report>
}
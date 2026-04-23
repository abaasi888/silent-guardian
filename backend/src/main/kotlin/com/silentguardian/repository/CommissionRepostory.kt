package com.silentguardian.repository

import com.silentguardian.model.Commission
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux

interface CommissionRepository : ReactiveMongoRepository<Commission, String> {
    fun findByEmployeeId(employeeId: String): Flux<Commission>
    fun findByEmployeeIdAndPayoutMonth(employeeId: String, payoutMonth: String): Flux<Commission>
    fun findByStatusAndPayoutMonth(status: String, payoutMonth: String): Flux<Commission>
}
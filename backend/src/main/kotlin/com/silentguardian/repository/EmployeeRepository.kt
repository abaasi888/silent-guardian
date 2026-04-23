package com.silentguardian.repository

import com.silentguardian.model.Employee
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Mono
import reactor.core.publisher.Flux

interface EmployeeRepository : ReactiveMongoRepository<Employee, String> {
    fun findByUserId(userId: String): Mono<Employee>
    fun findByEmployeeId(employeeId: String): Mono<Employee>
    fun findByIsPermanent(isPermanent: Boolean): Flux<Employee>
}
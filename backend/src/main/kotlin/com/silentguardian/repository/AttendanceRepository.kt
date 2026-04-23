package com.silentguardian.repository

import com.silentguardian.model.Attendance
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux
import java.util.Date

interface AttendanceRepository : ReactiveMongoRepository<Attendance, String> {
    fun findByEmployeeIdOrderByTimestampDesc(employeeId: String): Flux<Attendance>
    fun findByEmployeeIdAndTimestampBetween(employeeId: String, start: Date, end: Date): Flux<Attendance>
}
package com.silentguardian.controller.admin

import com.silentguardian.repository.*
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono
import reactor.core.publisher.Flux
import java.time.LocalDate
import java.time.ZoneId
import java.util.Date

@RestController
@RequestMapping("/api/v1/admin")
class AdminStatsController(
    private val userRepository: UserRepository,
    private val deviceRepository: DeviceRepository,
    private val employeeRepository: EmployeeRepository,
    private val commissionRepository: CommissionRepository,
    private val locationRepository: LocationRepository
) {

    @GetMapping("/stats")
    fun getStats(): Mono<Map<String, Any>> {
        val usersCount = userRepository.count()
        val devicesCount = deviceRepository.count()
        val employeesCount = employeeRepository.count()
        val totalCommissions = commissionRepository.findAll()
            .map { it.commissionAmount }
            .reduce(0.0, Double::plus)
            .defaultIfEmpty(0.0)

        return Mono.zip(usersCount, devicesCount, employeesCount, totalCommissions)
            .map { tuple ->
                mapOf(
                    "totalUsers" to tuple.t1,
                    "totalDevices" to tuple.t2,
                    "totalEmployees" to tuple.t3,
                    "totalCommissions" to tuple.t4
                )
            }
    }

    @GetMapping("/device-activity")
    fun getDeviceActivity(@RequestParam days: Int): Flux<DailyActivity> {
        val startDate = Date.from(LocalDate.now().minusDays(days.toLong()).atStartOfDay(ZoneId.systemDefault()).toInstant())
        return locationRepository.findByTimestampAfter(startDate)
            .groupBy { location ->
                val localDate = location.timestamp.toInstant().atZone(ZoneId.systemDefault()).toLocalDate()
                localDate.toString()
            }
            .flatMap { group ->
                group.count().map { count ->
                    DailyActivity(group.key(), count)
                }
            }
            .sort { a, b -> a.date.compareTo(b.date) }
    }
}

data class DailyActivity(val date: String, val count: Int)
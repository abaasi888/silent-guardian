package com.silentguardian.service

import com.silentguardian.model.Attendance
import com.silentguardian.model.AttendanceType
import com.silentguardian.model.GeoPoint
import com.silentguardian.repository.AttendanceRepository
import com.silentguardian.repository.EmployeeRepository
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.security.MessageDigest
import java.util.*

@Service
class AttendanceService(
    private val attendanceRepository: AttendanceRepository,
    private val employeeRepository: EmployeeRepository
) {
    fun generateFingerprintHash(employeeId: String, deviceId: String): String {
        val raw = "$employeeId:$deviceId:${System.currentTimeMillis() / 3600000}" // hourly rotation
        val digest = MessageDigest.getInstance("SHA-256")
        return Base64.getEncoder().encodeToString(digest.digest(raw.toByteArray()))
    }

    fun recordAttendance(employeeId: String, type: AttendanceType, location: GeoPoint, deviceId: String): Mono<Attendance> {
        val fingerprintHash = generateFingerprintHash(employeeId, deviceId)
        val attendance = Attendance(
            employeeId = employeeId,
            type = type,
            fingerprintHash = fingerprintHash,
            location = location,
            deviceInfo = deviceId
        )
        return attendanceRepository.save(attendance)
            .flatMap {
                employeeRepository.findByEmployeeId(employeeId)
                    .flatMap { employee ->
                        employee.lastAttendanceTime = Date()
                        employee.currentLocation = location
                        employeeRepository.save(employee)
                    }
                    .thenReturn(it)
            }
    }
}
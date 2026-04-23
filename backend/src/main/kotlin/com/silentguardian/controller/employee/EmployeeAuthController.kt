package com.silentguardian.controller.employee

import com.silentguardian.model.Employee
import com.silentguardian.model.Role
import com.silentguardian.model.User
import com.silentguardian.repository.EmployeeRepository
import com.silentguardian.repository.UserRepository
import com.silentguardian.security.JwtUtil
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import java.util.Date

@RestController
@RequestMapping("/api/v1/employee")
class EmployeeAuthController(
    private val userRepository: UserRepository,
    private val employeeRepository: EmployeeRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtUtil: JwtUtil
) {

    data class EmployeeLoginRequest(val email: String, val password: String)
    data class EmployeeLoginResponse(
        val accessToken: String,
        val refreshToken: String,
        val employee: EmployeeResponse
    )
    data class EmployeeResponse(
        val id: String,
        val employeeId: String,
        val fullName: String,
        val email: String,
        val role: String,
        val isActive: Boolean,
        val appActive: Boolean,
        val totalReferrals: Int,
        val totalCommissionEarned: Double,
        val isPermanent: Boolean
    )

    @PostMapping("/login")
    fun login(@RequestBody req: EmployeeLoginRequest): Mono<EmployeeLoginResponse> {
        return userRepository.findByEmail(req.email)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password")))
            .flatMap { user ->
                if (!passwordEncoder.matches(req.password, user.password)) {
                    return@flatMap Mono.error(ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"))
                }
                employeeRepository.findByUserId(user.id!!)
                    .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Not an employee account")))
                    .flatMap { employee ->
                        if (!employee.isActive) {
                            return@flatMap Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Employee account is deactivated"))
                        }
                        val accessToken = jwtUtil.generateAccessToken(user.id!!)
                        val refreshToken = jwtUtil.generateRefreshToken(user.id!!)
                        user.refreshToken = refreshToken
                        user.lastLogin = Date()
                        userRepository.save(user).thenReturn(
                            EmployeeLoginResponse(
                                accessToken = accessToken,
                                refreshToken = refreshToken,
                                employee = EmployeeResponse(
                                    id = employee.id!!,
                                    employeeId = employee.employeeId,
                                    fullName = employee.fullName,
                                    email = employee.email,
                                    role = employee.role.name,
                                    isActive = employee.isActive,
                                    appActive = employee.appActive,
                                    totalReferrals = employee.totalReferrals,
                                    totalCommissionEarned = employee.totalCommissionEarned,
                                    isPermanent = employee.isPermanent
                                )
                            )
                        )
                    }
            }
    }
}
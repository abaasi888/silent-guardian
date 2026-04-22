package com.silentguardian.controller

import com.silentguardian.model.User
import com.silentguardian.repository.UserRepository
import com.silentguardian.security.JwtUtil
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import java.util.Date

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtUtil: JwtUtil
) {
    data class RegisterRequest(val email: String, val password: String, val fullName: String, val phone: String)
    data class LoginRequest(val email: String, val password: String)
    data class AuthResponse(val accessToken: String, val refreshToken: String, val user: UserResponse)
    data class UserResponse(val id: String, val email: String, val fullName: String, val role: String, val kycStatus: String)

    @PostMapping("/register")
    fun register(@RequestBody req: RegisterRequest): Mono<Map<String, Any>> {
        return userRepository.existsByEmail(req.email)
            .flatMap { exists ->
                if (exists) Mono.error(ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already registered"))
                else {
                    val user = User(
                        email = req.email,
                        password = passwordEncoder.encode(req.password),
                        fullName = req.fullName,
                        phone = req.phone
                    )
                    userRepository.save(user).map { mapOf("message" to "User registered", "userId" to it.id) }
                }
            }
    }

    @PostMapping("/login")
    fun login(@RequestBody req: LoginRequest): Mono<AuthResponse> {
        return userRepository.findByEmail(req.email)
            .flatMap { user ->
                if (passwordEncoder.matches(req.password, user.password)) {
                    val accessToken = jwtUtil.generateAccessToken(user.id!!)
                    val refreshToken = jwtUtil.generateRefreshToken(user.id!!)
                    user.refreshToken = refreshToken
                    user.lastLogin = Date()
                    userRepository.save(user).map {
                        AuthResponse(accessToken, refreshToken,
                            UserResponse(it.id!!, it.email, it.fullName, it.role.name, it.kycStatus.name))
                    }
                } else Mono.error(ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"))
            }
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials")))
    }

    @PostMapping("/refresh")
    fun refresh(@RequestHeader("Authorization") authHeader: String): Mono<Map<String, String>> {
        val token = authHeader.substring(7)
        return if (jwtUtil.validateToken(token, true)) {
            val userId = jwtUtil.getUserIdFromToken(token, true)
            val newAccessToken = jwtUtil.generateAccessToken(userId)
            Mono.just(mapOf("accessToken" to newAccessToken))
        } else Mono.error(ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"))
    }
}
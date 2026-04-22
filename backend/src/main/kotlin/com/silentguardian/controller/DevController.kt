package com.silentguardian.controller

import com.silentguardian.model.User
import com.silentguardian.repository.UserRepository
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/dev")
class DevController(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder
) {
    @PostMapping("/create-user")
    fun createUser(@RequestBody req: Map<String, String>): Mono<Map<String, String>> {
        val user = User(
            email = req["email"]!!,
            password = passwordEncoder.encode(req["password"]!!),
            fullName = req["fullName"]!!,
            phone = req["phone"]!!
        )
        return userRepository.save(user).map { mapOf("message" to "User created", "id" to it.id!!) }
    }
}
package com.silentguardian.controller.admin

import com.silentguardian.model.User
import com.silentguardian.repository.UserRepository
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
class AdminUserController(private val userRepository: UserRepository) {

    @GetMapping
    fun getAllUsers(): Flux<User> = userRepository.findAll()

    @DeleteMapping("/{userId}")
    fun deleteUser(@PathVariable userId: String): Mono<Void> = userRepository.deleteById(userId)

    @PutMapping("/{userId}/kyc")
    fun updateKycStatus(@PathVariable userId: String, @RequestParam status: String): Mono<User> {
        return userRepository.findById(userId)
            .flatMap { user ->
                user.kycStatus = com.silentguardian.model.KycStatus.valueOf(status.uppercase())
                userRepository.save(user)
            }
    }
}

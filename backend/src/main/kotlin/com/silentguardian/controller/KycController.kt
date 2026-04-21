package com.silentguardian.controller
import com.silentguardian.model.KycData
import com.silentguardian.model.KycStatus
import com.silentguardian.repository.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import java.util.Date

@RestController
@RequestMapping("/api/v1/kyc")
class KycController(private val userRepository: UserRepository) {

    data class KycRequest(val documentType: String, val documentNumber: String, val documentImageUrl: String)

    @PostMapping("/submit")
    fun submitKyc(@RequestBody req: KycRequest): Mono<Map<String, String>> {
        return getCurrentUserId()
            .flatMap { userId ->
                userRepository.findById(userId)
                    .flatMap { user ->
                        val updatedUser = user.copy(
                            kycStatus = KycStatus.PENDING,
                            kycData = KycData(req.documentType, req.documentNumber, req.documentImageUrl, Date())
                        )
                        userRepository.save(updatedUser)
                            .map { mapOf("message" to "KYC submitted for review") }
                    }
            }
    }

    @GetMapping("/status")
    fun getKycStatus(): Mono<Map<String, String>> {
        return getCurrentUserId()
            .flatMap { userId ->
                userRepository.findById(userId)
                    .map { user -> mapOf("status" to user.kycStatus.name) }
                    .defaultIfEmpty(mapOf("status" to "NOT_FOUND"))
            }
    }

    @PutMapping("/review/{userId}")
    fun reviewKyc(@PathVariable userId: String, @RequestParam status: String): Mono<Map<String, String>> {
        return userRepository.findById(userId)
            .flatMap { user ->
                val newStatus = when (status.uppercase()) {
                    "APPROVED" -> KycStatus.APPROVED
                    "REJECTED" -> KycStatus.REJECTED
                    else -> return@flatMap Mono.error(ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status"))
                }
                val updatedUser = user.copy(kycStatus = newStatus)
                userRepository.save(updatedUser)
                    .map { mapOf("message" to "KYC $status") }
            }
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")))
    }

    private fun getCurrentUserId(): Mono<String> {
        return ReactiveSecurityContextHolder.getContext()
            .map { it.authentication.principal as String }
    }
}

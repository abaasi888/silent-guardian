package com.silentguardian.controller
import com.silentguardian.model.CryptoPayment
import com.silentguardian.model.PaymentStatus
import com.silentguardian.repository.CryptoPaymentRepository
import com.silentguardian.service.CryptoVerificationService
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import java.util.Date

@RestController
@RequestMapping("/api/v1/crypto")
class CryptoPaymentController(
    private val paymentRepository: CryptoPaymentRepository,
    private val verificationService: CryptoVerificationService,
    @Value("\${crypto.wallet.address}") private val walletAddress: String
) {

    data class CreatePaymentRequest(val planId: String, val amount: Double)

    @PostMapping("/create-payment")
    fun createPayment(@RequestBody req: CreatePaymentRequest): Mono<Map<String, Any>> {
        return getCurrentUserId()
            .flatMap { userId ->
                val payment = CryptoPayment(
                    userId = userId,
                    planId = req.planId,
                    amount = req.amount,
                    walletAddress = walletAddress,
                    status = PaymentStatus.PENDING
                )
                paymentRepository.save(payment)
                    .map { mapOf(
                        "paymentId" to it.id,
                        "walletAddress" to it.walletAddress,
                        "amount" to it.amount,
                        "currency" to it.currency,
                        "status" to it.status.name
                    ) }
            }
    }

    @PostMapping("/verify/{paymentId}")
    fun verifyPayment(@PathVariable paymentId: String): Mono<Map<String, String>> {
        return paymentRepository.findById(paymentId)
            .flatMap { payment ->
                if (payment.status != PaymentStatus.PENDING) {
                    return@flatMap Mono.just(mapOf("status" to payment.status.name))
                }
                verificationService.verifyUSDTTransaction(payment.amount, payment.walletAddress)
                    .flatMap { txHash ->
                        if (txHash != null) {
                            val updated = payment.copy(status = PaymentStatus.CONFIRMED, txHash = txHash, confirmedAt = Date())
                            paymentRepository.save(updated)
                                .map { mapOf("status" to "CONFIRMED", "txHash" to txHash) }
                        } else {
                            Mono.just(mapOf("status" to "PENDING", "message" to "Not yet confirmed"))
                        }
                    }
            }
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found")))
    }

    private fun getCurrentUserId(): Mono<String> {
        return ReactiveSecurityContextHolder.getContext()
            .map { it.authentication.principal as String }
    }
}

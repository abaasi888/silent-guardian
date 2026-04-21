package com.silentguardian.repository
import com.silentguardian.model.CryptoPayment
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux

interface CryptoPaymentRepository : ReactiveMongoRepository<CryptoPayment, String> {
    fun findByUserId(userId: String): Flux<CryptoPayment>
}

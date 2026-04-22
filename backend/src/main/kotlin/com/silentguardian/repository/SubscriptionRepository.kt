package com.silentguardian.repository

import com.silentguardian.model.Subscription
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux
import java.util.Date

interface SubscriptionRepository : ReactiveMongoRepository<Subscription, String> {
    fun findByUserId(userId: String): Flux<Subscription>
    fun findByEndDateBeforeAndActiveTrue(date: Date): Flux<Subscription>
}

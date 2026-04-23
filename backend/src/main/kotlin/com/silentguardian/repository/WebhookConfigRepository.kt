package com.silentguardian.repository

import com.silentguardian.model.WebhookConfig
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux

interface WebhookConfigRepository : ReactiveMongoRepository<WebhookConfig, String> {
    fun findByOrgIdAndActiveTrue(orgId: String): Flux<WebhookConfig>
}
package com.silentguardian.service

import com.silentguardian.model.WebhookConfig
import com.silentguardian.model.WebhookEvent
import com.silentguardian.repository.WebhookConfigRepository
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono

@Service
class WebhookService(
    private val webhookConfigRepository: WebhookConfigRepository,
    private val webClient: WebClient
) {
    fun triggerWebhook(orgId: String, event: WebhookEvent, payload: Map<String, Any>) {
        webhookConfigRepository.findByOrgIdAndActiveTrue(orgId)
            .filter { it.events.contains(event) }
            .flatMap { config ->
                webClient.post()
                    .uri(config.url)
                    .header("X-Webhook-Secret", config.secret)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String::class.java)
                    .onErrorResume { Mono.empty() }
            }
            .subscribe()
    }
}
package com.silentguardian.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono

@Service
class FcmService(
    private val webClientBuilder: WebClient.Builder
) {
    @Value("\${fcm.server-key:}")
    private lateinit var serverKey: String

    @Value("\${fcm.enabled:false}")
    private var fcmEnabled: Boolean = false

    companion object {
        private const val FCM_URL = "https://fcm.googleapis.com/fcm/send"
    }

    /**
     * Send a deactivation notice to an employee's device.
     * @param fcmToken The Firebase Cloud Messaging token of the employee's device.
     * @return Mono<String> Response from FCM.
     */
    fun sendDeactivationNotice(fcmToken: String): Mono<String> {
        if (!fcmEnabled || serverKey.isBlank()) {
            return Mono.just("FCM disabled or server key not configured")
        }

        val payload = mapOf(
            "to" to fcmToken,
            "notification" to mapOf(
                "title" to "Account Deactivated",
                "body" to "Your employee account has been deactivated by admin. Please contact support.",
                "click_action" to "OPEN_APP"
            ),
            "data" to mapOf(
                "action" to "DEACTIVATE_APP"
            )
        )

        return webClientBuilder.build()
            .post()
            .uri(FCM_URL)
            .header(HttpHeaders.AUTHORIZATION, "key=$serverKey")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(payload)
            .retrieve()
            .bodyToMono(String::class.java)
            .onErrorResume { error ->
                Mono.just("FCM error: ${error.message}")
            }
    }

    /**
     * Send a custom notification to a device.
     * @param fcmToken Target device token.
     * @param title Notification title.
     * @param body Notification body.
     * @param data Optional additional data map.
     */
    fun sendNotification(
        fcmToken: String,
        title: String,
        body: String,
        data: Map<String, String> = emptyMap()
    ): Mono<String> {
        if (!fcmEnabled || serverKey.isBlank()) {
            return Mono.just("FCM disabled or server key not configured")
        }

        val payload = mutableMapOf<String, Any>(
            "to" to fcmToken,
            "notification" to mapOf(
                "title" to title,
                "body" to body,
                "click_action" to "OPEN_APP"
            )
        )
        if (data.isNotEmpty()) {
            payload["data"] = data
        }

        return webClientBuilder.build()
            .post()
            .uri(FCM_URL)
            .header(HttpHeaders.AUTHORIZATION, "key=$serverKey")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(payload)
            .retrieve()
            .bodyToMono(String::class.java)
            .onErrorResume { error ->
                Mono.just("FCM error: ${error.message}")
            }
    }
}
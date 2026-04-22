package com.silentguardian.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.util.Date

@Document("crypto_payments")
data class CryptoPayment(
    @Id val id: String? = null,
    val userId: String,
    val subscriptionId: String? = null,
    val planId: String,
    val amount: Double,
    val currency: String = "USDT",
    val walletAddress: String,
    var txHash: String? = null,
    var status: PaymentStatus = PaymentStatus.PENDING,
    val createdAt: Date = Date(),
    var confirmedAt: Date? = null
)

enum class PaymentStatus { PENDING, CONFIRMED, FAILED, EXPIRED }
package com.silentguardian.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import java.util.Date

@Document("users")
data class User(
    @Id val id: String? = null,
    @Indexed(unique = true) val email: String,
    val password: String,
    val fullName: String,
    val phone: String,
    val isEmailVerified: Boolean = false,
    val role: Role = Role.USER,
    var refreshToken: String? = null,
    val createdAt: Date = Date(),
    var lastLogin: Date? = null,
    var stealthEnabled: Boolean = false,
    var kycStatus: KycStatus = KycStatus.NOT_SUBMITTED,
    var kycData: KycData? = null,
    // Subscription fields added for admin portal & expiry
    var subscriptionId: String? = null,
    var subscriptionActive: Boolean = false,
    var subscriptionExpiry: Date? = null
)

enum class Role { USER, ADMIN }
enum class KycStatus { NOT_SUBMITTED, PENDING, APPROVED, REJECTED }
data class KycData(
    val documentType: String,
    val documentNumber: String,
    val documentImageUrl: String,
    val submittedAt: Date = Date()
)

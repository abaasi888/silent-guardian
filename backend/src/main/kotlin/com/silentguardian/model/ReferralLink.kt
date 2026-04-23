package com.silentguardian.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import java.util.Date

@Document("referral_links")
data class ReferralLink(
    @Id val id: String? = null,
    val employeeId: String,          // Reference to Employee.employeeId
    @Indexed(unique = true) val token: String,  // Unique token used in URL
    val createdAt: Date = Date(),
    var expiresAt: Date? = null,     // Optional expiration date
    var maxUses: Int = 100,          // Maximum number of signups allowed
    var usedCount: Int = 0           // Current number of signups using this link
)
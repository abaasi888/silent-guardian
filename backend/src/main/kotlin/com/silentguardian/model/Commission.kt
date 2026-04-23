package com.silentguardian.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.util.Date

@Document("commissions")
data class Commission(
    @Id val id: String? = null,
    val employeeId: String,          // Reference to Employee.employeeId
    val referredUserId: String,      // The user who signed up via referral link
    val subscriptionId: String,      // The subscription purchased by the referred user
    val subscriptionAmount: Double,  // Amount paid for the subscription
    val commissionRate: Double,      // e.g., 0.30 for 30%
    val commissionAmount: Double,    // Calculated amount (subscriptionAmount * commissionRate)
    var status: CommissionStatus = CommissionStatus.PENDING,
    val createdAt: Date = Date(),
    var paidAt: Date? = null,
    val payoutMonth: String          // Format: YYYY-MM
)

enum class CommissionStatus {
    PENDING,   // Commission earned but not yet paid
    PAID,      // Paid to employee
    CANCELLED  // Subscription refunded or invalid
}
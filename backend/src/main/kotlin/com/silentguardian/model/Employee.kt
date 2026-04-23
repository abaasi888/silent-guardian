package com.silentguardian.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import java.util.Date

@Document("employees")
data class Employee(
    @Id val id: String? = null,
    @Indexed(unique = true) val employeeId: String,          // Auto-generated, e.g., "EMP123456"
    val userId: String,                                      // Reference to User._id
    val fullName: String,
    val email: String,
    val phone: String,
    val nationalId: String,                                  // National ID / Passport number
    val cvUrl: String,                                       // URL to uploaded CV
    val nssfCardUrl: String,                                 // URL to NSSF card image
    val bankAccount: BankAccount,                            // Nested bank account details
    val role: EmployeeRole = EmployeeRole.FIELD_AGENT,
    var isActive: Boolean = true,                            // Overall account status (admin can disable)
    var appActive: Boolean = true,                           // Employee app activation status
    var isPermanent: Boolean = false,                        // True after 1000 referrals
    var permanentSince: Date? = null,                        // When became permanent
    var baseSalary: Double? = null,                          // Fixed monthly salary for permanent employees
    var totalReferrals: Int = 0,                             // Count of users referred
    var commissionRate: Double = 0.30,                       // 30% default
    var totalCommissionEarned: Double = 0.0,                 // Lifetime commission earned
    var lastAttendanceTime: Date? = null,                    // Last recorded attendance
    var currentLocation: GeoPoint? = null,                   // Last known location
    var fcmToken: String? = null,                            // Firebase Cloud Messaging token
    val createdAt: Date = Date(),
    var updatedAt: Date = Date()
)

data class BankAccount(
    val accountHolderName: String,
    val accountNumber: String,
    val bankName: String,
    val ifscCode: String? = null    // For international use, optional
)

enum class EmployeeRole {
    FIELD_AGENT,    // Field employee, can do attendance and referrals
    SUPERVISOR,     // Can oversee field agents (future)
    MANAGER         // Can manage teams (future)
}
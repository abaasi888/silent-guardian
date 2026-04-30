package com.silentguardian.models

data class Employee(
    val id: Int,
    val name: String,
    val email: String,
    val phone: String,
    val role: String,
    val status: String,
    val commissionRate: Int,
    val baseSalary: Double,
    val employmentType: String, // "contractor" or "permanent"
    val joinDate: String,
    val totalSignups: Int,
    val totalCommission: Double,
    val lastPayout: String,
    val permanentEligible: Boolean,
    val careerStage: String,
    val promotionDate: String? = null,
    val signups: List<Signup>
)

data class Signup(
    val userId: String,
    val plan: String,
    val amount: Double,
    val date: String,
    val status: String
)
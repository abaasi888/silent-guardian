package com.silentguardian.employee.models

import com.google.gson.annotations.SerializedName

data class Employee(
    @SerializedName("id") val id: Int,
    @SerializedName("fullName") val fullName: String,
    @SerializedName("email") val email: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("role") val role: String,
    @SerializedName("status") val status: String,
    @SerializedName("commissionRate") val commissionRate: Int,
    @SerializedName("baseSalary") val baseSalary: Double,
    @SerializedName("employmentType") val employmentType: String, // "contractor" or "permanent"
    @SerializedName("joinDate") val joinDate: String,
    @SerializedName("totalSignups") val totalSignups: Int,
    @SerializedName("totalCommission") val totalCommission: Double,
    @SerializedName("lastPayout") val lastPayout: String,
    @SerializedName("permanentEligible") val permanentEligible: Boolean,
    @SerializedName("careerStage") val careerStage: String,
    @SerializedName("promotionDate") val promotionDate: String? = null
)

data class ChatMessage(
    val id: String,
    val from: String,
    val text: String,
    val timestamp: String,
    val read: Boolean
)

data class CommissionData(
    val totalCommission: Double,
    val monthlyCommission: Double,
    val totalSignups: Int,
    val monthlySignups: Int
)
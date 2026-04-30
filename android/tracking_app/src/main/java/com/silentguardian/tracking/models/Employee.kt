package com.silentguardian.tracking.models

import com.google.gson.annotations.SerializedName
import java.util.Date

/**
 * Employee Model - For employee app (sales agents)
 * Note: This is separate from the tracking device models
 */
data class Employee(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("fullName")
    val fullName: String,
    
    @SerializedName("email")
    val email: String,
    
    @SerializedName("phone")
    val phone: String,
    
    @SerializedName("role")
    val role: String,
    
    @SerializedName("status")
    val status: String,
    
    @SerializedName("commissionRate")
    val commissionRate: Int,
    
    @SerializedName("baseSalary")
    val baseSalary: Double,
    
    @SerializedName("employmentType")
    val employmentType: String,
    
    @SerializedName("joinDate")
    val joinDate: String,
    
    @SerializedName("totalSignups")
    val totalSignups: Int,
    
    @SerializedName("totalCommission")
    val totalCommission: Double,
    
    @SerializedName("lastPayout")
    val lastPayout: String,
    
    @SerializedName("permanentEligible")
    val permanentEligible: Boolean,
    
    @SerializedName("careerStage")
    val careerStage: String,
    
    @SerializedName("promotionDate")
    val promotionDate: String? = null
)

/**
 * Signup Model - User signups referred by employee
 */
data class Signup(
    @SerializedName("userId")
    val userId: String,
    
    @SerializedName("plan")
    val plan: String,
    
    @SerializedName("amount")
    val amount: Double,
    
    @SerializedName("date")
    val date: String,
    
    @SerializedName("status")
    val status: String
)

/**
 * Employee Login Request
 */
data class EmployeeLoginRequest(
    @SerializedName("email")
    val email: String,
    
    @SerializedName("password")
    val password: String
)

/**
 * Employee Login Response
 */
data class EmployeeLoginResponse(
    @SerializedName("token")
    val token: String,
    
    @SerializedName("employee")
    val employee: Employee
)

/**
 * Invite Link Response
 */
data class InviteLinkResponse(
    @SerializedName("inviteCode")
    val inviteCode: String,
    
    @SerializedName("inviteLink")
    val inviteLink: String
)
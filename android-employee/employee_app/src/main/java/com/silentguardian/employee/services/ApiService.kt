package com.silentguardian.employee.services

import com.silentguardian.employee.models.ChatMessage
import com.silentguardian.employee.models.CommissionData
import com.silentguardian.employee.models.Employee
import com.silentguardian.employee.models.Signup
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // ========== AUTHENTICATION ==========
    
    @POST("api/employee/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    @POST("api/employee/register")
    suspend fun register(
        @Body request: RegisterRequest
    ): Response<RegisterResponse>

    @POST("api/employee/logout")
    suspend fun logout(
        @Header("Authorization") token: String
    ): Response<LogoutResponse>

    // ========== PROFILE ==========
    
    @GET("api/employee/profile")
    suspend fun getProfile(
        @Header("Authorization") token: String
    ): Response<Employee>

    @PUT("api/employee/profile")
    suspend fun updateProfile(
        @Header("Authorization") token: String,
        @Body request: UpdateProfileRequest
    ): Response<UpdateProfileResponse>

    // ========== SIGNUPS & COMMISSIONS ==========
    
    @GET("api/employee/signups")
    suspend fun getSignups(
        @Header("Authorization") token: String
    ): Response<List<SignupResponse>>

    @GET("api/employee/commission")
    suspend fun getCommission(
        @Header("Authorization") token: String
    ): Response<CommissionDataResponse>

    // ========== INVITES ==========
    
    @GET("api/employee/invite/generate")
    suspend fun generateInviteLink(
        @Header("Authorization") token: String
    ): Response<InviteLinkResponse>

    @POST("api/employee/invite/send")
    suspend fun sendInvite(
        @Header("Authorization") token: String,
        @Body request: SendInviteRequest
    ): Response<SendInviteResponse>

    // ========== CHAT ==========
    
    @GET("api/employee/chat/messages")
    suspend fun getChatMessages(
        @Header("Authorization") token: String
    ): Response<List<ChatMessageResponse>>

    @POST("api/employee/chat/send")
    suspend fun sendChatMessage(
        @Header("Authorization") token: String,
        @Body request: SendChatMessageRequest
    ): Response<SendChatMessageResponse>

    // ========== DATA MODELS ==========
    
    data class LoginRequest(
        @Field("email") val email: String,
        @Field("password") val password: String
    )
    
    data class LoginResponse(
        @SerializedName("token") val token: String,
        @SerializedName("employee") val employee: Employee
    )
    
    data class RegisterRequest(
        @Field("fullName") val fullName: String,
        @Field("email") val email: String,
        @Field("phone") val phone: String,
        @Field("password") val password: String,
        @Field("inviteCode") val inviteCode: String,
        @Field("idDocument") val idDocument: String,
        @Field("selfie") val selfie: String,
        @Field("cv") val cv: String?,
        @Field("nssf") val nssf: String?,
        @Field("bankAccount") val bankAccount: String?,
        @Field("academics") val academics: String?
    )
    
    data class RegisterResponse(
        @SerializedName("success") val success: Boolean,
        @SerializedName("message") val message: String
    )
    
    data class LogoutResponse(
        @SerializedName("success") val success: Boolean
    )
    
    data class UpdateProfileRequest(
        @Field("fullName") val fullName: String?,
        @Field("phone") val phone: String?
    )
    
    data class UpdateProfileResponse(
        @SerializedName("success") val success: Boolean,
        @SerializedName("message") val message: String
    )
    
    data class SignupResponse(
        @SerializedName("userId") val userId: String,
        @SerializedName("plan") val plan: String,
        @SerializedName("amount") val amount: Double,
        @SerializedName("date") val date: String,
        @SerializedName("status") val status: String
    )
    
    data class CommissionDataResponse(
        @SerializedName("totalCommission") val totalCommission: Double,
        @SerializedName("monthlyCommission") val monthlyCommission: Double,
        @SerializedName("totalSignups") val totalSignups: Int,
        @SerializedName("monthlySignups") val monthlySignups: Int
    )
    
    data class InviteLinkResponse(
        @SerializedName("inviteCode") val inviteCode: String,
        @SerializedName("inviteLink") val inviteLink: String
    )
    
    data class SendInviteRequest(
        @Field("email") val email: String?,
        @Field("phone") val phone: String?,
        @Field("inviteLink") val inviteLink: String
    )
    
    data class SendInviteResponse(
        @SerializedName("success") val success: Boolean,
        @SerializedName("message") val message: String
    )
    
    data class ChatMessageResponse(
        @SerializedName("id") val id: String,
        @SerializedName("from") val from: String,
        @SerializedName("text") val text: String,
        @SerializedName("timestamp") val timestamp: String,
        @SerializedName("read") val read: Boolean
    )
    
    data class SendChatMessageRequest(
        @Field("message") val message: String
    )
    
    data class SendChatMessageResponse(
        @SerializedName("success") val success: Boolean,
        @SerializedName("message") val message: ChatMessageResponse
    )
}
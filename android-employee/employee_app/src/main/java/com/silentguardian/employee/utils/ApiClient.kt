package com.silentguardian.employee.utils

import android.content.Context
import com.google.gson.GsonBuilder
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import java.util.concurrent.TimeUnit

class ApiClient(private val context: Context) {

    companion object {
        private var instance: ApiClient? = null
        fun getInstance(context: Context): ApiClient {
            if (instance == null) {
                instance = ApiClient(context)
            }
            return instance!!
        }
    }

    private val gson = GsonBuilder().setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").create()

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val authInterceptor = AuthInterceptor(SessionManager(context))

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .addInterceptor(authInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(Constants.BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create(gson))
        .build()

    val apiService: ApiService = retrofit.create(ApiService::class.java)

    class AuthInterceptor(private val sessionManager: SessionManager) : okhttp3.Interceptor {
        override fun intercept(chain: okhttp3.Interceptor.Chain): okhttp3.Response {
            val original = chain.request()
            val token = sessionManager.getAuthToken()
            val builder = original.newBuilder()
                .addHeader("Accept", "application/json")
                .addHeader("Content-Type", "application/json")
            
            if (token != null && token.isNotEmpty()) {
                builder.addHeader("Authorization", "Bearer $token")
            }
            
            return chain.proceed(builder.build())
        }
    }

    interface ApiService {
        @POST("api/employee/login")
        suspend fun login(@Body request: LoginRequest): LoginResponse

        @POST("api/employee/register")
        suspend fun register(@Body request: RegisterRequest): RegisterResponse

        @GET("api/employee/profile")
        suspend fun getProfile(): Employee

        @PUT("api/employee/profile")
        suspend fun updateProfile(@Body request: UpdateProfileRequest): UpdateProfileResponse

        @GET("api/employee/signups")
        suspend fun getSignups(): List<SignupResponse>

        @GET("api/employee/commission")
        suspend fun getCommissionData(): CommissionDataResponse

        @GET("api/employee/invite/generate")
        suspend fun generateInviteLink(): InviteLinkResponse

        @POST("api/employee/invite/send")
        suspend fun sendInvite(@Body request: SendInviteRequest): SendInviteResponse

        @GET("api/employee/chat/messages")
        suspend fun getChatMessages(): List<ChatMessageResponse>

        @POST("api/employee/chat/send")
        suspend fun sendChatMessage(@Body request: SendChatMessageRequest): SendChatMessageResponse
    }

    // Request/Response Models
    data class LoginRequest(val email: String, val password: String)
    data class LoginResponse(val token: String, val employee: Employee)

    data class RegisterRequest(
        val fullName: String, val email: String, val phone: String, val password: String,
        val inviteCode: String, val idDocument: String, val selfie: String, val cv: String?,
        val nssf: String?, val bankAccount: String?, val academics: String?
    )
    data class RegisterResponse(val success: Boolean, val message: String)

    data class UpdateProfileRequest(val fullName: String?, val phone: String?)
    data class UpdateProfileResponse(val success: Boolean, val message: String)

    data class SignupResponse(val userId: String, val plan: String, val amount: Double, val date: String, val status: String)
    data class CommissionDataResponse(val totalCommission: Double, val monthlyCommission: Double, val totalSignups: Int, val monthlySignups: Int)
    data class InviteLinkResponse(val inviteCode: String, val inviteLink: String)
    data class SendInviteRequest(val email: String?, val phone: String?, val inviteLink: String)
    data class SendInviteResponse(val success: Boolean, val message: String)
    data class ChatMessageResponse(val id: String, val from: String, val text: String, val timestamp: String, val read: Boolean)
    data class SendChatMessageRequest(val message: String)
    data class SendChatMessageResponse(val success: Boolean, val message: ChatMessageResponse)
}
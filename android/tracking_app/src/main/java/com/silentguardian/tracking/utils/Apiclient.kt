package com.silentguardian.tracking.utils

import android.content.Context
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import java.util.concurrent.TimeUnit

/**
 * API Client - Handles all network communication with the Silent Guardian backend
 * Features:
 * - Retrofit for type-safe HTTP calls
 * - OkHttp for connection management
 * - Gson for JSON parsing
 * - Automatic token injection
 * - Request/response logging
 */
class ApiClient(private val context: Context) {

    companion object {
        private const val BASE_URL = "https://api.silentguardian.com/"
        private const val TIMEOUT_SECONDS = 30L
        private var instance: ApiClient? = null

        fun getInstance(context: Context): ApiClient {
            if (instance == null) {
                instance = ApiClient(context)
            }
            return instance!!
        }
    }

    // Gson instance with proper date format
    private val gson: Gson = GsonBuilder()
        .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        .setLenient()
        .create()

    // Logging interceptor for debugging
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.ENABLE_LOGGING) {
            HttpLoggingInterceptor.Level.BODY
        } else {
            HttpLoggingInterceptor.Level.NONE
        }
    }

    // Auth interceptor to add token to every request
    private val authInterceptor = AuthInterceptor(SessionManager(context))

    // OkHttp client with interceptors
    private val okHttpClient: OkHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .addInterceptor(authInterceptor)
        .connectTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .readTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .writeTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    // Retrofit instance
    private val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create(gson))
        .build()

    // API service instances
    val authService: AuthService = retrofit.create(AuthService::class.java)
    val deviceService: DeviceService = retrofit.create(DeviceService::class.java)
    val commandService: CommandService = retrofit.create(CommandService::class.java)
    val locationService: LocationService = retrofit.create(LocationService::class.java)

    /**
     * Authentication Interceptor - Adds Bearer token to all requests
     */
    private class AuthInterceptor(private val sessionManager: SessionManager) : okhttp3.Interceptor {
        override fun intercept(chain: okhttp3.Interceptor.Chain): okhttp3.Response {
            val originalRequest = chain.request()
            val token = sessionManager.getAuthToken()

            val requestBuilder = originalRequest.newBuilder()
                .addHeader("Accept", "application/json")
                .addHeader("Content-Type", "application/json")

            if (token != null && token.isNotEmpty()) {
                requestBuilder.addHeader("Authorization", "Bearer $token")
            }

            return chain.proceed(requestBuilder.build())
        }
    }

    // ========== API INTERFACES ==========

    /**
     * Authentication API endpoints
     */
    interface AuthService {
        @POST("api/auth/login")
        suspend fun login(@Body request: LoginRequest): LoginResponse

        @POST("api/auth/register")
        suspend fun register(@Body request: RegisterRequest): RegisterResponse

        @POST("api/auth/logout")
        suspend fun logout(@Header("Authorization") token: String): LogoutResponse

        @POST("api/auth/refresh")
        suspend fun refreshToken(@Body request: RefreshTokenRequest): RefreshTokenResponse
    }

    /**
     * Device API endpoints
     */
    interface DeviceService {
        @GET("api/device/info")
        suspend fun getDeviceInfo(): DeviceInfoResponse

        @GET("api/device/status")
        suspend fun getDeviceStatus(): DeviceStatusResponse

        @PUT("api/device/update")
        suspend fun updateDevice(@Body request: UpdateDeviceRequest): UpdateDeviceResponse

        @POST("api/device/heartbeat")
        suspend fun sendHeartbeat(@Body request: HeartbeatRequest): HeartbeatResponse

        @GET("api/device/check")
        suspend fun checkDevice(@Query("hardwareId") hardwareId: String): CheckDeviceResponse

        @POST("api/device/register")
        suspend fun registerDevice(@Body request: DeviceRegisterRequest): DeviceRegisterResponse
    }

    /**
     * Command API endpoints
     */
    interface CommandService {
        @GET("api/device/commands")
        suspend fun getPendingCommands(@Query("hardwareId") hardwareId: String): List<CommandResponse>

        @POST("api/device/commands/{commandId}/execute")
        suspend fun markCommandExecuted(
            @Path("commandId") commandId: String,
            @Body request: CommandExecuteRequest
        ): CommandExecuteResponse

        @POST("api/device/commands/sms")
        suspend fun sendSmsCommand(@Body request: SmsCommandRequest): SmsCommandResponse
    }

    /**
     * Location API endpoints
     */
    interface LocationService {
        @POST("api/device/location")
        suspend fun sendLocation(@Body request: LocationRequest): LocationResponse

        @GET("api/device/location/history")
        suspend fun getLocationHistory(
            @Query("from") from: Long,
            @Query("to") to: Long
        ): LocationHistoryResponse

        @POST("api/device/factory-reset-alert")
        suspend fun sendFactoryResetAlert(@Body request: FactoryResetAlertRequest): FactoryResetAlertResponse
    }

    // ========== REQUEST/RESPONSE MODELS ==========

    // Auth Models
    data class LoginRequest(
        val email: String,
        val password: String,
        val hardwareId: String,
        val deviceModel: String,
        val manufacturer: String,
        val androidVersion: String
    )

    data class LoginResponse(
        val token: String,
        val refreshToken: String,
        val deviceId: String,
        val expiresIn: Long
    )

    data class RegisterRequest(
        val deviceName: String,
        val email: String,
        val password: String,
        val hardwareId: String,
        val manufacturer: String,
        val model: String,
        val androidVersion: String,
        val sdkVersion: Int
    )

    data class RegisterResponse(
        val success: Boolean,
        val message: String,
        val deviceId: String
    )

    data class RefreshTokenRequest(
        val refreshToken: String
    )

    data class RefreshTokenResponse(
        val token: String,
        val expiresIn: Long
    )

    data class LogoutResponse(
        val success: Boolean
    )

    // Device Models
    data class DeviceInfoResponse(
        val deviceId: String,
        val deviceName: String,
        val hardwareId: String,
        val status: String,
        val lastSeen: Long,
        val lastLocation: LocationData?,
        val battery: Int,
        val firmware: String,
        val ownerEmail: String
    )

    data class DeviceStatusResponse(
        val status: String,
        val isOnline: Boolean,
        val lastHeartbeat: Long,
        val servicesRunning: Boolean
    )

    data class UpdateDeviceRequest(
        val deviceName: String?
    )

    data class UpdateDeviceResponse(
        val success: Boolean,
        val message: String
    )

    data class HeartbeatRequest(
        val hardwareId: String,
        val timestamp: Long,
        val battery: Int,
        val isCharging: Boolean
    )

    data class HeartbeatResponse(
        val success: Boolean,
        val hasCommands: Boolean
    )

    data class CheckDeviceResponse(
        val isRegistered: Boolean,
        val deviceId: String?
    )

    data class DeviceRegisterRequest(
        val hardwareId: String,
        val deviceName: String,
        val manufacturer: String,
        val model: String,
        val androidVersion: String
    )

    data class DeviceRegisterResponse(
        val success: Boolean,
        val deviceId: String,
        val token: String
    )

    // Command Models
    data class CommandResponse(
        val id: String,
        val type: String,
        val params: Map<String, Any>?,
        val issuedAt: Long
    )

    data class CommandExecuteRequest(
        val commandId: String,
        val hardwareId: String,
        val success: Boolean,
        val executedAt: Long
    )

    data class CommandExecuteResponse(
        val success: Boolean
    )

    data class SmsCommandRequest(
        val deviceId: String,
        val command: String,
        val senderNumber: String
    )

    data class SmsCommandResponse(
        val success: Boolean,
        val message: String
    )

    // Location Models
    data class LocationRequest(
        val hardwareId: String,
        val lat: Double,
        val lng: Double,
        val accuracy: Float,
        val speed: Float,
        val bearing: Float,
        val altitude: Double,
        val timestamp: Long,
        val provider: String,
        val battery: Int,
        val isMoving: Boolean
    )

    data class LocationResponse(
        val success: Boolean,
        val message: String?
    )

    data class LocationData(
        val lat: Double,
        val lng: Double,
        val accuracy: Float,
        val timestamp: Long
    )

    data class LocationHistoryResponse(
        val locations: List<LocationData>,
        val count: Int
    )

    data class FactoryResetAlertRequest(
        val hardwareId: String,
        val timestamp: Long,
        val event: String,
        val deviceModel: String,
        val manufacturer: String
    )

    data class FactoryResetAlertResponse(
        val success: Boolean
    )
}
#!/bin/bash

# Silent Guardian - Ultimate Complete Project Generator
# Run: chmod +x create-silent-guardian-ultimate.sh && ./create-silent-guardian-ultimate.sh

set -e

PROJECT_ROOT="silent-guardian-ultimate"
echo "Creating complete Silent Guardian project at $PROJECT_ROOT ..."
mkdir -p "$PROJECT_ROOT"
cd "$PROJECT_ROOT"

# ============================================================================
# Directory structure
# ============================================================================
mkdir -p backend/src/main/{kotlin/com/silentguardian/{config,controller,model,repository,service,security,util},resources}
mkdir -p android/app/src/main/{java/com/silentguardian,res}
mkdir -p android/app/src/main/res/{layout,drawable,values}
mkdir -p android/gradle/wrapper
mkdir -p frontend/public
mkdir -p frontend/src/{components,pages,services,utils,hooks,styles}
mkdir -p docs/architecture
mkdir -p .github/workflows
mkdir -p .husky
mkdir -p scripts
mkdir -p infrastructure/terraform/{modules/{vpc,ecs,rds,elasticache}}
mkdir -p infrastructure/kubernetes
mkdir -p infrastructure/ansible/{playbooks,roles/{common,docker,monitoring}/tasks}
mkdir -p infrastructure/monitoring/{prometheus,grafana/dashboards,alertmanager}

# ============================================================================
# BACKEND (Spring Boot + Kotlin)
# ============================================================================

# -------------------- build.gradle.kts --------------------
cat > backend/build.gradle.kts << 'EOF'
plugins {
    id("org.springframework.boot") version "3.2.0"
    id("io.spring.dependency-management") version "1.1.4"
    kotlin("jvm") version "1.9.20"
    kotlin("plugin.spring") version "1.9.20"
}

group = "com.silentguardian"
version = "1.0.0"

java { sourceCompatibility = JavaVersion.VERSION_17 }

repositories { mavenCentral() }

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-mongodb-reactive")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-data-redis-reactive")
    implementation("io.projectreactor.kotlin:reactor-kotlin-extensions")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")
    implementation("io.jsonwebtoken:jjwt-api:0.12.3")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.3")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.3")
    implementation("org.springframework.boot:spring-boot-starter-mail")
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
}

kotlin {
    compilerOptions { freeCompilerArgs.addAll("-Xjsr305=strict") }
}
tasks.withType<Test> { useJUnitPlatform() }
EOF

# -------------------- application.yml --------------------
cat > backend/src/main/resources/application.yml << 'EOF'
spring:
  data:
    mongodb:
      uri: ${MONGODB_URI:mongodb://localhost:27017/silentguardian}
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
  mail:
    host: ${EMAIL_HOST:smtp.gmail.com}
    port: ${EMAIL_PORT:587}
    username: ${EMAIL_USER}
    password: ${EMAIL_PASS}
jwt:
  secret: ${JWT_SECRET:your_super_secret_jwt_key_change_me}
  refresh-secret: ${JWT_REFRESH_SECRET:your_refresh_secret_change_me}
  expiration: 604800000
  refresh-expiration: 2592000000
server:
  port: ${PORT:5000}
frontend:
  url: ${FRONTEND_URL:http://localhost:5173}
crypto:
  wallet:
    address: ${CRYPTO_WALLET_ADDRESS:YOUR_TRC20_USDT_ADDRESS}
  api:
    key: ${CRYPTO_API_KEY:}
  network: ${CRYPTO_NETWORK:trc20}
EOF

# -------------------- Main Application --------------------
cat > backend/src/main/kotlin/com/silentguardian/SilentGuardianApplication.kt << 'EOF'
package com.silentguardian
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class SilentGuardianApplication
fun main(args: Array<String>) { runApplication<SilentGuardianApplication>(*args) }
EOF

# -------------------- Models --------------------
cat > backend/src/main/kotlin/com/silentguardian/model/User.kt << 'EOF'
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
    var kycData: KycData? = null
)
enum class Role { USER, ADMIN }
enum class KycStatus { NOT_SUBMITTED, PENDING, APPROVED, REJECTED }
data class KycData(
    val documentType: String,
    val documentNumber: String,
    val documentImageUrl: String,
    val submittedAt: Date = Date()
)
EOF

cat > backend/src/main/kotlin/com/silentguardian/model/Device.kt << 'EOF'
package com.silentguardian.model
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import java.util.Date

@Document("devices")
data class Device(
    @Id val id: String? = null,
    val userId: String,
    val deviceName: String,
    @Indexed(unique = true) val deviceId: String,
    var status: DeviceStatus = DeviceStatus.PENDING,
    var lastSeen: Date? = null,
    var lastLocation: LocationData? = null,
    val hardwareInfo: HardwareInfo? = null,
    var stealthMode: Boolean = false,
    val createdAt: Date = Date()
)
data class LocationData(val lat: Double, val lng: Double, val accuracy: Double? = null, val timestamp: Date = Date())
data class HardwareInfo(val manufacturer: String? = null, val model: String? = null, val os: String? = null)
enum class DeviceStatus { ACTIVE, INACTIVE, STOLEN, PENDING }
EOF

cat > backend/src/main/kotlin/com/silentguardian/model/Location.kt << 'EOF'
package com.silentguardian.model
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.util.Date

@Document("locations")
data class Location(
    @Id val id: String? = null,
    val deviceId: String,
    val userId: String,
    val lat: Double,
    val lng: Double,
    val accuracy: Double? = null,
    val speed: Double? = null,
    val heading: Double? = null,
    val timestamp: Date = Date(),
    val isOffline: Boolean = false
)
EOF

cat > backend/src/main/kotlin/com/silentguardian/model/CryptoPayment.kt << 'EOF'
package com.silentguardian.model
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.util.Date

@Document("crypto_payments")
data class CryptoPayment(
    @Id val id: String? = null,
    val userId: String,
    val subscriptionId: String? = null,
    val planId: String,
    val amount: Double,
    val currency: String = "USDT",
    val walletAddress: String,
    var txHash: String? = null,
    var status: PaymentStatus = PaymentStatus.PENDING,
    val createdAt: Date = Date(),
    var confirmedAt: Date? = null
)
enum class PaymentStatus { PENDING, CONFIRMED, FAILED, EXPIRED }
EOF

# -------------------- Repositories --------------------
cat > backend/src/main/kotlin/com/silentguardian/repository/UserRepository.kt << 'EOF'
package com.silentguardian.repository
import com.silentguardian.model.User
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Mono

interface UserRepository : ReactiveMongoRepository<User, String> {
    fun findByEmail(email: String): Mono<User>
    fun existsByEmail(email: String): Mono<Boolean>
}
EOF

cat > backend/src/main/kotlin/com/silentguardian/repository/DeviceRepository.kt << 'EOF'
package com.silentguardian.repository
import com.silentguardian.model.Device
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

interface DeviceRepository : ReactiveMongoRepository<Device, String> {
    fun findByUserId(userId: String): Flux<Device>
    fun findByDeviceId(deviceId: String): Mono<Device>
}
EOF

cat > backend/src/main/kotlin/com/silentguardian/repository/LocationRepository.kt << 'EOF'
package com.silentguardian.repository
import com.silentguardian.model.Location
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux

interface LocationRepository : ReactiveMongoRepository<Location, String> {
    fun findByDeviceIdAndUserIdOrderByTimestampDesc(deviceId: String, userId: String): Flux<Location>
}
EOF

cat > backend/src/main/kotlin/com/silentguardian/repository/CryptoPaymentRepository.kt << 'EOF'
package com.silentguardian.repository
import com.silentguardian.model.CryptoPayment
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux

interface CryptoPaymentRepository : ReactiveMongoRepository<CryptoPayment, String> {
    fun findByUserId(userId: String): Flux<CryptoPayment>
}
EOF

# -------------------- Security --------------------
cat > backend/src/main/kotlin/com/silentguardian/security/SecurityConfig.kt << 'EOF'
package com.silentguardian.security
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity
import org.springframework.security.config.web.server.ServerHttpSecurity
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.server.SecurityWebFilterChain

@Configuration
@EnableWebFluxSecurity
class SecurityConfig {
    @Bean fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder(12)
    @Bean fun springSecurityFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
        return http.csrf { it.disable() }
            .authorizeExchange {
                it.pathMatchers("/api/v1/auth/**", "/api/v1/crypto/webhook/**", "/health").permitAll()
                    .anyExchange().authenticated()
            }
            .httpBasic { it.disable() }
            .formLogin { it.disable() }
            .build()
    }
}
EOF

cat > backend/src/main/kotlin/com/silentguardian/security/JwtUtil.kt << 'EOF'
package com.silentguardian.security
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.util.Date

@Component
class JwtUtil(
    @Value("\${jwt.secret}") private val secret: String,
    @Value("\${jwt.refresh-secret}") private val refreshSecret: String,
    @Value("\${jwt.expiration}") private val expiration: Long,
    @Value("\${jwt.refresh-expiration}") private val refreshExpiration: Long
) {
    private val key = Keys.hmacShaKeyFor(secret.toByteArray())
    private val refreshKey = Keys.hmacShaKeyFor(refreshSecret.toByteArray())

    fun generateAccessToken(userId: String): String = Jwts.builder()
        .claim("userId", userId)
        .issuedAt(Date())
        .expiration(Date(System.currentTimeMillis() + expiration))
        .signWith(key)
        .compact()

    fun generateRefreshToken(userId: String): String = Jwts.builder()
        .claim("userId", userId)
        .issuedAt(Date())
        .expiration(Date(System.currentTimeMillis() + refreshExpiration))
        .signWith(refreshKey)
        .compact()

    fun validateToken(token: String, isRefresh: Boolean = false): Boolean {
        val signingKey = if (isRefresh) refreshKey else key
        return try {
            Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token)
            true
        } catch (e: Exception) { false }
    }

    fun getUserIdFromToken(token: String, isRefresh: Boolean = false): String {
        val signingKey = if (isRefresh) refreshKey else key
        val claims = Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).payload
        return claims["userId"] as String
    }
}
EOF

cat > backend/src/main/kotlin/com/silentguardian/security/AuthenticationFilter.kt << 'EOF'
package com.silentguardian.security
import org.springframework.http.HttpHeaders
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.server.ServerWebExchange
import org.springframework.web.server.WebFilter
import org.springframework.web.server.WebFilterChain
import reactor.core.publisher.Mono

@Component
class AuthenticationFilter(private val jwtUtil: JwtUtil) : WebFilter {
    override fun filter(exchange: ServerWebExchange, chain: WebFilterChain): Mono<Void> {
        val authHeader = exchange.request.headers.getFirst(HttpHeaders.AUTHORIZATION)
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            val token = authHeader.substring(7)
            if (jwtUtil.validateToken(token)) {
                val userId = jwtUtil.getUserIdFromToken(token)
                val auth = UsernamePasswordAuthenticationToken(userId, null, emptyList())
                return chain.filter(exchange)
                    .contextWrite(ReactiveSecurityContextHolder.withAuthentication(auth))
            }
        }
        return chain.filter(exchange)
    }
}
EOF

# -------------------- Controllers --------------------
cat > backend/src/main/kotlin/com/silentguardian/controller/AuthController.kt << 'EOF'
package com.silentguardian.controller
import com.silentguardian.model.User
import com.silentguardian.repository.UserRepository
import com.silentguardian.security.JwtUtil
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import java.util.Date

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtUtil: JwtUtil
) {
    data class RegisterRequest(val email: String, val password: String, val fullName: String, val phone: String)
    data class LoginRequest(val email: String, val password: String)
    data class AuthResponse(val accessToken: String, val refreshToken: String, val user: UserResponse)
    data class UserResponse(val id: String, val email: String, val fullName: String, val role: String, val kycStatus: String)

    @PostMapping("/register")
    fun register(@RequestBody req: RegisterRequest): Mono<Map<String, Any>> {
        return userRepository.existsByEmail(req.email)
            .flatMap { exists ->
                if (exists) Mono.error(ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already registered"))
                else {
                    val user = User(
                        email = req.email,
                        password = passwordEncoder.encode(req.password),
                        fullName = req.fullName,
                        phone = req.phone
                    )
                    userRepository.save(user).map { mapOf("message" to "User registered", "userId" to it.id) }
                }
            }
    }

    @PostMapping("/login")
    fun login(@RequestBody req: LoginRequest): Mono<AuthResponse> {
        return userRepository.findByEmail(req.email)
            .flatMap { user ->
                if (passwordEncoder.matches(req.password, user.password)) {
                    val accessToken = jwtUtil.generateAccessToken(user.id!!)
                    val refreshToken = jwtUtil.generateRefreshToken(user.id!!)
                    user.refreshToken = refreshToken
                    user.lastLogin = Date()
                    userRepository.save(user).map {
                        AuthResponse(accessToken, refreshToken,
                            UserResponse(it.id!!, it.email, it.fullName, it.role.name, it.kycStatus.name))
                    }
                } else Mono.error(ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"))
            }
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials")))
    }

    @PostMapping("/refresh")
    fun refresh(@RequestHeader("Authorization") authHeader: String): Mono<Map<String, String>> {
        val token = authHeader.substring(7)
        return if (jwtUtil.validateToken(token, true)) {
            val userId = jwtUtil.getUserIdFromToken(token, true)
            val newAccessToken = jwtUtil.generateAccessToken(userId)
            Mono.just(mapOf("accessToken" to newAccessToken))
        } else Mono.error(ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"))
    }
}
EOF

cat > backend/src/main/kotlin/com/silentguardian/controller/KycController.kt << 'EOF'
package com.silentguardian.controller
import com.silentguardian.model.KycData
import com.silentguardian.model.KycStatus
import com.silentguardian.repository.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import java.util.Date

@RestController
@RequestMapping("/api/v1/kyc")
class KycController(private val userRepository: UserRepository) {

    data class KycRequest(val documentType: String, val documentNumber: String, val documentImageUrl: String)

    @PostMapping("/submit")
    fun submitKyc(@RequestBody req: KycRequest): Mono<Map<String, String>> {
        return getCurrentUserId()
            .flatMap { userId ->
                userRepository.findById(userId)
                    .flatMap { user ->
                        val updatedUser = user.copy(
                            kycStatus = KycStatus.PENDING,
                            kycData = KycData(req.documentType, req.documentNumber, req.documentImageUrl, Date())
                        )
                        userRepository.save(updatedUser)
                            .map { mapOf("message" to "KYC submitted for review") }
                    }
            }
    }

    @GetMapping("/status")
    fun getKycStatus(): Mono<Map<String, String>> {
        return getCurrentUserId()
            .flatMap { userId ->
                userRepository.findById(userId)
                    .map { user -> mapOf("status" to user.kycStatus.name) }
                    .defaultIfEmpty(mapOf("status" to "NOT_FOUND"))
            }
    }

    @PutMapping("/review/{userId}")
    fun reviewKyc(@PathVariable userId: String, @RequestParam status: String): Mono<Map<String, String>> {
        return userRepository.findById(userId)
            .flatMap { user ->
                val newStatus = when (status.uppercase()) {
                    "APPROVED" -> KycStatus.APPROVED
                    "REJECTED" -> KycStatus.REJECTED
                    else -> return@flatMap Mono.error(ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status"))
                }
                val updatedUser = user.copy(kycStatus = newStatus)
                userRepository.save(updatedUser)
                    .map { mapOf("message" to "KYC $status") }
            }
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")))
    }

    private fun getCurrentUserId(): Mono<String> {
        return ReactiveSecurityContextHolder.getContext()
            .map { it.authentication.principal as String }
    }
}
EOF

cat > backend/src/main/kotlin/com/silentguardian/controller/CryptoPaymentController.kt << 'EOF'
package com.silentguardian.controller
import com.silentguardian.model.CryptoPayment
import com.silentguardian.model.PaymentStatus
import com.silentguardian.repository.CryptoPaymentRepository
import com.silentguardian.service.CryptoVerificationService
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import java.util.Date

@RestController
@RequestMapping("/api/v1/crypto")
class CryptoPaymentController(
    private val paymentRepository: CryptoPaymentRepository,
    private val verificationService: CryptoVerificationService,
    @Value("\${crypto.wallet.address}") private val walletAddress: String
) {

    data class CreatePaymentRequest(val planId: String, val amount: Double)

    @PostMapping("/create-payment")
    fun createPayment(@RequestBody req: CreatePaymentRequest): Mono<Map<String, Any>> {
        return getCurrentUserId()
            .flatMap { userId ->
                val payment = CryptoPayment(
                    userId = userId,
                    planId = req.planId,
                    amount = req.amount,
                    walletAddress = walletAddress,
                    status = PaymentStatus.PENDING
                )
                paymentRepository.save(payment)
                    .map { mapOf(
                        "paymentId" to it.id,
                        "walletAddress" to it.walletAddress,
                        "amount" to it.amount,
                        "currency" to it.currency,
                        "status" to it.status.name
                    ) }
            }
    }

    @PostMapping("/verify/{paymentId}")
    fun verifyPayment(@PathVariable paymentId: String): Mono<Map<String, String>> {
        return paymentRepository.findById(paymentId)
            .flatMap { payment ->
                if (payment.status != PaymentStatus.PENDING) {
                    return@flatMap Mono.just(mapOf("status" to payment.status.name))
                }
                verificationService.verifyUSDTTransaction(payment.amount, payment.walletAddress)
                    .flatMap { txHash ->
                        if (txHash != null) {
                            val updated = payment.copy(status = PaymentStatus.CONFIRMED, txHash = txHash, confirmedAt = Date())
                            paymentRepository.save(updated)
                                .map { mapOf("status" to "CONFIRMED", "txHash" to txHash) }
                        } else {
                            Mono.just(mapOf("status" to "PENDING", "message" to "Not yet confirmed"))
                        }
                    }
            }
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found")))
    }

    private fun getCurrentUserId(): Mono<String> {
        return ReactiveSecurityContextHolder.getContext()
            .map { it.authentication.principal as String }
    }
}
EOF

cat > backend/src/main/kotlin/com/silentguardian/controller/device/DeviceController.kt << 'EOF'
package com.silentguardian.controller.device
import com.silentguardian.model.Device
import com.silentguardian.model.Location
import com.silentguardian.repository.DeviceRepository
import com.silentguardian.repository.LocationRepository
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono
import reactor.core.publisher.Flux
import java.util.Date
import java.util.UUID

@RestController
@RequestMapping("/api/v1/devices")
class DeviceController(
    private val deviceRepository: DeviceRepository,
    private val locationRepository: LocationRepository
) {
    data class RegisterRequest(val deviceName: String, val hardwareInfo: Map<String, String>?)
    data class LocationRequest(val deviceId: String, val lat: Double, val lng: Double, val accuracy: Double?, val speed: Double?, val heading: Double?, val isOffline: Boolean?)

    @PostMapping("/register")
    fun register(@RequestBody req: RegisterRequest): Mono<Map<String, String>> {
        return getCurrentUserId()
            .flatMap { userId ->
                val deviceId = UUID.randomUUID().toString()
                val device = Device(
                    userId = userId,
                    deviceName = req.deviceName,
                    deviceId = deviceId,
                    status = com.silentguardian.model.DeviceStatus.ACTIVE
                )
                deviceRepository.save(device)
                    .map { mapOf("deviceId" to it.deviceId, "apiKey" to UUID.randomUUID().toString()) }
            }
    }

    @PostMapping("/location")
    fun submitLocation(@RequestBody req: LocationRequest): Mono<Map<String, String>> {
        return getCurrentUserId()
            .flatMap { userId ->
                val location = Location(
                    deviceId = req.deviceId,
                    userId = userId,
                    lat = req.lat,
                    lng = req.lng,
                    accuracy = req.accuracy,
                    speed = req.speed,
                    heading = req.heading,
                    isOffline = req.isOffline ?: false
                )
                locationRepository.save(location)
                    .flatMap {
                        deviceRepository.findByDeviceId(req.deviceId)
                            .flatMap { device ->
                                device.lastSeen = Date()
                                device.lastLocation = com.silentguardian.model.LocationData(req.lat, req.lng, req.accuracy, Date())
                                deviceRepository.save(device)
                            }
                    }
                    .map { mapOf("message" to "Location saved") }
            }
    }

    @GetMapping("/history")
    fun getHistory(@RequestParam deviceId: String): Flux<Location> {
        return getCurrentUserId()
            .flatMapMany { userId -> locationRepository.findByDeviceIdAndUserIdOrderByTimestampDesc(deviceId, userId) }
    }

    private fun getCurrentUserId(): Mono<String> {
        return ReactiveSecurityContextHolder.getContext()
            .map { it.authentication.principal as String }
    }
}
EOF

# -------------------- Crypto Verification Service --------------------
cat > backend/src/main/kotlin/com/silentguardian/service/CryptoVerificationService.kt << 'EOF'
package com.silentguardian.service
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono
import org.json.JSONObject

@Service
class CryptoVerificationService(
    @Value("\${crypto.api.key:}") private val apiKey: String,
    @Value("\${crypto.network:trc20}") private val network: String
) {
    private val webClient = WebClient.builder()
        .baseUrl(if (network == "trc20") "https://api.trongrid.io" else "https://api.bscscan.com/api")
        .build()

    fun verifyUSDTTransaction(expectedAmount: Double, targetAddress: String): Mono<String?> {
        return when (network.lowercase()) {
            "trc20" -> verifyTronUSDT(expectedAmount, targetAddress)
            "bep20" -> verifyBscUSDT(expectedAmount, targetAddress)
            else -> Mono.just(null)
        }
    }

    private fun verifyTronUSDT(expectedAmount: Double, targetAddress: String): Mono<String?> {
        return webClient.get()
            .uri("/v1/accounts/$targetAddress/transactions?only_confirmed=true&limit=10")
            .retrieve()
            .bodyToMono(String::class.java)
            .map { response ->
                val json = JSONObject(response)
                val data = json.getJSONArray("data")
                for (i in 0 until data.length()) {
                    val tx = data.getJSONObject(i)
                    val contract = tx.getJSONArray("raw_data").getJSONObject(0).getJSONArray("contract").getJSONObject(0)
                    if (contract.getString("type") == "TransferContract") {
                        val value = contract.getJSONObject("parameter").getJSONObject("value")
                        val toAddress = value.getString("to_address")
                        val amount = value.getLong("amount") / 1_000_000.0
                        if (toAddress.equals(targetAddress, ignoreCase = true) && amount == expectedAmount) {
                            return@map tx.getString("txID")
                        }
                    }
                }
                null
            }
            .onErrorReturn(null)
    }

    private fun verifyBscUSDT(expectedAmount: Double, targetAddress: String): Mono<String?> {
        val contractAddress = "0x55d398326f99059fF775485246999027B3197955"
        val url = "?module=account&action=tokentx&contractaddress=$contractAddress&address=$targetAddress&sort=desc&apikey=$apiKey"
        return webClient.get()
            .uri(url)
            .retrieve()
            .bodyToMono(String::class.java)
            .map { response ->
                val json = JSONObject(response)
                val result = json.getJSONArray("result")
                for (i in 0 until result.length()) {
                    val tx = result.getJSONObject(i)
                    val value = tx.getString("value").toDouble() / 1e18
                    if (value == expectedAmount) {
                        return@map tx.getString("hash")
                    }
                }
                null
            }
            .onErrorReturn(null)
    }
}
EOF

# -------------------- Environment file --------------------
cat > backend/.env.example << 'EOF'
MONGODB_URI=mongodb://localhost:27017/silentguardian
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
JWT_SECRET=your_super_secret_jwt_key_change_me
JWT_REFRESH_SECRET=your_refresh_secret_change_me
FRONTEND_URL=http://localhost:5173
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=admin@silentguardian.com
EMAIL_PASS=your_app_password
CRYPTO_WALLET_ADDRESS=your_trc20_or_bep20_usdt_address
CRYPTO_API_KEY=your_bscscan_api_key (if using BEP20)
CRYPTO_NETWORK=trc20
PORT=5000
EOF

# ============================================================================
# ANDROID APP (Native Kotlin)
# ============================================================================
cat > android/build.gradle.kts << 'EOF'
buildscript {
    repositories { google(); mavenCentral() }
    dependencies {
        classpath("com.android.tools.build:gradle:8.2.0")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.20")
        classpath("com.google.gms:google-services:4.4.0")
    }
}
allprojects { repositories { google(); mavenCentral() } }
EOF

cat > android/settings.gradle.kts << 'EOF'
rootProject.name = "SilentGuardian"
include(":app")
EOF

cat > android/gradle/wrapper/gradle-wrapper.properties << 'EOF'
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.2-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
EOF

cat > android/app/build.gradle.kts << 'EOF'
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.gms.google-services")
}
android {
    namespace = "com.silentguardian"
    compileSdk = 34
    defaultConfig {
        applicationId = "com.silentguardian"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "2.0"
    }
    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}
dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.work:work-runtime-ktx:2.9.0")
    implementation("com.google.android.gms:play-services-location:21.0.1")
    implementation("com.google.android.gms:play-services-integrity:20.0.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("androidx.room:room-runtime:2.6.0")
    implementation("androidx.room:room-ktx:2.6.0")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
}
EOF

cat > android/app/src/main/AndroidManifest.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.silentguardian">
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.SEND_SMS" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
    <application android:allowBackup="true" android:label="Silent Guardian" android:theme="@style/Theme.SilentGuardian">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter><action android:name="android.intent.action.MAIN" /><category android:name="android.intent.category.LAUNCHER" /></intent-filter>
        </activity>
        <service android:name=".TrackingService" android:foregroundServiceType="location" android:exported="false" />
        <service android:name=".BeaconService" android:exported="false" />
        <receiver android:name=".BootReceiver" android:exported="true">
            <intent-filter><action android:name="android.intent.action.BOOT_COMPLETED" /></intent-filter>
        </receiver>
        <receiver android:name=".SmsReceiver" android:exported="true">
            <intent-filter android:priority="1000"><action android:name="android.provider.Telephony.SMS_RECEIVED" /></intent-filter>
        </receiver>
    </application>
</manifest>
EOF

cat > android/app/src/main/kotlin/com/silentguardian/MainActivity.kt << 'EOF'
package com.silentguardian
import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.integrity.IntegrityManagerFactory

class MainActivity : AppCompatActivity() {
    private lateinit var statusText: TextView
    private lateinit var startTrackingButton: Button
    private lateinit var startBeaconButton: Button
    private lateinit var recallIdButton: Button
    companion object { private const val PERMISSION_REQUEST_CODE = 100 }
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        statusText = findViewById(R.id.statusText)
        startTrackingButton = findViewById(R.id.startTrackingButton)
        startBeaconButton = findViewById(R.id.startBeaconButton)
        recallIdButton = findViewById(R.id.recallIdButton)
        startTrackingButton.setOnClickListener { if (checkPermissions()) startTrackingService() else requestPermissions() }
        startBeaconButton.setOnClickListener { if (checkPermissions()) startBeaconService() else requestPermissions() }
        recallIdButton.setOnClickListener { storeDeviceRecallId() }
        checkPermissions()
        restoreDeviceRecallId()
    }
    private fun checkPermissions(): Boolean {
        val fine = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
        val background = if (Build.VERSION.SDK_INT >= 29) ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_BACKGROUND_LOCATION) else PackageManager.PERMISSION_GRANTED
        val btAdv = if (Build.VERSION.SDK_INT >= 31) ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_ADVERTISE) else PackageManager.PERMISSION_GRANTED
        val btConn = if (Build.VERSION.SDK_INT >= 31) ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) else PackageManager.PERMISSION_GRANTED
        val sms = ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS)
        return fine == PackageManager.PERMISSION_GRANTED && background == PackageManager.PERMISSION_GRANTED && btAdv == PackageManager.PERMISSION_GRANTED && btConn == PackageManager.PERMISSION_GRANTED && sms == PackageManager.PERMISSION_GRANTED
    }
    private fun requestPermissions() {
        val perms = mutableListOf(Manifest.permission.ACCESS_FINE_LOCATION)
        if (Build.VERSION.SDK_INT >= 29) perms.add(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
        if (Build.VERSION.SDK_INT >= 31) { perms.add(Manifest.permission.BLUETOOTH_ADVERTISE); perms.add(Manifest.permission.BLUETOOTH_CONNECT) }
        perms.add(Manifest.permission.SEND_SMS)
        ActivityCompat.requestPermissions(this, perms.toTypedArray(), PERMISSION_REQUEST_CODE)
    }
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.all { it == PackageManager.PERMISSION_GRANTED }) { Toast.makeText(this, "All permissions granted", Toast.LENGTH_SHORT).show(); statusText.text = "Ready" }
            else { Toast.makeText(this, "Some permissions denied", Toast.LENGTH_SHORT).show(); statusText.text = "Permissions missing" }
        }
    }
    private fun startTrackingService() { startService(Intent(this, TrackingService::class.java)); statusText.text = "Tracking active" }
    private fun startBeaconService() { startService(Intent(this, BeaconService::class.java)); Toast.makeText(this, "BLE beacon started", Toast.LENGTH_SHORT).show() }
    private fun storeDeviceRecallId() {
        val integrityManager = IntegrityManagerFactory.create(applicationContext)
        val uuid = getSharedPreferences("silentguardian", MODE_PRIVATE).getString("deviceRecallId", null) ?: java.util.UUID.randomUUID().toString()
        integrityManager.persistDeviceRecall(uuid.toByteArray()).addOnSuccessListener {
            getSharedPreferences("silentguardian", MODE_PRIVATE).edit().putString("deviceRecallId", uuid).apply()
            Toast.makeText(this, "Device Recall ID stored", Toast.LENGTH_SHORT).show()
        }.addOnFailureListener { Toast.makeText(this, "Failed to store recall ID", Toast.LENGTH_SHORT).show() }
    }
    private fun restoreDeviceRecallId() {
        IntegrityManagerFactory.create(applicationContext).retrieveDeviceRecall().addOnSuccessListener { data ->
            val id = String(data)
            getSharedPreferences("silentguardian", MODE_PRIVATE).edit().putString("deviceRecallId", id).apply()
        }.addOnFailureListener { }
    }
}
EOF

cat > android/app/src/main/kotlin/com/silentguardian/TrackingService.kt << 'EOF'
package com.silentguardian
import android.app.Service
import android.content.Intent
import android.os.IBinder
class TrackingService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY
}
EOF

cat > android/app/src/main/kotlin/com/silentguardian/BeaconService.kt << 'EOF'
package com.silentguardian
import android.app.Service
import android.content.Intent
import android.os.IBinder
class BeaconService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY
}
EOF

cat > android/app/src/main/kotlin/com/silentguardian/BootReceiver.kt << 'EOF'
package com.silentguardian
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            context.startService(Intent(context, TrackingService::class.java))
            context.startService(Intent(context, BeaconService::class.java))
        }
    }
}
EOF

cat > android/app/src/main/kotlin/com/silentguardian/SmsReceiver.kt << 'EOF'
package com.silentguardian
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) { }
}
EOF

cat > android/app/src/main/res/layout/activity_main.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent" android:layout_height="match_parent"
    android:orientation="vertical" android:padding="24dp" android:gravity="center">
    <TextView android:layout_width="wrap_content" android:layout_height="wrap_content"
        android:text="Silent Guardian" android:textSize="24sp" android:textStyle="bold"
        android:layout_marginBottom="32dp" />
    <TextView android:id="@+id/statusText" android:layout_width="wrap_content"
        android:layout_height="wrap_content" android:text="Ready" android:textSize="16sp"
        android:layout_marginBottom="32dp" />
    <Button android:id="@+id/startTrackingButton" android:layout_width="match_parent"
        android:layout_height="wrap_content" android:text="Start Tracking" android:layout_marginBottom="16dp" />
    <Button android:id="@+id/startBeaconButton" android:layout_width="match_parent"
        android:layout_height="wrap_content" android:text="Start BLE Beacon" android:layout_marginBottom="16dp" />
    <Button android:id="@+id/recallIdButton" android:layout_width="match_parent"
        android:layout_height="wrap_content" android:text="Store Device Recall ID" />
</LinearLayout>
EOF

cat > android/app/src/main/res/values/colors.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources><color name="purple_200">#FFBB86FC</color><color name="purple_500">#FF6200EE</color><color name="purple_700">#FF3700B3</color><color name="teal_200">#FF03DAC5</color><color name="teal_700">#FF018786</color><color name="black">#FF000000</color><color name="white">#FFFFFFFF</color></resources>
EOF

cat > android/app/src/main/res/values/themes.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources><style name="Theme.SilentGuardian" parent="Theme.MaterialComponents.DayNight.NoActionBar"><item name="colorPrimary">@color/purple_500</item><item name="colorPrimaryVariant">@color/purple_700</item><item name="colorOnPrimary">@color/white</item><item name="colorSecondary">@color/teal_200</item><item name="colorSecondaryVariant">@color/teal_700</item><item name="colorOnSecondary">@color/black</item><item name="android:statusBarColor">?attr/colorPrimaryVariant</item></style></resources>
EOF

cat > android/app/src/main/res/drawable/ic_launcher.xml << 'EOF'
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="oval"><solid android:color="#6200EE"/><size android:width="48dp" android:height="48dp"/></shape>
EOF

# ============================================================================
# FRONTEND (React + Vite)
# ============================================================================
cat > frontend/package.json << 'EOF'
{
  "name": "silent-guardian-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.10.0",
    "axios": "^1.3.4",
    "leaflet": "^1.9.3",
    "react-leaflet": "^4.2.1",
    "idb": "^7.1.1",
    "pako": "^2.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^3.1.0",
    "vite": "^4.2.0"
  }
}
EOF

cat > frontend/vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:5000' } }
})
EOF

cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Silent Guardian</title></head>
<body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>
</html>
EOF

cat > frontend/src/main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
EOF

cat > frontend/src/index.css << 'EOF'
body { margin: 0; font-family: 'Inter', sans-serif; background: #f5f5f5; }
EOF

cat > frontend/src/App.jsx << 'EOF'
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import KycUpload from './pages/KycUpload'
import CryptoCheckout from './pages/CryptoCheckout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/kyc" element={<KycUpload />} />
        <Route path="/checkout/:planId/:amount" element={<CryptoCheckout />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App
EOF

cat > frontend/src/pages/Login.jsx << 'EOF'
import React, { useState } from 'react'
import api from '../services/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('accessToken', res.data.accessToken)
      localStorage.setItem('refreshToken', res.data.refreshToken)
      window.location.href = '/'
    } catch (err) { alert('Login failed') }
  }
  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 20 }}>
      <h2>Silent Guardian</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', marginBottom: 10, padding: 8 }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', marginBottom: 10, padding: 8 }} />
        <button type="submit" style={{ width: '100%', padding: 10 }}>Login</button>
      </form>
      <p><a href="/kyc">Submit KYC</a></p>
    </div>
  )
}
EOF

cat > frontend/src/pages/Dashboard.jsx << 'EOF'
import React from 'react'
import { useNavigate } from 'react-router-dom'
export default function Dashboard() {
  const navigate = useNavigate()
  const handleLogout = () => { localStorage.clear(); navigate('/login') }
  return (
    <div><h1>Dashboard</h1><p>Welcome to Silent Guardian</p>
      <button onClick={() => navigate('/kyc')}>KYC Status</button>
      <button onClick={() => navigate('/checkout/premium/19.99')}>Buy Premium (USDT)</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}
EOF

cat > frontend/src/pages/KycUpload.jsx << 'EOF'
import React, { useState, useEffect } from 'react'
import api from '../services/api'

export default function KycUpload() {
  const [docType, setDocType] = useState('passport')
  const [docNumber, setDocNumber] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [status, setStatus] = useState('')
  const [kycStatus, setKycStatus] = useState('')

  useEffect(() => {
    api.get('/kyc/status').then(res => setKycStatus(res.data.status)).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/kyc/submit', { documentType: docType, documentNumber: docNumber, documentImageUrl: imageUrl })
      setStatus('KYC submitted. Awaiting approval.')
    } catch (err) { setStatus('Error submitting KYC') }
  }

  return (
    <div><h2>KYC Verification</h2><p>Current status: {kycStatus}</p>
      <form onSubmit={handleSubmit}>
        <select value={docType} onChange={e => setDocType(e.target.value)}>
          <option value="passport">Passport</option><option value="id_card">ID Card</option><option value="drivers_license">Driver's License</option>
        </select>
        <input type="text" placeholder="Document Number" value={docNumber} onChange={e => setDocNumber(e.target.value)} required />
        <input type="url" placeholder="Image URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} required />
        <button type="submit">Submit</button>
      </form>
      <p>{status}</p>
    </div>
  )
}
EOF

cat > frontend/src/pages/CryptoCheckout.jsx << 'EOF'
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'

export default function CryptoCheckout() {
  const { planId, amount } = useParams()
  const [paymentId, setPaymentId] = useState(null)
  const [walletAddress, setWalletAddress] = useState('')
  const [status, setStatus] = useState('')

  const initiatePayment = async () => {
    try {
      const res = await api.post('/crypto/create-payment', { planId, amount: parseFloat(amount) })
      setPaymentId(res.data.paymentId)
      setWalletAddress(res.data.walletAddress)
      setStatus('Waiting for payment...')
      pollPayment(res.data.paymentId)
    } catch (err) { setStatus('Error initiating payment') }
  }

  const pollPayment = async (id) => {
    const interval = setInterval(async () => {
      const res = await api.post(`/crypto/verify/${id}`)
      if (res.data.status === 'CONFIRMED') {
        clearInterval(interval); setStatus(`Payment confirmed! Tx: ${res.data.txHash}`)
      } else if (res.data.status === 'FAILED') {
        clearInterval(interval); setStatus('Payment failed')
      }
    }, 10000)
  }

  return (
    <div><h2>Pay with USDT</h2>
      {!paymentId ? <button onClick={initiatePayment}>Pay {amount} USDT</button> :
        <div><p>Send exactly <strong>{amount} USDT</strong> to:</p><code>{walletAddress}</code><p>Status: {status}</p></div>}
    </div>
  )
}
EOF

cat > frontend/src/services/api.js << 'EOF'
import axios from 'axios'
const api = axios.create({ baseURL: '/api/v1' })
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(res => res, async err => {
  if (err.response?.status === 401) {
    const refresh = localStorage.getItem('refreshToken')
    if (refresh) {
      try {
        const res = await axios.post('/api/v1/auth/refresh', null, { headers: { Authorization: `Bearer ${refresh}` } })
        localStorage.setItem('accessToken', res.data.accessToken)
        err.config.headers.Authorization = `Bearer ${res.data.accessToken}`
        return api(err.config)
      } catch (e) {}
    }
    localStorage.clear(); window.location.href = '/login'
  }
  return Promise.reject(err)
})
export default api
EOF

# ============================================================================
# ROOT FILES
# ============================================================================
cat > .gitignore << 'EOF'
# Compiled files
*.class
*.jar
*.war
*.log
# Backend
backend/build/
backend/.gradle/
backend/gradle/
!backend/gradle/wrapper/gradle-wrapper.jar
backend/out/
backend/.idea/
backend/*.iml
backend/.env
# Frontend
frontend/node_modules/
frontend/dist/
frontend/.env
frontend/.vite/
# Android
android/.gradle/
android/build/
android/app/build/
android/local.properties
android/*.iml
android/.idea/
# OS
.DS_Store
Thumbs.db
# Environment
.env
.env.local
.env.production
EOF

cat > README.md << 'EOF'
# Silent Guardian - Complete Tracking Solution (Kotlin + React + Android)

## Features
- Kotlin backend (Spring Boot) with MongoDB, Redis, JWT
- React frontend (Vite PWA) with KYC and USDT checkout
- Native Android app (background GPS, BLE beacon, SMS trigger, Device Recall API)
- Crypto payments (USDT – TRC20/BEP20)
- KYC verification

## Quick Start

### Prerequisites
- Java 17, MongoDB, Redis
- Node.js 18+
- Android SDK (for building APK)

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env (MONGODB_URI, JWT_SECRET, CRYPTO_WALLET_ADDRESS, etc.)
./gradlew bootRun
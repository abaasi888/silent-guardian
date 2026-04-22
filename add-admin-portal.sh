#!/bin/bash

# Silent Guardian - Add Admin Portal & Subscription System
# Run: chmod +x add-admin-portal.sh && ./add-admin-portal.sh

set -e

echo "Adding Admin Portal and Subscription features to Silent Guardian..."

# ============================================================================
# Create required directories
# ============================================================================
mkdir -p backend/src/main/kotlin/com/silentguardian/model
mkdir -p backend/src/main/kotlin/com/silentguardian/controller/admin
mkdir -p backend/src/main/kotlin/com/silentguardian/config
mkdir -p backend/src/main/kotlin/com/silentguardian/service
mkdir -p backend/src/main/kotlin/com/silentguardian/repository

mkdir -p frontend/src/admin/pages
mkdir -p frontend/src/admin/components
mkdir -p frontend/src/admin/services

# ============================================================================
# Backend additions
# ============================================================================

# 1. Subscription model
cat > backend/src/main/kotlin/com/silentguardian/model/Subscription.kt << 'EOF'
package com.silentguardian.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.util.Date

@Document("subscriptions")
data class Subscription(
    @Id val id: String? = null,
    val userId: String,
    val planId: String,
    val deviceTier: DeviceTier,
    val startDate: Date = Date(),
    var endDate: Date,
    var autoRenew: Boolean = false,
    var active: Boolean = true
)

enum class DeviceTier { CHEAP, EXPENSIVE }
EOF

# 2. Chat message model
cat > backend/src/main/kotlin/com/silentguardian/model/ChatMessage.kt << 'EOF'
package com.silentguardian.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.util.Date

@Document("chat_messages")
data class ChatMessage(
    @Id val id: String? = null,
    val fromUserId: String,
    val toUserId: String,
    val message: String,
    val timestamp: Date = Date(),
    var read: Boolean = false
)
EOF

# 3. Admin controllers
cat > backend/src/main/kotlin/com/silentguardian/controller/admin/AdminUserController.kt << 'EOF'
package com.silentguardian.controller.admin

import com.silentguardian.model.User
import com.silentguardian.repository.UserRepository
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
class AdminUserController(private val userRepository: UserRepository) {

    @GetMapping
    fun getAllUsers(): Flux<User> = userRepository.findAll()

    @DeleteMapping("/{userId}")
    fun deleteUser(@PathVariable userId: String): Mono<Void> = userRepository.deleteById(userId)

    @PutMapping("/{userId}/kyc")
    fun updateKycStatus(@PathVariable userId: String, @RequestParam status: String): Mono<User> {
        return userRepository.findById(userId)
            .flatMap { user ->
                user.kycStatus = com.silentguardian.model.KycStatus.valueOf(status.uppercase())
                userRepository.save(user)
            }
    }
}
EOF

cat > backend/src/main/kotlin/com/silentguardian/controller/admin/AdminDeviceController.kt << 'EOF'
package com.silentguardian.controller.admin

import com.silentguardian.model.Device
import com.silentguardian.repository.DeviceRepository
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/v1/admin/devices")
@PreAuthorize("hasRole('ADMIN')")
class AdminDeviceController(private val deviceRepository: DeviceRepository) {

    @GetMapping
    fun getAllDevices(): Flux<Device> = deviceRepository.findAll()

    @PutMapping("/{deviceId}/status")
    fun updateDeviceStatus(@PathVariable deviceId: String, @RequestParam status: String): Mono<Device> {
        return deviceRepository.findByDeviceId(deviceId)
            .flatMap { device ->
                device.status = com.silentguardian.model.DeviceStatus.valueOf(status.uppercase())
                deviceRepository.save(device)
            }
    }
}
EOF

# 4. WebSocket configuration
cat > backend/src/main/kotlin/com/silentguardian/config/WebSocketConfig.kt << 'EOF'
package com.silentguardian.config

import org.springframework.context.annotation.Configuration
import org.springframework.web.socket.config.annotation.EnableWebSocket
import org.springframework.web.socket.config.annotation.WebSocketConfigurer
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry

@Configuration
@EnableWebSocket
class WebSocketConfig : WebSocketConfigurer {
    override fun registerWebSocketHandlers(registry: WebSocketHandlerRegistry) {
        registry.addHandler(ChatWebSocketHandler(), "/ws/chat").setAllowedOrigins("*")
    }
}
EOF

cat > backend/src/main/kotlin/com/silentguardian/config/ChatWebSocketHandler.kt << 'EOF'
package com.silentguardian.config

import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.TextWebSocketHandler
import com.fasterxml.jackson.databind.ObjectMapper
import java.util.concurrent.ConcurrentHashMap

class ChatWebSocketHandler : TextWebSocketHandler() {
    private val sessions = ConcurrentHashMap<String, WebSocketSession>()
    private val objectMapper = ObjectMapper()

    override fun afterConnectionEstablished(session: WebSocketSession) {
        sessions[session.id] = session
    }

    override fun handleTextMessage(session: WebSocketSession, message: TextMessage) {
        val payload = message.payload
        val map = objectMapper.readValue(payload, Map::class.java)
        val recipientId = map["to"] as String
        val text = map["message"] as String
        // Broadcast to all (or implement private chat routing)
        sessions.values.forEach { it.sendMessage(TextMessage("{\"from\":\"${session.id}\",\"message\":\"$text\"}")) }
    }

    override fun afterConnectionClosed(session: WebSocketSession, status: org.springframework.web.socket.CloseStatus) {
        sessions.remove(session.id)
    }
}
EOF

# 5. Subscription scheduler
cat > backend/src/main/kotlin/com/silentguardian/service/SubscriptionScheduler.kt << 'EOF'
package com.silentguardian.service

import com.silentguardian.repository.SubscriptionRepository
import com.silentguardian.repository.UserRepository
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.util.Date

@Component
@EnableScheduling
class SubscriptionScheduler(
    private val subscriptionRepository: SubscriptionRepository,
    private val userRepository: UserRepository
) {
    @Scheduled(cron = "0 0 0 * * *")
    fun checkExpiredSubscriptions() {
        val now = Date()
        subscriptionRepository.findByEndDateBeforeAndActiveTrue(now)
            .flatMap { sub ->
                sub.active = false
                subscriptionRepository.save(sub)
                    .then(userRepository.findById(sub.userId))
                    .flatMap { user ->
                        user.subscriptionActive = false
                        userRepository.save(user)
                    }
            }
            .subscribe()
    }
}
EOF

# 6. Subscription repository
cat > backend/src/main/kotlin/com/silentguardian/repository/SubscriptionRepository.kt << 'EOF'
package com.silentguardian.repository

import com.silentguardian.model.Subscription
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux
import java.util.Date

interface SubscriptionRepository : ReactiveMongoRepository<Subscription, String> {
    fun findByUserId(userId: String): Flux<Subscription>
    fun findByEndDateBeforeAndActiveTrue(date: Date): Flux<Subscription>
}
EOF

# 7. Add WebSocket dependency to build.gradle.kts (if not already present)
if ! grep -q "spring-boot-starter-websocket" backend/build.gradle.kts; then
    sed -i '/dependencies {/a\    implementation("org.springframework.boot:spring-boot-starter-websocket")' backend/build.gradle.kts
fi

# ============================================================================
# Frontend Admin Portal
# ============================================================================

cat > frontend/src/admin/pages/AdminLogin.jsx << 'EOF'
import React, { useState } from 'react'
import api from '../../services/api'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/auth/login', { email, password })
      if (res.data.user.role !== 'ADMIN') throw new Error('Not admin')
      localStorage.setItem('accessToken', res.data.accessToken)
      localStorage.setItem('refreshToken', res.data.refreshToken)
      navigate('/admin/dashboard')
    } catch (err) { alert('Admin access denied') }
  }
  return (
    <div style={{ maxWidth: 400, margin: '100px auto' }}>
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{ width: '100%', marginBottom: 10, padding: 8 }} />
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={{ width: '100%', marginBottom: 10, padding: 8 }} />
        <button type="submit" style={{ width: '100%', padding: 10 }}>Login</button>
      </form>
    </div>
  )
}
EOF

cat > frontend/src/admin/pages/AdminDashboard.jsx << 'EOF'
import React, { useEffect, useState } from 'react'
import api from '../../services/api'
export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [devices, setDevices] = useState([])
  useEffect(() => {
    api.get('/admin/users').then(res => setUsers(res.data))
    api.get('/admin/devices').then(res => setDevices(res.data))
  }, [])
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <section><h2>Users</h2><ul>{users.map(u => <li key={u.id}>{u.email} - KYC: {u.kycStatus} <button onClick={() => api.put(`/admin/users/${u.id}/kyc?status=APPROVED`)}>Approve KYC</button> <button onClick={() => api.delete(`/admin/users/${u.id}`)}>Delete</button></li>)}</ul></section>
      <section><h2>Devices</h2><ul>{devices.map(d => <li key={d.id}>{d.deviceName} - Status: {d.status} <button onClick={() => api.put(`/admin/devices/${d.deviceId}/status?status=STOLEN`)}>Mark Stolen</button></li>)}</ul></section>
    </div>
  )
}
EOF

cat > frontend/src/admin/services/chat.js << 'EOF'
class ChatService {
    constructor() { this.socket = null }
    connect() { this.socket = new WebSocket('ws://localhost:5000/ws/chat') }
    sendMessage(to, message) { this.socket.send(JSON.stringify({ to, message })) }
    onMessage(callback) { this.socket.onmessage = (event) => callback(JSON.parse(event.data)) }
}
export default new ChatService()
EOF

# ============================================================================
# Instructions for manual steps
# ============================================================================
echo ""
echo "============================================================"
echo "✅ Script completed. Please perform the following manual steps:"
echo "============================================================"
echo ""
echo "1. Add these fields to backend/src/main/kotlin/com/silentguardian/model/User.kt (inside the data class, after kycData):"
echo "   var subscriptionId: String? = null,"
echo "   var subscriptionActive: Boolean = false,"
echo "   var subscriptionExpiry: Date? = null"
echo ""
echo "2. Replace backend/src/main/kotlin/com/silentguardian/security/SecurityConfig.kt with this version:"
echo "   (see below for the full file content)"
echo ""
echo "3. Add the following routes to frontend/src/App.jsx:"
echo "   import AdminLogin from './admin/pages/AdminLogin'"
echo "   import AdminDashboard from './admin/pages/AdminDashboard'"
echo "   <Route path='/admin/login' element={<AdminLogin />} />"
echo "   <Route path='/admin/dashboard' element={<AdminDashboard />} />"
echo ""
echo "4. Create an admin user in MongoDB: db.users.updateOne({email: \"admin@example.com\"}, {\$set: {role: \"ADMIN\"}})"
echo ""
echo "============================================================"
echo "NEW SecurityConfig.kt content (copy and replace):"
echo "============================================================"
cat << 'EOF2'
package com.silentguardian.security

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity
import org.springframework.security.config.web.server.SecurityWebFiltersOrder
import org.springframework.security.config.web.server.ServerHttpSecurity
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.server.SecurityWebFilterChain

@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
class SecurityConfig(private val authenticationFilter: AuthenticationFilter) {
    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder(12)

    @Bean
    fun springSecurityFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
        return http
            .csrf { it.disable() }
            .authorizeExchange {
                it.pathMatchers("/api/v1/auth/**", "/api/v1/crypto/webhook/**", "/health", "/ws/**").permitAll()
                    .pathMatchers("/api/v1/admin/**").hasRole("ADMIN")
                    .anyExchange().authenticated()
            }
            .addFilterAt(authenticationFilter, SecurityWebFiltersOrder.AUTHENTICATION)
            .httpBasic { it.disable() }
            .formLogin { it.disable() }
            .build()
    }
}
EOF2
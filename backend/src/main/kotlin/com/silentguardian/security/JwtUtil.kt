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

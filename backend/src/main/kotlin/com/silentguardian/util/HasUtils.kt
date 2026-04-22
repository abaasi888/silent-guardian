package com.silentguardian.util

import java.security.MessageDigest
import java.util.HexFormat

object HashUtils {

    fun sha256(input: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(input.toByteArray())
        return HexFormat.of().formatHex(hash)
    }

    fun md5(input: String): String {
        val digest = MessageDigest.getInstance("MD5")
        val hash = digest.digest(input.toByteArray())
        return HexFormat.of().formatHex(hash)
    }

    fun generateDeviceToken(deviceId: String, userId: String): String {
        val raw = "$deviceId:$userId:${System.currentTimeMillis()}"
        return sha256(raw)
    }
}
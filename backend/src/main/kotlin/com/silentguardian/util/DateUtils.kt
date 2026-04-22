package com.silentguardian.util

import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Date

object DateUtils {

    private val ISO_FORMATTER = DateTimeFormatter.ISO_INSTANT
    private val DEFAULT_ZONE = ZoneId.systemDefault()

    fun toLocalDateTime(date: Date): LocalDateTime {
        return Instant.ofEpochMilli(date.time).atZone(DEFAULT_ZONE).toLocalDateTime()
    }

    fun toDate(localDateTime: LocalDateTime): Date {
        return Date.from(localDateTime.atZone(DEFAULT_ZONE).toInstant())
    }

    fun formatIso(date: Date): String {
        return ISO_FORMATTER.format(date.toInstant())
    }

    fun parseIso(isoString: String): Date {
        return Date.from(Instant.from(ISO_FORMATTER.parse(isoString)))
    }

    fun isExpired(expirationDate: Date): Boolean {
        return Date().after(expirationDate)
    }
}
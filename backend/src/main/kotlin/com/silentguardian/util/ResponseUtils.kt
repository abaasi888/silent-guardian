package com.silentguardian.util

import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException
import java.util.Date

/**
 * Standard API response wrapper.
 */
data class ApiResponse<T>(
    val success: Boolean,
    val message: String? = null,
    val data: T? = null,
    val errors: List<String>? = null,
    val timestamp: String = DateUtils.formatIso(Date())
) {
    companion object {
        /**
         * Creates a successful response.
         * @param data The payload (optional).
         * @param message Optional success message.
         */
        fun <T> success(data: T? = null, message: String? = null): ApiResponse<T> {
            return ApiResponse(success = true, message = message, data = data)
        }

        /**
         * Creates an error response.
         * @param message Error message.
         * @param errors Optional list of detailed errors.
         */
        fun <T> error(message: String, errors: List<String>? = null): ApiResponse<T> {
            return ApiResponse(success = false, message = message, errors = errors)
        }

        /**
         * Throws a 404 Not Found exception.
         */
        fun <T> notFound(entity: String): Nothing {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "$entity not found")
        }

        /**
         * Throws a 400 Bad Request exception.
         */
        fun <T> badRequest(message: String): Nothing {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, message)
        }

        /**
         * Throws a 401 Unauthorized exception.
         */
        fun <T> unauthorized(message: String = "Unauthorized"): Nothing {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, message)
        }

        /**
         * Throws a 403 Forbidden exception.
         */
        fun <T> forbidden(message: String = "Access denied"): Nothing {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, message)
        }
    }
}
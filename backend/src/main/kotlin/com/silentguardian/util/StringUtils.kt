package com.silentguardian.util

object StringUtils {
    /**
     * Checks if a string is null, empty, or contains only whitespace.
     */
    fun isBlank(str: String?): Boolean {
        return str == null || str.isBlank()
    }

    /**
     * Truncates a string to the given length, adding "..." if truncated.
     */
    fun truncate(str: String, maxLength: Int): String {
        return if (str.length <= maxLength) str else str.substring(0, maxLength - 3) + "..."
    }
}
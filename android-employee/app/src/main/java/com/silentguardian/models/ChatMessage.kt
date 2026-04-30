package com.silentguardian.models

data class ChatMessage(
    val id: Long,
    val from: String,
    val text: String,
    val timestamp: String,
    val read: Boolean
)
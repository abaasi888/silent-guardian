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

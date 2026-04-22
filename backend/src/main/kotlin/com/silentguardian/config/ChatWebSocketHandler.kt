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

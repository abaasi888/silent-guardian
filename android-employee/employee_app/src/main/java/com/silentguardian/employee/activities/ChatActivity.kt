package com.silentguardian.employee.activities

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.silentguardian.employee.R
import com.silentguardian.employee.adapters.ChatAdapter
import com.silentguardian.employee.models.ChatMessage
import com.silentguardian.employee.utils.ApiClient
import com.silentguardian.employee.utils.SessionManager
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import androidx.lifecycle.lifecycleScope

class ChatActivity : AppCompatActivity() {

    private lateinit var rvMessages: RecyclerView
    private lateinit var etMessage: EditText
    private lateinit var btnSend: Button
    private lateinit var tvTyping: TextView
    private lateinit var chatAdapter: ChatAdapter
    private lateinit var sessionManager: SessionManager
    private lateinit var apiClient: ApiClient
    
    private val messages = mutableListOf<ChatMessage>()
    private val handler = Handler(Looper.getMainLooper())
    private var isTyping = false
    private var lastMessageCount = 0
    
    private val updateRunnable = object : Runnable {
        override fun run() {
            loadMessages()
            handler.postDelayed(this, 3000)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_chat)

        sessionManager = SessionManager(this)
        apiClient = ApiClient.getInstance(this)

        supportActionBar?.title = "Support Chat"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        initViews()
        loadMessages()
        startMessagePolling()
    }

    private fun initViews() {
        rvMessages = findViewById(R.id.rvMessages)
        etMessage = findViewById(R.id.etMessage)
        btnSend = findViewById(R.id.btnSend)
        tvTyping = findViewById(R.id.tvTyping)

        chatAdapter = ChatAdapter(messages, "employee")
        rvMessages.layoutManager = LinearLayoutManager(this)
        rvMessages.adapter = chatAdapter

        btnSend.setOnClickListener {
            sendMessage()
        }
    }

    private fun loadMessages() {
        lifecycleScope.launch {
            try {
                val newMessages = apiClient.apiService.getChatMessages()
                if (newMessages.isNotEmpty()) {
                    val wasEmpty = messages.isEmpty()
                    messages.clear()
                    messages.addAll(newMessages.map { msg ->
                        ChatMessage(msg.id, msg.from, msg.text, msg.timestamp, msg.read)
                    })
                    chatAdapter.notifyDataSetChanged()
                    if (wasEmpty || messages.size > lastMessageCount) {
                        rvMessages.scrollToPosition(messages.size - 1)
                    }
                    lastMessageCount = messages.size
                }
            } catch (e: Exception) {
                // Silent fail - will retry
            }
        }
    }

    private fun sendMessage() {
        val text = etMessage.text.toString().trim()
        if (text.isEmpty()) return

        val tempId = "temp_${System.currentTimeMillis()}"
        val tempMessage = ChatMessage(tempId, "employee", text, System.currentTimeMillis().toString(), false)
        
        messages.add(tempMessage)
        chatAdapter.notifyItemInserted(messages.size - 1)
        rvMessages.scrollToPosition(messages.size - 1)
        etMessage.text.clear()

        lifecycleScope.launch {
            try {
                val response = apiClient.apiService.sendChatMessage(ApiClient.SendChatMessageRequest(text))
                if (response.success) {
                    // Replace temp message with real one
                    val index = messages.indexOfFirst { it.id == tempId }
                    if (index != -1) {
                        messages[index] = ChatMessage(
                            response.message.id,
                            response.message.from,
                            response.message.text,
                            response.message.timestamp,
                            response.message.read
                        )
                        chatAdapter.notifyItemChanged(index)
                    }
                } else {
                    messages.removeAll { it.id == tempId }
                    chatAdapter.notifyDataSetChanged()
                    Toast.makeText(this@ChatActivity, "Failed to send", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                messages.removeAll { it.id == tempId }
                chatAdapter.notifyDataSetChanged()
                Toast.makeText(this@ChatActivity, "Failed to send", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun startMessagePolling() {
        handler.post(updateRunnable)
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(updateRunnable)
    }

    override fun onSupportNavigateUp(): Boolean {
        onBackPressed()
        return true
    }
}
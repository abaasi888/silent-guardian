package com.silentguardian.activities

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.silentguardian.R
import com.silentguardian.adapters.ChatAdapter
import com.silentguardian.models.ChatMessage
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class EmployeeChatActivity : AppCompatActivity() {

    private lateinit var rvMessages: RecyclerView
    private lateinit var etMessage: EditText
    private lateinit var btnSend: Button
    private lateinit var tvTyping: TextView
    private lateinit var chatAdapter: ChatAdapter
    private val messages = mutableListOf<ChatMessage>()
    private val employeeId = "emp_1"
    private val handler = Handler(Looper.getMainLooper())
    private var isTyping = false
    
    private val updateRunnable = object : Runnable {
        override fun run() {
            loadMessages()
            handler.postDelayed(this, 3000)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_employee_chat)
        
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
        
        chatAdapter = ChatAdapter(messages, employeeId)
        rvMessages.layoutManager = LinearLayoutManager(this)
        rvMessages.adapter = chatAdapter
        
        btnSend.setOnClickListener {
            sendMessage()
        }
        
        etMessage.setOnClickListener {
            sendTypingIndicator()
        }
    }
    
    private fun loadMessages() {
        val sharedPref = getSharedPreferences("sg_chat", MODE_PRIVATE)
        val chatKey = "chat_admin_$employeeId"
        val messagesJson = sharedPref.getString(chatKey, "[]")
        
        val type = object : TypeToken<List<ChatMessage>>() {}.type
        val loadedMessages: List<ChatMessage> = Gson().fromJson(messagesJson, type)
        
        messages.clear()
        messages.addAll(loadedMessages)
        chatAdapter.notifyDataSetChanged()
        rvMessages.scrollToPosition(messages.size - 1)
    }
    
    private fun sendMessage() {
        val text = etMessage.text.toString().trim()
        if (text.isEmpty()) return
        
        val message = ChatMessage(
            id = System.currentTimeMillis(),
            from = "employee",
            text = text,
            timestamp = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ", java.util.Locale.US)
                .format(java.util.Date()),
            read = false
        )
        
        val sharedPref = getSharedPreferences("sg_chat", MODE_PRIVATE)
        val chatKey = "chat_admin_$employeeId"
        val existingJson = sharedPref.getString(chatKey, "[]")
        val type = object : TypeToken<MutableList<ChatMessage>>() {}.type
        val existingMessages: MutableList<ChatMessage> = Gson().fromJson(existingJson, type)
        existingMessages.add(message)
        
        sharedPref.edit().putString(chatKey, Gson().toJson(existingMessages)).apply()
        
        etMessage.text.clear()
        loadMessages()
        
        val editor = getSharedPreferences("sg_chat_trigger", MODE_PRIVATE).edit()
        editor.putLong("last_trigger", System.currentTimeMillis())
        editor.apply()
    }
    
    private fun sendTypingIndicator() {
        if (!isTyping) {
            isTyping = true
            tvTyping.visibility = View.VISIBLE
            tvTyping.text = "Admin is typing..."
            
            handler.postDelayed({
                tvTyping.visibility = View.GONE
                isTyping = false
            }, 3000)
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
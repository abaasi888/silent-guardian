package com.silentguardian.employee.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.silentguardian.employee.R
import com.silentguardian.employee.models.ChatMessage
import java.text.SimpleDateFormat
import java.util.*

class ChatAdapter(
    private val messages: List<ChatMessage>,
    private val currentUserId: String
) : RecyclerView.Adapter<ChatAdapter.MessageViewHolder>() {

    private val dateFormat = SimpleDateFormat("hh:mm a", Locale.getDefault())

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MessageViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_chat_message, parent, false)
        return MessageViewHolder(view)
    }

    override fun onBindViewHolder(holder: MessageViewHolder, position: Int) {
        val message = messages[position]
        val isMine = message.from == "employee"
        
        holder.bind(message, isMine, formatTime(message.timestamp))
    }

    private fun formatTime(timestamp: String): String {
        return try {
            val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
            val date = sdf.parse(timestamp)
            date?.let { dateFormat.format(it) } ?: ""
        } catch (e: Exception) {
            timestamp
        }
    }

    override fun getItemCount(): Int = messages.size

    class MessageViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvMessage: TextView = itemView.findViewById(R.id.tvMessage)
        private val tvTime: TextView = itemView.findViewById(R.id.tvTime)
        private val messageBubble: View = itemView.findViewById(R.id.messageBubble)

        fun bind(message: ChatMessage, isMine: Boolean, time: String) {
            tvMessage.text = message.text
            tvTime.text = time
            
            if (isMine) {
                messageBubble.setBackgroundResource(R.drawable.bg_chat_bubble_mine)
                (messageBubble.layoutParams as ViewGroup.MarginLayoutParams).marginEnd = 16
                (messageBubble.layoutParams as ViewGroup.MarginLayoutParams).marginStart = 48
            } else {
                messageBubble.setBackgroundResource(R.drawable.bg_chat_bubble_other)
                (messageBubble.layoutParams as ViewGroup.MarginLayoutParams).marginStart = 16
                (messageBubble.layoutParams as ViewGroup.MarginLayoutParams).marginEnd = 48
            }
            messageBubble.requestLayout()
        }
    }
}
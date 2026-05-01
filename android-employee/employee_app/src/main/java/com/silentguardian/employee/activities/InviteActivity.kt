package com.silentguardian.employee.activities

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.silentguardian.employee.R
import com.silentguardian.employee.utils.ApiClient
import kotlinx.coroutines.launch

class InviteActivity : AppCompatActivity() {

    private lateinit var etEmail: EditText
    private lateinit var etPhone: EditText
    private lateinit var btnGenerate: Button
    private lateinit var btnCopy: Button
    private lateinit var btnShare: Button
    private lateinit var btnSendEmail: Button
    private lateinit var btnSendSms: Button
    private lateinit var tvInviteLink: TextView
    private lateinit var apiClient: ApiClient
    private var currentInviteLink = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_invite)

        apiClient = ApiClient.getInstance(this)
        initViews()
        setupClickListeners()
    }

    private fun initViews() {
        etEmail = findViewById(R.id.etEmail)
        etPhone = findViewById(R.id.etPhone)
        btnGenerate = findViewById(R.id.btnGenerate)
        btnCopy = findViewById(R.id.btnCopy)
        btnShare = findViewById(R.id.btnShare)
        btnSendEmail = findViewById(R.id.btnSendEmail)
        btnSendSms = findViewById(R.id.btnSendSms)
        tvInviteLink = findViewById(R.id.tvInviteLink)
    }

    private fun setupClickListeners() {
        btnGenerate.setOnClickListener { generateInviteLink() }
        btnCopy.setOnClickListener { copyToClipboard() }
        btnShare.setOnClickListener { shareInvite() }
        btnSendEmail.setOnClickListener { sendEmail() }
        btnSendSms.setOnClickListener { sendSms() }
    }

    private fun generateInviteLink() {
        lifecycleScope.launch {
            try {
                val response = apiClient.apiService.generateInviteLink()
                currentInviteLink = response.inviteLink
                tvInviteLink.text = currentInviteLink
                tvInviteLink.visibility = android.view.View.VISIBLE
                Toast.makeText(this@InviteActivity, "Link generated!", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(this@InviteActivity, "Failed to generate link", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun copyToClipboard() {
        if (currentInviteLink.isEmpty()) { Toast.makeText(this, "Generate link first", Toast.LENGTH_SHORT).show(); return }
        val clipboard = getSystemService(CLIPBOARD_SERVICE) as android.content.ClipboardManager
        val clip = android.content.ClipData.newPlainText("Invite Link", currentInviteLink)
        clipboard.setPrimaryClip(clip)
        Toast.makeText(this, "Link copied!", Toast.LENGTH_SHORT).show()
    }

    private fun shareInvite() {
        if (currentInviteLink.isEmpty()) { Toast.makeText(this, "Generate link first", Toast.LENGTH_SHORT).show(); return }
        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, "Join Silent Guardian! Use my invite link: $currentInviteLink")
        }
        startActivity(Intent.createChooser(shareIntent, "Share via"))
    }

    private fun sendEmail() {
        val email = etEmail.text.toString().trim()
        if (email.isEmpty()) { Toast.makeText(this, "Enter email", Toast.LENGTH_SHORT).show(); return }
        if (currentInviteLink.isEmpty()) { Toast.makeText(this, "Generate link first", Toast.LENGTH_SHORT).show(); return }
        lifecycleScope.launch {
            try {
                apiClient.apiService.sendInvite(ApiClient.SendInviteRequest(email, null, currentInviteLink))
                Toast.makeText(this@InviteActivity, "Invite sent to $email", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(this@InviteActivity, "Failed to send", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun sendSms() {
        val phone = etPhone.text.toString().trim()
        if (phone.isEmpty()) { Toast.makeText(this, "Enter phone number", Toast.LENGTH_SHORT).show(); return }
        if (currentInviteLink.isEmpty()) { Toast.makeText(this, "Generate link first", Toast.LENGTH_SHORT).show(); return }
        val intent = Intent(Intent.ACTION_VIEW).apply {
            data = android.net.Uri.parse("sms:$phone")
            putExtra("sms_body", "Join Silent Guardian! Download the app: $currentInviteLink")
        }
        startActivity(intent)
    }
}
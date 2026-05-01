package com.silentguardian.employee.activities

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.widget.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.silentguardian.employee.R
import com.silentguardian.employee.utils.ApiClient
import kotlinx.coroutines.launch

class RegisterActivity : AppCompatActivity() {

    private lateinit var etFullName: EditText
    private lateinit var etEmail: EditText
    private lateinit var etPhone: EditText
    private lateinit var etPassword: EditText
    private lateinit var etConfirmPassword: EditText
    private lateinit var etInviteCode: EditText
    private lateinit var btnUploadId: Button
    private lateinit var btnUploadSelfie: Button
    private lateinit var btnUploadCV: Button
    private lateinit var btnUploadNSSF: Button
    private lateinit var btnUploadBankAccount: Button
    private lateinit var btnUploadAcademics: Button
    private lateinit var btnRegister: Button
    private lateinit var tvIdStatus: TextView
    private lateinit var tvSelfieStatus: TextView
    private lateinit var tvCVStatus: TextView
    private lateinit var tvNSSFStatus: TextView
    private lateinit var tvBankStatus: TextView
    private lateinit var tvAcademicsStatus: TextView

    private val documents = mutableMapOf<String, Uri>()
    private var currentUploadField = ""
    private lateinit var apiClient: ApiClient

    private val pickImageLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == RESULT_OK) {
            val imageUri = result.data?.data
            imageUri?.let { uri ->
                when (currentUploadField) {
                    "id" -> { documents["idDocument"] = uri; tvIdStatus.text = "✅ Uploaded" }
                    "selfie" -> { documents["selfie"] = uri; tvSelfieStatus.text = "✅ Uploaded" }
                    "cv" -> { documents["cv"] = uri; tvCVStatus.text = "✅ Uploaded" }
                    "nssf" -> { documents["nssf"] = uri; tvNSSFStatus.text = "✅ Uploaded" }
                    "bank" -> { documents["bankAccount"] = uri; tvBankStatus.text = "✅ Uploaded" }
                    "academics" -> { documents["academics"] = uri; tvAcademicsStatus.text = "✅ Uploaded" }
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        apiClient = ApiClient.getInstance(this)
        initViews()
        setupClickListeners()
    }

    private fun initViews() {
        etFullName = findViewById(R.id.etFullName)
        etEmail = findViewById(R.id.etEmail)
        etPhone = findViewById(R.id.etPhone)
        etPassword = findViewById(R.id.etPassword)
        etConfirmPassword = findViewById(R.id.etConfirmPassword)
        etInviteCode = findViewById(R.id.etInviteCode)
        btnUploadId = findViewById(R.id.btnUploadId)
        btnUploadSelfie = findViewById(R.id.btnUploadSelfie)
        btnUploadCV = findViewById(R.id.btnUploadCV)
        btnUploadNSSF = findViewById(R.id.btnUploadNSSF)
        btnUploadBankAccount = findViewById(R.id.btnUploadBankAccount)
        btnUploadAcademics = findViewById(R.id.btnUploadAcademics)
        btnRegister = findViewById(R.id.btnRegister)
        tvIdStatus = findViewById(R.id.tvIdStatus)
        tvSelfieStatus = findViewById(R.id.tvSelfieStatus)
        tvCVStatus = findViewById(R.id.tvCVStatus)
        tvNSSFStatus = findViewById(R.id.tvNSSFStatus)
        tvBankStatus = findViewById(R.id.tvBankStatus)
        tvAcademicsStatus = findViewById(R.id.tvAcademicsStatus)
    }

    private fun setupClickListeners() {
        btnUploadId.setOnClickListener { currentUploadField = "id"; openImagePicker() }
        btnUploadSelfie.setOnClickListener { currentUploadField = "selfie"; openImagePicker() }
        btnUploadCV.setOnClickListener { currentUploadField = "cv"; openDocumentPicker() }
        btnUploadNSSF.setOnClickListener { currentUploadField = "nssf"; openDocumentPicker() }
        btnUploadBankAccount.setOnClickListener { currentUploadField = "bank"; openDocumentPicker() }
        btnUploadAcademics.setOnClickListener { currentUploadField = "academics"; openDocumentPicker() }
        btnRegister.setOnClickListener { registerEmployee() }
    }

    private fun openImagePicker() {
        val intent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
        pickImageLauncher.launch(intent)
    }

    private fun openDocumentPicker() {
        val intent = Intent(Intent.ACTION_GET_CONTENT).apply { type = "application/pdf"; addCategory(Intent.CATEGORY_OPENABLE) }
        pickImageLauncher.launch(intent)
    }

    private fun registerEmployee() {
        val fullName = etFullName.text.toString().trim()
        val email = etEmail.text.toString().trim()
        val phone = etPhone.text.toString().trim()
        val password = etPassword.text.toString().trim()
        val confirmPassword = etConfirmPassword.text.toString().trim()

        if (fullName.isEmpty() || email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Fill all required fields", Toast.LENGTH_SHORT).show()
            return
        }
        if (password != confirmPassword) {
            Toast.makeText(this, "Passwords do not match", Toast.LENGTH_SHORT).show()
            return
        }
        if (documents["idDocument"] == null || documents["selfie"] == null) {
            Toast.makeText(this, "Upload ID document and selfie", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            try {
                val response = apiClient.apiService.register(
                    ApiClient.RegisterRequest(
                        fullName, email, phone, password, etInviteCode.text.toString().trim(),
                        documents["idDocument"]?.toString() ?: "",
                        documents["selfie"]?.toString() ?: "",
                        documents["cv"]?.toString(), documents["nssf"]?.toString(),
                        documents["bankAccount"]?.toString(), documents["academics"]?.toString()
                    )
                )
                if (response.success) {
                    Toast.makeText(this@RegisterActivity, "Registration submitted! Awaiting approval.", Toast.LENGTH_LONG).show()
                    finish()
                } else {
                    Toast.makeText(this@RegisterActivity, response.message, Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@RegisterActivity, "Registration failed", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
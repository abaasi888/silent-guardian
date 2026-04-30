package com.silentguardian.activities

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.widget.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.silentguardian.R
import com.google.gson.Gson

class EmployeeRegisterActivity : AppCompatActivity() {

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
    
    private val pickImageLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == RESULT_OK) {
            val data: Intent? = result.data
            val imageUri = data?.data
            imageUri?.let { uri ->
                when (currentUploadField) {
                    "id" -> {
                        documents["idDocument"] = uri
                        tvIdStatus.text = "✅ Uploaded"
                        tvIdStatus.setTextColor(getColor(android.R.color.holo_green_dark))
                    }
                    "selfie" -> {
                        documents["selfie"] = uri
                        tvSelfieStatus.text = "✅ Uploaded"
                        tvSelfieStatus.setTextColor(getColor(android.R.color.holo_green_dark))
                    }
                    "cv" -> {
                        documents["cv"] = uri
                        tvCVStatus.text = "✅ Uploaded"
                        tvCVStatus.setTextColor(getColor(android.R.color.holo_green_dark))
                    }
                    "nssf" -> {
                        documents["nssf"] = uri
                        tvNSSFStatus.text = "✅ Uploaded"
                        tvNSSFStatus.setTextColor(getColor(android.R.color.holo_green_dark))
                    }
                    "bank" -> {
                        documents["bankAccount"] = uri
                        tvBankStatus.text = "✅ Uploaded"
                        tvBankStatus.setTextColor(getColor(android.R.color.holo_green_dark))
                    }
                    "academics" -> {
                        documents["academics"] = uri
                        tvAcademicsStatus.text = "✅ Uploaded"
                        tvAcademicsStatus.setTextColor(getColor(android.R.color.holo_green_dark))
                    }
                }
            }
        }
    }
    
    private var currentUploadField = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_employee_register)
        
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
        btnUploadId.setOnClickListener {
            currentUploadField = "id"
            openImagePicker()
        }
        btnUploadSelfie.setOnClickListener {
            currentUploadField = "selfie"
            openImagePicker()
        }
        btnUploadCV.setOnClickListener {
            currentUploadField = "cv"
            openDocumentPicker()
        }
        btnUploadNSSF.setOnClickListener {
            currentUploadField = "nssf"
            openDocumentPicker()
        }
        btnUploadBankAccount.setOnClickListener {
            currentUploadField = "bank"
            openDocumentPicker()
        }
        btnUploadAcademics.setOnClickListener {
            currentUploadField = "academics"
            openDocumentPicker()
        }
        
        btnRegister.setOnClickListener {
            registerEmployee()
        }
    }
    
    private fun openImagePicker() {
        val intent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
        pickImageLauncher.launch(intent)
    }
    
    private fun openDocumentPicker() {
        val intent = Intent(Intent.ACTION_GET_CONTENT)
        intent.type = "application/pdf"
        intent.addCategory(Intent.CATEGORY_OPENABLE)
        pickImageLauncher.launch(intent)
    }
    
    private fun registerEmployee() {
        val fullName = etFullName.text.toString().trim()
        val email = etEmail.text.toString().trim()
        val phone = etPhone.text.toString().trim()
        val password = etPassword.text.toString().trim()
        val confirmPassword = etConfirmPassword.text.toString().trim()
        val inviteCode = etInviteCode.text.toString().trim()
        
        if (fullName.isEmpty() || email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill all required fields", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (password != confirmPassword) {
            Toast.makeText(this, "Passwords do not match", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (documents["idDocument"] == null || documents["selfie"] == null) {
            Toast.makeText(this, "Please upload ID document and selfie", Toast.LENGTH_SHORT).show()
            return
        }
        
        val documentsMap = mutableMapOf<String, String>()
        documents.forEach { (key, uri) ->
            documentsMap[key] = uri.toString()
        }
        
        val employeeData = mapOf(
            "id" to System.currentTimeMillis(),
            "fullName" to fullName,
            "email" to email,
            "phone" to phone,
            "password" to password,
            "inviteCode" to inviteCode,
            "documents" to documentsMap,
            "status" to "pending",
            "submittedAt" to java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.US).format(java.util.Date())
        )
        
        val pendingEmployees = getSharedPreferences("sg_pending_employees", MODE_PRIVATE)
        val existingJson = pendingEmployees.getString("list", "[]")
        val gson = Gson()
        val type = object : com.google.gson.reflect.TypeToken<MutableList<Map<String, Any>>>() {}.type
        val list: MutableList<Map<String, Any>> = gson.fromJson(existingJson, type)
        list.add(employeeData)
        pendingEmployees.edit().putString("list", gson.toJson(list)).apply()
        
        Toast.makeText(this, "Registration submitted! Awaiting admin approval.", Toast.LENGTH_LONG).show()
        
        val intent = Intent(this, LoginActivity::class.java)
        startActivity(intent)
        finish()
    }
}
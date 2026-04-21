package com.silentguardian
import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.integrity.IntegrityManagerFactory

class MainActivity : AppCompatActivity() {
    private lateinit var statusText: TextView
    private lateinit var startTrackingButton: Button
    private lateinit var startBeaconButton: Button
    private lateinit var recallIdButton: Button
    companion object { private const val PERMISSION_REQUEST_CODE = 100 }
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        statusText = findViewById(R.id.statusText)
        startTrackingButton = findViewById(R.id.startTrackingButton)
        startBeaconButton = findViewById(R.id.startBeaconButton)
        recallIdButton = findViewById(R.id.recallIdButton)
        startTrackingButton.setOnClickListener { if (checkPermissions()) startTrackingService() else requestPermissions() }
        startBeaconButton.setOnClickListener { if (checkPermissions()) startBeaconService() else requestPermissions() }
        recallIdButton.setOnClickListener { storeDeviceRecallId() }
        checkPermissions()
        restoreDeviceRecallId()
    }
    private fun checkPermissions(): Boolean {
        val fine = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
        val background = if (Build.VERSION.SDK_INT >= 29) ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_BACKGROUND_LOCATION) else PackageManager.PERMISSION_GRANTED
        val btAdv = if (Build.VERSION.SDK_INT >= 31) ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_ADVERTISE) else PackageManager.PERMISSION_GRANTED
        val btConn = if (Build.VERSION.SDK_INT >= 31) ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) else PackageManager.PERMISSION_GRANTED
        val sms = ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS)
        return fine == PackageManager.PERMISSION_GRANTED && background == PackageManager.PERMISSION_GRANTED && btAdv == PackageManager.PERMISSION_GRANTED && btConn == PackageManager.PERMISSION_GRANTED && sms == PackageManager.PERMISSION_GRANTED
    }
    private fun requestPermissions() {
        val perms = mutableListOf(Manifest.permission.ACCESS_FINE_LOCATION)
        if (Build.VERSION.SDK_INT >= 29) perms.add(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
        if (Build.VERSION.SDK_INT >= 31) { perms.add(Manifest.permission.BLUETOOTH_ADVERTISE); perms.add(Manifest.permission.BLUETOOTH_CONNECT) }
        perms.add(Manifest.permission.SEND_SMS)
        ActivityCompat.requestPermissions(this, perms.toTypedArray(), PERMISSION_REQUEST_CODE)
    }
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.all { it == PackageManager.PERMISSION_GRANTED }) { Toast.makeText(this, "All permissions granted", Toast.LENGTH_SHORT).show(); statusText.text = "Ready" }
            else { Toast.makeText(this, "Some permissions denied", Toast.LENGTH_SHORT).show(); statusText.text = "Permissions missing" }
        }
    }
    private fun startTrackingService() { startService(Intent(this, TrackingService::class.java)); statusText.text = "Tracking active" }
    private fun startBeaconService() { startService(Intent(this, BeaconService::class.java)); Toast.makeText(this, "BLE beacon started", Toast.LENGTH_SHORT).show() }
    private fun storeDeviceRecallId() {
        val integrityManager = IntegrityManagerFactory.create(applicationContext)
        val uuid = getSharedPreferences("silentguardian", MODE_PRIVATE).getString("deviceRecallId", null) ?: java.util.UUID.randomUUID().toString()
        integrityManager.persistDeviceRecall(uuid.toByteArray()).addOnSuccessListener {
            getSharedPreferences("silentguardian", MODE_PRIVATE).edit().putString("deviceRecallId", uuid).apply()
            Toast.makeText(this, "Device Recall ID stored", Toast.LENGTH_SHORT).show()
        }.addOnFailureListener { Toast.makeText(this, "Failed to store recall ID", Toast.LENGTH_SHORT).show() }
    }
    private fun restoreDeviceRecallId() {
        IntegrityManagerFactory.create(applicationContext).retrieveDeviceRecall().addOnSuccessListener { data ->
            val id = String(data)
            getSharedPreferences("silentguardian", MODE_PRIVATE).edit().putString("deviceRecallId", id).apply()
        }.addOnFailureListener { }
    }
}
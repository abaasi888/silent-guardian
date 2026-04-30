package com.silentguardian.tracking.services

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.silentguardian.tracking.R
import com.silentguardian.tracking.activities.MainActivity
import com.silentguardian.tracking.utils.HardwareIdManager
import com.silentguardian.tracking.utils.SessionManager
import okhttp3.*
import org.altbeacon.beacon.*
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Beacon Service - Scans for BLE beacons and reports detections to server
 * Features:
 * - Detects iBeacon, Eddystone, AltBeacon, Kontakt.io beacons
 * - Reports detected beacons to server for proximity tracking
 * - Triggers alerts when specific beacons are found
 * - Helps locate lost items with Silent Guardian beacons
 * 
 * This service runs in the background and continuously scans for beacons.
 */
class BeaconService : Service(), BeaconConsumer, MonitorNotifier, RangeNotifier {

    companion object {
        private const val TAG = "BeaconService"
        private const val NOTIFICATION_ID = 1003
        private const val ALL_BEACONS_REGION = "all-beacons-region"
        
        // Silent Guardian custom beacon UUID
        private const val SILENT_GUARDIAN_UUID = "9c27b0a1-b2c3-d4e5-f6a7-b8c9d0e1f2a3"
    }

    private lateinit var beaconManager: BeaconManager
    private lateinit var bluetoothAdapter: BluetoothAdapter
    private lateinit var hardwareIdManager: HardwareIdManager
    private lateinit var sessionManager: SessionManager
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private var isScanning = false
    private var isBound = false
    private var detectedBeacons = mutableMapOf<String, BeaconInfo>()

    data class BeaconInfo(
        val firstSeen: Long,
        var lastSeen: Long,
        var rssi: Int,
        var distance: Double
    )

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Beacon Service Created")
        
        hardwareIdManager = HardwareIdManager(this)
        sessionManager = SessionManager(this)
        
        initializeBeaconManager()
        startForeground(NOTIFICATION_ID, createNotification())
    }

    private fun initializeBeaconManager() {
        try {
            val bluetoothManager = getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
            bluetoothAdapter = bluetoothManager.adapter

            beaconManager = BeaconManager.getInstanceForApplication(this)
            
            // Configure beacon parsers for different beacon types
            beaconManager.beaconParsers.clear()
            
            // iBeacon parser
            beaconManager.beaconParsers.add(BeaconParser().setBeaconLayout("m:2-3=0215,i:4-19,i:20-21,i:22-23,p:24-24"))
            
            // Eddystone UID parser
            beaconManager.beaconParsers.add(BeaconParser().setBeaconLayout("s:0-1=feaa,m:2-2=00,p:3-3:-41,i:4-13,i:14-19"))
            
            // Eddystone URL parser
            beaconManager.beaconParsers.add(BeaconParser().setBeaconLayout("s:0-1=feaa,m:2-2=10,p:3-3:-41,i:4-20v"))
            
            // AltBeacon parser
            beaconManager.beaconParsers.add(BeaconParser().setBeaconLayout("m:2-3=beac,i:4-19,i:20-21,i:22-23,p:24-24,d:25-25"))
            
            // Kontakt.io parser
            beaconManager.beaconParsers.add(BeaconParser().setBeaconLayout("m:0-3=4c000215,i:4-19,i:20-21,i:22-23,p:24-24"))
            
            // Background scan settings
            beaconManager.setBackgroundBetweenScanPeriod(5000) // 5 seconds between scans
            beaconManager.setBackgroundScanPeriod(1100) // 1.1 seconds scanning
            
            Log.d(TAG, "Beacon parsers configured")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize beacon manager: ${e.message}")
        }
    }

    override fun onBeaconServiceConnect() {
        Log.d(TAG, "Beacon service connected")
        
        try {
            beaconManager.setMonitorNotifier(this)
            beaconManager.setRangeNotifier(this)
            
            val region = Region(ALL_BEACONS_REGION, null, null, null)
            beaconManager.startMonitoringBeaconsInRegion(region)
            beaconManager.startRangingBeaconsInRegion(region)
            
            isScanning = true
            isBound = true
            
            Log.d(TAG, "Beacon monitoring and ranging started")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start beacon monitoring: ${e.message}")
        }
    }

    override fun didEnterRegion(region: Region) {
        Log.d(TAG, "Entered beacon region: ${region.uniqueId}")
        notifyServer("entered", region)
    }

    override fun didExitRegion(region: Region) {
        Log.d(TAG, "Exited beacon region: ${region.uniqueId}")
        notifyServer("exited", region)
    }

    override fun didDetermineStateForRegion(state: Int, region: Region) {
        val stateString = when (state) {
            MonitorNotifier.INSIDE -> "inside"
            MonitorNotifier.OUTSIDE -> "outside"
            else -> "unknown"
        }
        Log.d(TAG, "Region $stateString: ${region.uniqueId}")
    }

    override fun didRangeBeaconsInRegion(beacons: Collection<Beacon>, region: Region) {
        for (beacon in beacons) {
            processBeacon(beacon)
        }
    }

    private fun processBeacon(beacon: Beacon) {
        val beaconId = "${beacon.id1}-${beacon.id2}-${beacon.id3}"
        val currentTime = System.currentTimeMillis()
        
        // Update beacon info
        val existingInfo = detectedBeacons[beaconId]
        if (existingInfo == null) {
            detectedBeacons[beaconId] = BeaconInfo(
                firstSeen = currentTime,
                lastSeen = currentTime,
                rssi = beacon.rssi,
                distance = beacon.distance
            )
            // New beacon detected
            onBeaconDetected(beacon, true)
        } else {
            existingInfo.lastSeen = currentTime
            existingInfo.rssi = beacon.rssi
            existingInfo.distance = beacon.distance
        }
        
        // Clean up old beacons (not seen for > 60 seconds)
        detectedBeacons.entries.removeAll { 
            currentTime - it.value.lastSeen > 60000 
        }
        
        // Regular beacon update (every ~30 seconds)
        val timeSinceLastReport = currentTime - (existingInfo?.lastSeen ?: 0)
        if (timeSinceLastReport > 30000) {
            onBeaconDetected(beacon, false)
        }
    }

    private fun onBeaconDetected(beacon: Beacon, isNew: Boolean) {
        val beaconData = mapOf(
            "id1" to beacon.id1.toString(),
            "id2" to beacon.id2.toString(),
            "id3" to beacon.id3.toString(),
            "txPower" to beacon.txPower,
            "rssi" to beacon.rssi,
            "distance" to beacon.distance,
            "manufacturer" to beacon.manufacturerId,
            "serviceUuid" to beacon.serviceUuid?.toString(),
            "timestamp" to System.currentTimeMillis(),
            "isNew" to isNew
        )
        
        Log.d(TAG, "Beacon detected: ${beacon.id1}")
        
        // Check if this is a Silent Guardian beacon
        if (isSilentGuardianBeacon(beacon)) {
            Log.d(TAG, "🚨 Silent Guardian beacon detected!")
            triggerBeaconAlert(beacon, isNew)
        }
        
        // Send beacon data to server
        sendBeaconDataToServer(beaconData, isNew)
    }

    private fun isSilentGuardianBeacon(beacon: Beacon): Boolean {
        return beacon.id1.toString().equals(SILENT_GUARDIAN_UUID, ignoreCase = true)
    }

    private fun triggerBeaconAlert(beacon: Beacon, isNew: Boolean) {
        val hardwareId = hardwareIdManager.getPersistentDeviceId()
        val token = sessionManager.getAuthToken()
        
        if (token == null) {
            Log.w(TAG, "No auth token, cannot send beacon alert")
            return
        }
        
        val json = JSONObject().apply {
            put("hardwareId", hardwareId)
            put("beaconId", beacon.id1.toString())
            put("beaconRssi", beacon.rssi)
            put("beaconDistance", beacon.distance)
            put("timestamp", System.currentTimeMillis())
            put("type", "silent_guardian_beacon_detected")
            put("isNew", isNew)
            put("deviceLocation", getLastKnownLocation())
        }
        
        val request = Request.Builder()
            .url("https://api.silentguardian.com/api/beacon/alert")
            .addHeader("Authorization", "Bearer $token")
            .post(RequestBody.create(MediaType.parse("application/json"), json.toString()))
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "Failed to send beacon alert: ${e.message}")
            }
            override fun onResponse(call: Call, response: Response) {
                response.close()
                Log.d(TAG, "Beacon alert sent successfully")
                showBeaconNotification(beacon)
            }
        })
    }

    private fun sendBeaconDataToServer(beaconData: Map<String, Any?>, isNew: Boolean) {
        val token = sessionManager.getAuthToken() ?: return
        val hardwareId = hardwareIdManager.getPersistentDeviceId()
        
        val json = JSONObject().apply {
            put("hardwareId", hardwareId)
            put("beaconData", JSONObject(beaconData))
            put("timestamp", System.currentTimeMillis())
            put("isNew", isNew)
        }
        
        val request = Request.Builder()
            .url("https://api.silentguardian.com/api/beacon/detection")
            .addHeader("Authorization", "Bearer $token")
            .post(RequestBody.create(MediaType.parse("application/json"), json.toString()))
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "Failed to send beacon data: ${e.message}")
            }
            override fun onResponse(call: Call, response: Response) {
                response.close()
                Log.d(TAG, "Beacon data sent")
            }
        })
    }

    private fun notifyServer(event: String, region: Region) {
        val token = sessionManager.getAuthToken() ?: return
        val hardwareId = hardwareIdManager.getPersistentDeviceId()
        
        val json = JSONObject().apply {
            put("hardwareId", hardwareId)
            put("event", event)
            put("region", region.uniqueId)
            put("timestamp", System.currentTimeMillis())
        }
        
        val request = Request.Builder()
            .url("https://api.silentguardian.com/api/beacon/event")
            .addHeader("Authorization", "Bearer $token")
            .post(RequestBody.create(MediaType.parse("application/json"), json.toString()))
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "Failed to notify server: ${e.message}")
            }
            override fun onResponse(call: Call, response: Response) {
                response.close()
                Log.d(TAG, "Server notified of $event event")
            }
        })
    }

    private fun getLastKnownLocation(): JSONObject {
        return JSONObject().apply {
            try {
                val locationManager = getSystemService(Context.LOCATION_SERVICE) as android.location.LocationManager
                val location = locationManager.getLastKnownLocation(android.location.LocationManager.GPS_PROVIDER)
                    ?: locationManager.getLastKnownLocation(android.location.LocationManager.NETWORK_PROVIDER)
                
                if (location != null) {
                    put("lat", location.latitude)
                    put("lng", location.longitude)
                    put("accuracy", location.accuracy)
                } else {
                    put("available", false)
                }
            } catch (e: SecurityException) {
                put("available", false)
            }
        }
    }

    private fun showBeaconNotification(beacon: Beacon) {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )
        
        val notification = NotificationCompat.Builder(this, "beacon_channel")
            .setContentTitle("Silent Guardian Beacon Detected")
            .setContentText("Distance: ${String.format("%.2f", beacon.distance)}m")
            .setSmallIcon(R.drawable.ic_launcher)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
        
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
        notificationManager.notify(beacon.hashCode(), notification)
    }

    private fun createNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )
        
        return NotificationCompat.Builder(this, "beacon_channel")
            .setContentTitle("Silent Guardian")
            .setContentText("Beacon scanning active")
            .setSmallIcon(R.drawable.ic_launcher)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!isBound) {
            beaconManager.bind(this)
        }
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        if (isBound) {
            try {
                beaconManager.stopRangingBeaconsInRegion(Region(ALL_BEACONS_REGION, null, null, null))
                beaconManager.stopMonitoringBeaconsInRegion(Region(ALL_BEACONS_REGION, null, null, null))
                beaconManager.unbind(this)
            } catch (e: Exception) {
                Log.e(TAG, "Error stopping beacon scanning: ${e.message}")
            }
        }
        isScanning = false
        isBound = false
        Log.d(TAG, "Beacon Service Destroyed")
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
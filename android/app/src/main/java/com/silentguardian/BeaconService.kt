package com.silentguardian

import android.app.Service
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Intent
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import java.util.UUID

class BeaconService : Service() {
    private val TAG = "BeaconService"
    private var bluetoothLeAdvertiser: BluetoothLeAdvertiser? = null
    private val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
            Log.i(TAG, "BLE advertising started successfully")
        }

        override fun onStartFailure(errorCode: Int) {
            Log.e(TAG, "BLE advertising failed: $errorCode")
            stopSelf()
        }
    }

    override fun onCreate() {
        super.onCreate()
        startForeground(1, createNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startAdvertising()
        return START_STICKY
    }

    private fun startAdvertising() {
        val bluetoothManager = getSystemService(BLUETOOTH_SERVICE) as BluetoothManager
        val bluetoothAdapter = bluetoothManager.adapter

        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled) {
            Log.e(TAG, "Bluetooth is disabled")
            stopSelf()
            return
        }

        bluetoothLeAdvertiser = bluetoothAdapter.bluetoothLeAdvertiser
        if (bluetoothLeAdvertiser == null) {
            Log.e(TAG, "BLE advertising not supported")
            stopSelf()
            return
        }

        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(false)
            .build()

        // Custom beacon UUID – change to your own
        val beaconUuid = UUID.fromString("a1b2c3d4-e5f6-7890-1234-567890abcdef")
        val manufacturerId = 0x004C // Apple, but any can be used
        val beaconData = ByteArray(23)
        // Simple custom data: first 16 bytes = UUID, next 2 bytes major, next 2 minor, last 1 byte tx power
        System.arraycopy(beaconUuid.toString().replace("-", "").toByteArray(), 0, beaconData, 0, 16)

        val advertiseData = AdvertiseData.Builder()
            .setIncludeDeviceName(false)
            .addManufacturerData(manufacturerId, beaconData)
            .build()

        bluetoothLeAdvertiser?.startAdvertising(settings, advertiseData, advertiseCallback)
    }

    private fun createNotification() = NotificationCompat.Builder(this, "beacon_channel")
        .setContentTitle("Silent Guardian Beacon")
        .setContentText("BLE beacon is active")
        .setSmallIcon(android.R.drawable.ic_menu_mylocation)
        .setPriority(NotificationCompat.PRIORITY_LOW)
        .build()

    override fun onDestroy() {
        super.onDestroy()
        bluetoothLeAdvertiser?.stopAdvertising(advertiseCallback)
        Log.i(TAG, "Beacon service stopped")
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
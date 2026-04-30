package com.silentguardian.tracking.services

import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import android.os.IBuilder
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import com.silentguardian.tracking.R

/**
 * Alarm Service - Triggers loud alarm and vibration when remotely activated
 * Used for:
 * - Finding a lost device nearby
 * - Alerting others that the device has been found/stolen
 * - Emergency situations
 * 
 * The alarm plays at max volume for 30 seconds then auto-stops
 */
class AlarmService : Service() {

    companion object {
        private const val TAG = "AlarmService"
        private const val ALARM_DURATION_MS = 30000L // 30 seconds
    }

    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private val alarmHandler = android.os.Handler(android.os.Looper.getMainLooper())

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Alarm Service Created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startAlarm()
        return START_NOT_STICKY
    }

    private fun startAlarm() {
        try {
            // Initialize media player with alarm sound
            mediaPlayer = MediaPlayer.create(this, R.raw.alarm_sound)
            mediaPlayer?.apply {
                setAudioStreamType(AudioManager.STREAM_ALARM)
                isLooping = true
                setVolume(1.0f, 1.0f)
                start()
            }
            Log.d(TAG, "Alarm sound started")

            // Start vibration
            startVibration()

            // Schedule alarm stop after duration
            alarmHandler.postDelayed({
                stopAlarm()
            }, ALARM_DURATION_MS)

        } catch (e: Exception) {
            Log.e(TAG, "Failed to start alarm: ${e.message}")
            stopSelf()
        }
    }

    private fun startVibration() {
        try {
            vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vibratorManager.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // Pattern: vibrate 500ms, pause 500ms, repeat
                val vibrationEffect = VibrationEffect.createWaveform(
                    longArrayOf(500, 500, 500, 500),
                    0
                )
                vibrator?.vibrate(vibrationEffect)
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(longArrayOf(500, 500, 500, 500), 0)
            }
            Log.d(TAG, "Vibration started")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start vibration: ${e.message}")
        }
    }

    private fun stopAlarm() {
        try {
            mediaPlayer?.apply {
                if (isPlaying) {
                    stop()
                }
                release()
            }
            mediaPlayer = null

            vibrator?.cancel()
            vibrator = null

            Log.d(TAG, "Alarm stopped")
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping alarm: ${e.message}")
        } finally {
            stopSelf()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        stopAlarm()
        alarmHandler.removeCallbacksAndMessages(null)
        Log.d(TAG, "Alarm Service Destroyed")
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
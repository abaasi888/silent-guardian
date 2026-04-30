package com.silentguardian.tracking.activities

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import com.silentguardian.tracking.R
import com.silentguardian.tracking.services.AutoAuthService
import com.silentguardian.tracking.utils.SessionManager

/**
 * Splash Activity - First screen shown when app launches
 * Checks if user is logged in and auto-starts services if needed
 */
class SplashActivity : AppCompatActivity() {

    private lateinit var sessionManager: SessionManager
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)
        
        sessionManager = SessionManager(this)
        
        // Delay for smooth splash screen experience
        Handler(Looper.getMainLooper()).postDelayed({
            navigateToNextScreen()
        }, 2000)
    }
    
    private fun navigateToNextScreen() {
        if (sessionManager.isLoggedIn()) {
            // User is logged in, go to main dashboard
            startActivity(Intent(this, MainActivity::class.java))
            // Start auto-auth service in background
            startService(Intent(this, AutoAuthService::class.java))
        } else {
            // User not logged in, go to login screen
            startActivity(Intent(this, LoginActivity::class.java))
        }
        finish()
    }
}
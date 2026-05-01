package com.silentguardian.employee

import android.app.Application
import com.silentguardian.employee.utils.SessionManager

class SilentGuardianApplication : Application() {

    companion object {
        lateinit var instance: SilentGuardianApplication
            private set
        lateinit var sessionManager: SessionManager
            private set
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        sessionManager = SessionManager(this)
    }
}
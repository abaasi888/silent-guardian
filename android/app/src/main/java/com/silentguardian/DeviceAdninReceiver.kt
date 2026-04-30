package com.silentguardian

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast

class DeviceAdminReceiver : DeviceAdminReceiver() {
    
    companion object {
        private const val TAG = "DeviceAdminReceiver"
    }
    
    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.d(TAG, "Device Admin enabled")
        Toast.makeText(context, "Device Admin权限已启用 - Silent Guardian将获得最高权限", Toast.LENGTH_LONG).show()
    }
    
    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.d(TAG, "Device Admin disabled")
        Toast.makeText(context, "Device Admin权限已禁用", Toast.LENGTH_LONG).show()
    }
    
    override fun onActiveAdminRemoved(context: Context, intent: Intent) {
        super.onActiveAdminRemoved(context, intent)
        Log.d(TAG, "Device Admin removed")
    }
}

package com.silentguardian

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast

class DeviceAdminReceiver : DeviceAdminReceiver() {
    
    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.d("DeviceAdmin", "Device Admin enabled")
        Toast.makeText(context, "Silent Guardian has been granted device admin privileges", Toast.LENGTH_LONG).show()
    }
    
    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.d("DeviceAdmin", "Device Admin disabled")
    }
    
    override fun onLockTaskModeEntering(context: Context, intent: Intent, pkg: String?) {
        super.onLockTaskModeEntering(context, intent, pkg)
        Log.d("DeviceAdmin", "Lock task mode entered")
    }
}
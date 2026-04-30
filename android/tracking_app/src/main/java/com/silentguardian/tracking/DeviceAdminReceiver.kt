package com.silentguardian.tracking

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast

/**
 * Device Admin Receiver - Handles device administrator events
 * This is required for:
 * - Remote device locking
 * - Factory reset protection
 * - Preventing uninstallation
 * - Setting password policies
 * 
 * To activate: Settings -> Security -> Device Administrators -> Silent Guardian
 * Or programmatically via DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN
 */
class DeviceAdminReceiver : DeviceAdminReceiver() {

    companion object {
        private const val TAG = "DeviceAdminReceiver"
    }

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.d(TAG, "Device Admin enabled")
        Toast.makeText(context, "Silent Guardian device admin activated", Toast.LENGTH_LONG).show()
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.d(TAG, "Device Admin disabled")
        Toast.makeText(context, "Silent Guardian device admin deactivated", Toast.LENGTH_LONG).show()
    }

    override fun onPasswordChanged(context: Context, intent: Intent) {
        super.onPasswordChanged(context, intent)
        Log.d(TAG, "Password changed")
    }

    override fun onPasswordFailed(context: Context, intent: Intent) {
        super.onPasswordFailed(context, intent)
        Log.d(TAG, "Password failed")
    }

    override fun onPasswordSucceeded(context: Context, intent: Intent) {
        super.onPasswordSucceeded(context, intent)
        Log.d(TAG, "Password succeeded")
    }

    override fun onLockTaskModeEntering(context: Context, intent: Intent, pkg: String?) {
        super.onLockTaskModeEntering(context, intent, pkg)
        Log.d(TAG, "Lock task mode entered")
    }

    override fun onLockTaskModeExiting(context: Context, intent: Intent) {
        super.onLockTaskModeExiting(context, intent)
        Log.d(TAG, "Lock task mode exited")
    }

    override fun onDeviceProvisioned(context: Context, intent: Intent) {
        super.onDeviceProvisioned(context, intent)
        Log.d(TAG, "Device provisioned")
    }

    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        Log.d(TAG, "Profile provisioning complete")
    }

    override fun onChoosePrivateKeyAlias(
        context: Context,
        intent: Intent,
        uid: Int,
        uri: android.net.Uri?,
        alias: String?
    ): String? {
        Log.d(TAG, "Choose private key alias")
        return super.onChoosePrivateKeyAlias(context, intent, uid, uri, alias)
    }
}
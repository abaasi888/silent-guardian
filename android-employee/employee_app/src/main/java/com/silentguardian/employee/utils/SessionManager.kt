package com.silentguardian.employee.utils

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.silentguardian.employee.models.Employee

class SessionManager(private val context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(Constants.SHARED_PREFS_NAME, Context.MODE_PRIVATE)
    private val gson = Gson()

    fun saveAuthToken(token: String) {
        prefs.edit().putString(Constants.KEY_AUTH_TOKEN, token).apply()
        prefs.edit().putBoolean(Constants.KEY_IS_LOGGED_IN, true).apply()
    }

    fun getAuthToken(): String? {
        return prefs.getString(Constants.KEY_AUTH_TOKEN, null)
    }

    fun saveEmployee(employee: Employee) {
        val json = gson.toJson(employee)
        prefs.edit().putString(Constants.KEY_EMPLOYEE_DATA, json).apply()
    }

    fun getEmployee(): Employee? {
        val json = prefs.getString(Constants.KEY_EMPLOYEE_DATA, null)
        return if (json != null) gson.fromJson(json, Employee::class.java) else null
    }

    fun isLoggedIn(): Boolean {
        return prefs.getBoolean(Constants.KEY_IS_LOGGED_IN, false) && getAuthToken() != null
    }

    fun clearSession() {
        prefs.edit().clear().apply()
    }
}
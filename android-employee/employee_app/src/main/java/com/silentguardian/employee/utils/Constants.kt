package com.silentguardian.employee.utils

object Constants {
    const val BASE_URL = "https://api.silentguardian.com/"
    const val SHARED_PREFS_NAME = "sg_employee_prefs"
    const val KEY_AUTH_TOKEN = "auth_token"
    const val KEY_EMPLOYEE_DATA = "employee_data"
    const val KEY_IS_LOGGED_IN = "is_logged_in"
    
    // Career progression thresholds
    const val SIGNUPS_FOR_PERMANENT = 4000
    const val MONTHS_FOR_PERMANENT = 12
    const val COMMISSION_RATE_CONTRACTOR = 30
    const val COMMISSION_RATE_PERMANENT = 10
}
# Add project specific ProGuard rules here.
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.silentguardian.tracking.** { *; }
-keep class org.altbeacon.beacon.** { *; }
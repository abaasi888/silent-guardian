// Top-level build file for Silent Guardian Android project

buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        // Android Gradle Plugin version 8.2.0 (compatible with Gradle 8.2)
        classpath("com.android.tools.build:gradle:8.2.0")
        // Kotlin Gradle Plugin
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.20")
        // Google Services plugin (for Firebase, if used)
        classpath("com.google.gms:google-services:4.4.0")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

tasks.register("clean", Delete::class) {
    delete(rootProject.buildDir)
}
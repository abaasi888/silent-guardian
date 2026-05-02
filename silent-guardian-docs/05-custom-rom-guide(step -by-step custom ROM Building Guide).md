# Custom ROM Building Guide - Silent Guardian

## Version: 1.0 (Full Production)

---

## Document Information

| Property | Value |
|----------|-------|
| Project Name | Silent Guardian Custom ROM Integration |
| Document Type | Technical Guide |
| Version | 1.0 |
| Date | 2024 |
| Status | Approved |
| Author | Engineering Team |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Prerequisites](#2-prerequisites)
3. [Setting Up Build Environment](#3-setting-up-build-environment)
4. [Preparing Silent Guardian APK](#4-preparing-silent-guardian-apk)
5. [Integrating into AOSP](#5-integrating-into-aosp)
6. [Building the Custom ROM](#6-building-the-custom-rom)
7. [Flashing the ROM to Devices](#7-flashing-the-rom-to-devices)
8. [Verification and Testing](#8-verification-and-testing)
9. [Mass Production Flashing](#9-mass-production-flashing)
10. [Troubleshooting](#10-troubleshooting)
11. [Appendix](#11-appendix)

---

## 1. Introduction

### 1.1 What is a Custom ROM?

A Custom ROM is a modified version of the Android operating system. By embedding Silent Guardian as a system app in `/system/priv-app`, the app survives factory reset, auto-reinstalls after reset, and cannot be uninstalled by users.

### 1.2 Why Custom ROM is COMPULSORY for Silent Guardian

| Feature | Without Custom ROM | With Custom ROM |
|---------|-------------------|-----------------|
| App survives factory reset | NO | YES |
| Auto-reinstall after reset | NO | YES |
| User cannot uninstall | NO | YES |
| Auto-start on boot | Requires user consent | YES |
| Track after theft and reset | NO | YES |

**Without Custom ROM, Silent Guardian cannot deliver its core value proposition.**

### 1.3 How It Works

| Phase | Step | Description |
|-------|------|-------------|
| Build Once | Download AOSP | Get Android source code |
| Build Once | Embed APK | Place Silent Guardian in /system/priv-app |
| Build Once | Build ROM | Compile custom ROM (6-14 hours) |
| Flash Many | Connect Device | via USB |
| Flash Many | Flash ROM | 10 minutes per device |
| Result | System App | App survives factory reset |

---

## 2. Prerequisites

### 2.1 Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 8 cores | 16+ cores |
| RAM | 16GB | 32GB+ |
| Storage | 200GB free | 500GB SSD |
| Internet | 10 Mbps | 100 Mbps |

### 2.2 Software Requirements

| Software | Version | Purpose |
|----------|---------|---------|
| Ubuntu | 22.04 LTS | Build OS (REQUIRED) |
| OpenJDK | 17 | Java compiler |
| Python | 3.10+ | Build scripts |
| Git | 2.25+ | Version control |
| Repo | Latest | AOSP management |
| ADB/Fastboot | Latest | Device flashing |

### 2.3 Supported Devices

| Device | Code Name | Difficulty |
|--------|-----------|------------|
| Google Pixel 4 | flame | Easy |
| Google Pixel 5 | redfin | Easy |
| Google Pixel 6 | oriole | Easy |
| Google Pixel 6 Pro | raven | Easy |
| Google Pixel 7 | panther | Easy |
| Google Pixel 7 Pro | cheetah | Easy |
| Google Pixel 8 | shiba | Easy |
| Google Pixel 8 Pro | husky | Easy |

**Recommendation:** Start with Google Pixel devices for the easiest experience.

### 2.4 Install Required Packages

```bash
sudo apt update && sudo apt upgrade -y

sudo apt install -y adb fastboot git repo bc bison build-essential ccache curl flex g++-multilib gcc-multilib gnupg gperf imagemagick lib32ncurses5-dev lib32readline-dev lib32z1-dev libelf-dev liblz4-tool libsdl1.2-dev libssl-dev libxml2 libxml2-utils lzop pngcrush rsync schedtool squashfs-tools xsltproc zip zlib1g-dev python3 python3-pip

pip3 install pyyaml
2.5 Configure Git
bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
2.6 Create Build Directories
bash
mkdir -p ~/android/aosp
cd ~/android/aosp
mkdir -p ~/android/aosp/vendor/silentguardian
mkdir -p ~/android/aosp/vendor/silentguardian/etc/permissions
3. Setting Up Build Environment
3.1 Install Repo Tool
bash
mkdir -p ~/.local/bin
PATH=~/.local/bin:$PATH
curl https://storage.googleapis.com/git-repo-downloads/repo > ~/.local/bin/repo
chmod a+x ~/.local/bin/repo
3.2 Initialize AOSP Repository
bash
cd ~/android/aosp

# For Android 14 (recommended)
repo init -u https://android.googlesource.com/platform/manifest -b android-14.0.0_r1
3.3 Download Source Code
bash
# This downloads ~150GB - takes 2-4 hours
repo sync -j8

# If interrupted, resume with:
repo sync -j4
4. Preparing Silent Guardian APK
4.1 Build Release APK
bash
cd /path/to/silent-guardian/android-app
./gradlew assembleRelease
cp app/build/outputs/apk/release/app-release.apk ~/android/aosp/vendor/silentguardian/SilentGuardian.apk
4.2 Create Android.mk
File: ~/android/aosp/vendor/silentguardian/Android.mk

makefile
LOCAL_PATH := $(call my-dir)
include $(CLEAR_VARS)

LOCAL_MODULE := SilentGuardian
LOCAL_MODULE_TAGS := optional
LOCAL_SRC_FILES := SilentGuardian.apk
LOCAL_MODULE_CLASS := APPS
LOCAL_MODULE_SUFFIX := $(COMMON_ANDROID_PACKAGE_SUFFIX)
LOCAL_CERTIFICATE := platform
LOCAL_PRIVILEGED_MODULE := true
LOCAL_PERSISTENT := true
LOCAL_DEX_PREOPT := false

include $(BUILD_PREBUILT)
4.3 Create Permission Configuration
File: ~/android/aosp/vendor/silentguardian/etc/permissions/privapp-permissions-silentguardian.xml

xml
<?xml version="1.0" encoding="utf-8"?>
<permissions>
    <privapp-permissions package="com.silentguardian.tracking">
        <permission name="android.permission.ACCESS_FINE_LOCATION"/>
        <permission name="android.permission.ACCESS_BACKGROUND_LOCATION"/>
        <permission name="android.permission.RECEIVE_SMS"/>
        <permission name="android.permission.SEND_SMS"/>
        <permission name="android.permission.READ_SMS"/>
        <permission name="android.permission.SYSTEM_ALERT_WINDOW"/>
        <permission name="android.permission.WRITE_SECURE_SETTINGS"/>
        <permission name="android.permission.INTERACT_ACROSS_USERS"/>
        <permission name="android.permission.MANAGE_USERS"/>
        <permission name="android.permission.INTERNET"/>
        <permission name="android.permission.WAKE_LOCK"/>
        <permission name="android.permission.VIBRATE"/>
        <permission name="android.permission.FOREGROUND_SERVICE"/>
        <permission name="android.permission.BIND_DEVICE_ADMIN"/>
    </privapp-permissions>
</permissions>
4.4 Create Device.mk Integration
File: ~/android/aosp/vendor/silentguardian/device.mk

makefile
PRODUCT_PACKAGES += SilentGuardian

PRODUCT_COPY_FILES += vendor/silentguardian/etc/permissions/privapp-permissions-silentguardian.xml:$(TARGET_COPY_OUT_SYSTEM)/etc/permissions/privapp-permissions-silentguardian.xml

PRODUCT_PROPERTY_OVERRIDES += persist.sys.silentguardian.installed=true persist.sys.silentguardian.enabled=1
4.5 Create Init Script
File: ~/android/aosp/vendor/silentguardian/silentguardian.rc

rc
on property:sys.boot_completed=1
    start silentguardian

service silentguardian /system/bin/am start-activity -n com.silentguardian.tracking/.activities.SplashActivity
    class main
    user system
    group system
    disabled
    oneshot
5. Integrating into AOSP
5.1 Find Your Device Configuration
bash
ls ~/android/aosp/device/google/
# Examples: raviole (Pixel 6), panther (Pixel 7), shiba (Pixel 8)
5.2 Modify Device.mk
bash
nano ~/android/aosp/device/google/raviole/device.mk

# Add this line at the end:
# $(call inherit-product, vendor/silentguardian/device.mk)
5.3 Alternative Direct Addition
makefile
PRODUCT_PACKAGES += SilentGuardian

PRODUCT_COPY_FILES += vendor/silentguardian/etc/permissions/privapp-permissions-silentguardian.xml:$(TARGET_COPY_OUT_SYSTEM)/etc/permissions/privapp-permissions-silentguardian.xml
6. Building the Custom ROM
6.1 Set Up Build Environment
bash
cd ~/android/aosp
source build/envsetup.sh
lunch aosp_raviole-userdebug  # Replace raviole with your device codename
6.2 Configure Build Optimization
bash
export USE_CCACHE=1
export CCACHE_EXEC=/usr/bin/ccache
ccache -M 50G
export BUILD_NUMBER=$(date +%s)
6.3 Start Building
bash
make clobber
make -j$(nproc) otapackage
6.4 Build Output
bash
ls ~/android/aosp/out/target/product/[device]/
# Key files: aosp_[device]-ota-*.zip, system.img, boot.img
6.5 Build Times
Build Type	Time
First time full build	6 to 14 hours
Incremental build	2 to 4 hours
After small change	30 to 60 minutes
7. Flashing the ROM to Devices
7.1 Unlock Bootloader (One Time Per Device)
bash
# Enable Developer Options on phone
# Settings → About Phone → Tap Build Number 7 times

# Enable OEM Unlocking and USB Debugging
# Settings → Developer Options → OEM Unlocking → ON
# Settings → Developer Options → USB Debugging → ON

adb reboot bootloader
fastboot flashing unlock
# Confirm on phone screen
7.2 Flash the Custom ROM
bash
adb reboot bootloader
fastboot update ~/android/aosp/out/target/product/[device]/aosp_[device]-ota-*.zip
fastboot -w
fastboot reboot
7.3 First Boot
bash
# First boot takes 5-10 minutes

# Verify installation:
adb shell ls -la /system/priv-app/SilentGuardian/
adb shell ps | grep silentguardian
8. Verification and Testing
8.1 Verify System App Installation
bash
adb shell pm list packages -s | grep silentguardian
# Output: package:com.silentguardian.tracking

adb shell dumpsys package com.silentguardian.tracking | grep "granted"
8.2 Test Factory Reset Survival
Step	Action	Expected Result
1	Verify app in /system	App present
2	Perform factory reset from device	Device wipes data
3	After reboot	App still present
4	Verify app auto-starts	Process running
8.3 Test All Features
Test	Expected Result
Location tracking	Coordinates sent to server
SMS command	"#SG location" returns location
Remote lock	Device screen locks
Remote alarm	Device rings loudly
Factory reset detection	Alert sent to server
9. Mass Production Flashing
9.1 Setup Flashing Station
bash
# Hardware: 1 computer, 10-port USB hub, 10 USB-C cables, 10 phones

sudo apt install android-tools-adb android-tools-fastboot
nano ~/flash_station.sh
9.2 Flash Script for Multiple Devices
File: ~/flash_station.sh

bash
#!/bin/bash

ROM_PATH="/home/flasher/silentguardian-rom.zip"
LOG_FILE="/home/flasher/flash_log.txt"

echo "Silent Guardian Production Flasher"
echo "Started at: $(date)"

DEVICES=$(adb devices | grep -v "List" | grep "device$" | cut -f1)
DEVICE_COUNT=$(echo "$DEVICES" | wc -l)
echo "Found $DEVICE_COUNT devices to flash"

SUCCESS=0
FAILED=0

for DEVICE in $DEVICES; do
    echo "Flashing device: $DEVICE"
    adb -s $DEVICE reboot bootloader
    sleep 5
    
    if fastboot -s $DEVICE update $ROM_PATH; then
        echo "SUCCESS: $DEVICE" >> $LOG_FILE
        ((SUCCESS++))
    else
        echo "FAILED: $DEVICE" >> $LOG_FILE
        ((FAILED++))
    fi
done

echo "FLASHING COMPLETE"
echo "Successful: $SUCCESS"
echo "Failed: $FAILED"
9.3 Run Flashing Station
bash
chmod +x ~/flash_station.sh
./flash_station.sh
# Each device takes 10-15 minutes
9.4 Cost Per Device (Mass Production)
Item	Cost (USD)
Flashing labor (10 minutes at $15 per hour)	$2.50
USB cable wear	$0.10
Electricity	$0.05
Total per device	$2.65
10. Troubleshooting
10.1 Common Build Issues
Issue	Solution
repo sync fails	Run repo sync --force-sync
Out of memory	sudo fallocate -l 8G /swapfile
Java version error	sudo apt install openjdk-17-jdk
Build takes too long	Use ccache and -j flag
10.2 Common Flashing Issues
Issue	Solution
Device not detected	Install USB drivers, check cable
Bootloader locked	Must unlock before flashing
Boot loop	fastboot -w then reflash
App not in system	Verify PRODUCT_PACKAGES in device.mk
10.3 Recovery from Boot Loop
bash
adb reboot recovery
adb shell recovery --wipe_cache
adb shell recovery --wipe_data
fastboot flash stock system.img
11. Appendix
11.1 Supported Devices Reference
Device	Code Name	AOSP Target
Pixel 4	flame	aosp_flame-userdebug
Pixel 5	redfin	aosp_redfin-userdebug
Pixel 6	oriole	aosp_oriole-userdebug
Pixel 6 Pro	raven	aosp_raven-userdebug
Pixel 7	panther	aosp_panther-userdebug
Pixel 7 Pro	cheetah	aosp_cheetah-userdebug
Pixel 8	shiba	aosp_shiba-userdebug
Pixel 8 Pro	husky	aosp_husky-userdebug
11.2 Quick Commands Reference
bash
# Environment Setup
source build/envsetup.sh
lunch aosp_[device]-userdebug

# Build
make clobber
make -j$(nproc) otapackage

# Flash
adb reboot bootloader
fastboot flash system system.img
fastboot reboot

# Verify
adb shell pm list packages -s | grep silentguardian
adb shell ls -la /system/priv-app/SilentGuardian/
11.3 File Structure
text
~/android/aosp/
├── vendor/silentguardian/
│   ├── Android.mk
│   ├── device.mk
│   ├── SilentGuardian.apk
│   ├── silentguardian.rc
│   └── etc/permissions/privapp-permissions-silentguardian.xml
├── device/google/[device]/device.mk (modified)
└── out/target/product/[device]/
    ├── aosp_[device]-ota-*.zip
    ├── system.img
    ├── boot.img
    └── vendor.img
END OF DOCUMENT
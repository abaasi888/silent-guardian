
```markdown
# Silent Guardian - MVP Enterprise Architecture

## Version: 1.0-MVP (Cost Reduced Features + Custom ROM Compulsory)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Diagrams](#3-architecture-diagrams)
4. [Database Schema](#4-database-schema)
5. [API Endpoints](#5-api-endpoints)
6. [Security Architecture](#6-security-architecture)
7. [Deployment Architecture](#7-deployment-architecture)
8. [All Features Matrix](#8-all-features-matrix)
9. [Monitoring and Alerting](#9-monitoring-and-alerting)
10. [Cost Analysis](#10-cost-analysis)
11. [Scalability Plan](#11-scalability-plan)
12. [Backup and Disaster Recovery](#12-backup-and-disaster-recovery)
13. [Compliance and Legal](#13-compliance-and-legal)
14. [Glossary](#14-glossary)
15. [Appendices](#15-appendices)
16. [Revision History](#16-revision-history)
17. [Document Approval](#17-document-approval)

---

## 1. System Overview

### 1.1 What is Silent Guardian MVP?

Silent Guardian MVP is a cost-reduced version of the enterprise anti-theft tracking system. Custom ROM integration is COMPULSORY for MVP as it provides the unique value proposition of surviving factory reset.

**MVP Distribution:** Direct APK + Custom ROM (NOT on Google Play Store)

**MVP Core Features:**
- Real-time GPS tracking (5 minute intervals - reduced from 30 seconds)
- Location history (7 days - reduced from 30 days)
- Remote device control (lock, alarm, enable data, enable WiFi)
- SMS command system (only #SG location command)
- Factory reset detection and alerts
- App survival after factory reset (via Custom ROM)
- Basic employee commission management (30% contractor only)
- Mobile money payments (MTN and Airtel only)

### 1.2 Why Custom ROM is COMPULSORY for MVP

| Requirement | Without Custom ROM | With Custom ROM |
|-------------|-------------------|-----------------|
| App survives factory reset | No | Yes |
| Track after theft and reset | No | Yes |
| User cannot uninstall | No | Yes |
| Auto-start after reset | No | Yes |
| Unique value proposition | No | Yes |

**Without Custom ROM, Silent Guardian is just another tracking app. Custom ROM is the ONLY reason customers will choose Silent Guardian.**

### 1.3 MVP vs Full Production Comparison

| Feature | Full Production | MVP | Reason |
|---------|-----------------|-----|--------|
| Custom ROM | Optional | **COMPULSORY** | Core value proposition |
| GPS interval | 30 seconds | 5 minutes | Reduce server load |
| Location history | 30 days | 7 days | Save storage costs |
| SMS commands | 7 commands | 1 command (location) | Twilio free trial limit |
| BLE beacons | Yes | No | Save battery, complex |
| Live chat | Yes | No | Use email support |
| Redis cache | Yes | No | In-memory cache |
| Celery queue | Yes | No | Synchronous processing |
| Crypto payments | Yes | No | MTN/Airtel only |
| Card payments | Yes | No | Mobile money only |
| IMEI blacklist API | Yes | No | Manual spreadsheet |
| Community alerts | Yes | No | Add in v2 |
| Career progression | Yes | No | Manual tracking |
| Charts and graphs | Yes | No | Simple tables |

### 1.4 MVP Distribution Method

| Method | Description | Priority |
|--------|-------------|----------|
| Custom ROM Pre-installed | Phone comes with Silent Guardian in /system | Primary |
| Direct APK Download | User downloads from website (limited features without Custom ROM) | Secondary |
| QR Code | Scan from device package | Secondary |

---

## 2. Technology Stack

### 2.1 Android App (System App Ready - MVP)

| Component | Technology | Version | MVP Changes |
|-----------|------------|---------|-------------|
| Language | Kotlin | 1.9.20 | Same |
| Minimum SDK | API 26 (Android 8.0) | - | Same |
| Target SDK | API 34 (Android 14) | - | Same |
| Architecture | MVVM plus Repository | - | Same |
| Networking | OkHttp plus Retrofit | 4.12.0 / 2.9.0 | Same |
| BLE Beacons | Android Beacon Library | 2.19.4 | **REMOVED** |
| Device Admin | DevicePolicyManager | Built-in | Same |
| Push Notifications | Firebase Cloud Messaging | 23.4.0 | Same |

### 2.2 Custom ROM Build Environment (MVP)

| Component | Specification |
|-----------|---------------|
| AOSP Version | Android 14 (API 34) |
| Build OS | Ubuntu 22.04 LTS |
| Build Tools | repo, make, gcc, bc, bison |
| Minimum RAM | 16GB (32GB recommended) |
| Storage Required | 200GB+ |
| Build Time | 6 to 14 hours (first time) |

### 2.3 Backend (Python FastAPI - MVP)

| Component | Technology | MVP Changes |
|-----------|------------|-------------|
| Framework | FastAPI 0.104.1 | Same |
| Database | MongoDB Atlas M0 (free tier) | **M10 to M0** |
| Cache | In-memory dictionary | **Redis removed** |
| Authentication | JWT | Same |
| Password Hashing | bcrypt | Same |
| SMS | Twilio (free trial - 10 SMS/day) | **Reduced limit** |

### 2.4 Frontend (React - MVP)

| Component | Technology | MVP Changes |
|-----------|------------|-------------|
| Framework | React 18 | Same |
| Routing | React Router DOM | Same |
| HTTP Client | Axios | Same |
| Charts | **REMOVED** | Use simple tables |
| Maps | **REMOVED** | Show text coordinates |
| Hosting | Firebase Hosting (free tier) | Same |

---

## 3. Architecture Diagrams

### Diagram 3.1: MVP Architecture

[DIAGRAM TO BE INSERTED]

### Diagram 3.2: Factory Reset Survival Flow (MVP)

[DIAGRAM TO BE INSERTED]

### Diagram 3.3: SMS Command Flow (MVP - Location Only)

[DIAGRAM TO BE INSERTED]

### Diagram 3.4: Location Tracking Flow (MVP - 5 minute interval)

[DIAGRAM TO BE INSERTED]

### Diagram 3.5: MVP Data Flow

[DIAGRAM TO BE INSERTED]

---

## 4. Database Schema

### 4.1 MVP Collections (Reduced)

| Collection | Purpose | MVP Status |
|------------|---------|------------|
| users | Store user accounts | Keep |
| devices | Store tracked devices | Keep |
| employees | Store sales agents | Keep |
| subscriptions | Store active plans | Keep |
| commands | Store remote commands | Keep |
| transactions | Store payments | Keep |
| factory_reset_alerts | Store reset events | Keep |
| beacon_detections | BLE beacons | **REMOVED** |
| imei_blacklist | Block stolen devices | **REMOVED** |
| community_alerts | Stolen device reports | **REMOVED** |
| chat_messages | Chat history | **REMOVED** |
| audit_logs | Admin actions | **REMOVED** |

### 4.2 Collections Description

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| users | User accounts | email, fullName, accountType |
| devices | Tracked devices | deviceId, hardwareId, owner |
| employees | Sales agents | email, commissionRate, totalSignups |
| subscriptions | Active plans | deviceId, plan, amount, endDate |
| commands | Remote commands | deviceId, type, status |
| transactions | Payments | transactionId, amount, status |
| factory_reset_alerts | Reset events | deviceId, lastLocation, detectedAt |

---

## 5. API Endpoints

### 5.1 Active MVP Endpoints

| Method | Endpoint | Description | MVP Status |
|--------|----------|-------------|------------|
| POST | /api/v1/auth/register | User registration | Keep |
| POST | /api/v1/auth/login | User login | Keep |
| POST | /api/v1/auth/employee/login | Employee login | Keep |
| POST | /api/v1/auth/refresh | Refresh JWT | Keep |
| POST | /api/v1/auth/logout | Logout | Keep |
| POST | /api/v1/devices/register | Register device | Keep |
| POST | /api/v1/devices/location | Update location | Keep |
| GET | /api/v1/devices/info | Get device info | Keep |
| POST | /api/v1/devices/command | Send remote command | Keep |
| GET | /api/v1/devices/user/devices | Get user devices | Keep |
| GET | /api/v1/devices/history/{id} | Get location history | Keep |
| POST | /api/v1/devices/factory-reset-alert | Send reset alert | Keep |
| POST | /api/v1/sms/command | Process SMS command | Keep (location only) |
| GET | /commands/pending | Poll pending commands | Keep |
| POST | /commands/{id}/execute | Mark command executed | Keep |
| POST | /employees/register | Employee registration | Keep |
| GET | /employees/profile | Get employee profile | Keep |
| GET | /employees/commission | Get commission data | Keep |
| GET | /employees/invite/generate | Generate invite link | Keep |
| GET | /subscriptions/plans | Get available plans | Keep |
| GET | /subscriptions/my | Get user subscriptions | Keep |
| POST | /subscriptions/cancel/{id} | Cancel subscription | Keep |
| POST | /payments/mtn/initiate | Initiate MTN payment | Keep |
| POST | /payments/airtel/initiate | Initiate Airtel payment | Keep |
| GET | /payments/history | Get transaction history | Keep |
| POST | /tickets/create | Create ticket | Keep |
| GET | /tickets/my | Get user tickets | Keep |
| GET | /admin/dashboard/stats | Dashboard statistics | Keep |
| GET | /admin/users | List all users | Keep |
| GET | /admin/devices | List all devices | Keep |
| GET | /admin/employees | List all employees | Keep |

### 5.2 Removed MVP Endpoints

| Method | Endpoint | Reason |
|--------|----------|--------|
| POST | /api/v1/beacon/detection | Beacons removed |
| POST | /api/v1/beacon/alert | Beacons removed |
| GET | /imei/check | IMEI blacklist removed |
| POST | /imei/add | IMEI blacklist removed |
| GET | /alerts/nearby | Community alerts removed |
| POST | /alerts/create | Community alerts removed |
| GET | /chat/conversations | Chat removed |
| WebSocket | /ws/{token} | WebSocket removed |
| GET | /reports/revenue | Advanced reports removed |
| GET | /reports/export/{type} | Export removed |
| POST | /upload/kyc/id-document | KYC removed (MVP) |
| POST | /upload/kyc/selfie | KYC removed (MVP) |

---

## 6. Security Architecture

### 6.1 MVP Security Features

| Layer | Feature | Implementation | MVP Status |
|-------|---------|----------------|------------|
| Device | Hardware ID | Widevine DRM | Keep |
| Device | Encrypted Storage | EncryptedSharedPreferences | Keep |
| Device | Uninstall Protection | DevicePolicyManager | Keep |
| Device | Factory Reset Survival | Custom ROM in /system | **COMPULSORY** |
| Network | TLS | TLS 1.3 | Keep |
| Network | Rate Limiting | 100 requests per minute | Keep |
| Authentication | JWT | 24 hour expiry | Keep |
| Authentication | Password | bcrypt cost 10 (reduced from 12) | Keep |
| Data | At Rest | MongoDB encryption | Keep |
| Data | Backups | Manual weekly | Manual |

### 6.2 MVP Security Policies

| Policy | Implementation | MVP Changes |
|--------|----------------|-------------|
| Password Requirements | Minimum 6 characters | Reduced from 8 |
| Session Timeout | 24 hours for JWT | Same |
| Login Attempts | 5 failed attempts = 15 minute lockout | Same |
| API Rate Limiting | 100 requests per minute per IP | Same |
| Data Retention | Location data: 7 days | Reduced from 30 days |
| Data Deletion | Manual within 30 days | Manual process |

---

## 7. Deployment Architecture

### 7.1 MVP Infrastructure (Cost Reduced)

| Component | Technology | MVP Cost | Full Cost |
|-----------|------------|----------|-----------|
| Backend Hosting | Railway or Render | $5 | $80 - $150 |
| Database | MongoDB Atlas M0 (free) | $0 | $150 - $200 |
| Cache | In-memory dictionary | $0 | $35 - $50 |
| File Storage | Local filesystem | $0 | $5 - $10 |
| CDN | CloudFlare free tier | $0 | $20 - $30 |
| Load Balancer | Built-in | $0 | $18 - $25 |
| **Total** | | **$5** | **$308 - $465** |

### 7.2 External Services (MVP Reduced)

| Service | MVP Cost | Full Cost |
|---------|----------|-----------|
| Twilio SMS (free trial) | $0 | $50 - $200 |
| MTN Mobile Money fees | 0.5% of revenue | 0.5% of revenue |
| Airtel Money fees | 0.5% of revenue | 0.5% of revenue |
| Firebase FCM | $0 | $0 |
| **Subtotal** | **$0 + fees** | **$50 - $200 + fees** |

### 7.3 MVP One-Time Costs

| Item | Cost (USD) |
|------|------------|
| Domain Registration | $12 per year |
| SSL Certificate | $0 (Let's Encrypt) |
| Build server (existing computer) | $0 |
| Your time | Investment |
| **Subtotal** | **$12 per year** |

### 7.4 MVP Custom ROM Build Process

**Phase 1: Build Once**

| Step | Action | Time |
|------|--------|------|
| 1 | Setup Ubuntu 22.04 | 1 hour |
| 2 | Install build packages | 30 minutes |
| 3 | Download AOSP source | 2 to 4 hours |
| 4 | Integrate Silent Guardian APK | 1 hour |
| 5 | Build custom ROM | 6 to 14 hours |
| **Total** | | **10 to 20 hours** |

**Phase 2: Flash Many Devices**

| Step | Action | Time per Device |
|------|--------|-----------------|
| 1 | Connect device via USB | 1 minute |
| 2 | Unlock bootloader | 2 minutes |
| 3 | Flash custom ROM | 5 to 10 minutes |
| 4 | Reboot device | 2 minutes |
| **Total** | | **10 to 15 minutes** |

---

## 8. All Features Matrix

### 8.1 MVP Feature Status

| # | Module | Feature | MVP Status | Reason |
|---|--------|---------|------------|--------|
| 1 | Custom ROM | System app installation | **COMPULSORY** | Core value |
| 2 | Custom ROM | Survives factory reset | **COMPULSORY** | Core value |
| 3 | Custom ROM | Auto-start after reset | **COMPULSORY** | Core value |
| 4 | Location | GPS tracking | Yes (5 min) | Reduced interval |
| 5 | Location | Location history | Yes (7 days) | Reduced retention |
| 6 | Location | Offline location queue | Yes | Keep |
| 7 | Commands | Remote lock | Yes | Keep |
| 8 | Commands | Remote alarm | Yes | Keep |
| 9 | Commands | Enable mobile data | Yes | Keep |
| 10 | Commands | Enable WiFi | Yes | Keep |
| 11 | Commands | Start/stop tracking | Yes | Keep |
| 12 | SMS | #SG location | Yes | Keep |
| 13 | SMS | #SG lock | No | Twilio free limit |
| 14 | SMS | #SG alarm | No | Twilio free limit |
| 15 | SMS | #SG data_on | No | Twilio free limit |
| 16 | Factory Reset | Detect reset attempt | Yes | Keep |
| 17 | Factory Reset | Send last location | Yes | Keep |
| 18 | Factory Reset | Notify owner | Yes | Keep |
| 19 | Beacons | All beacon features | No | Complex, add later |
| 20 | Employees | Registration | Yes | Keep |
| 21 | Employees | Invite links | Yes | Keep |
| 22 | Employees | Commission (30% contractor) | Yes | Keep |
| 23 | Employees | Commission (10% permanent) | No | Add in v2 |
| 24 | Employees | Career progression | No | Manual tracking |
| 25 | Payments | MTN Mobile Money | Yes | Keep |
| 26 | Payments | Airtel Money | Yes | Keep |
| 27 | Payments | Transaction history | Yes | Keep |
| 28 | Admin | User management | Yes | Basic table |
| 29 | Admin | Device management | Yes | Basic table |
| 30 | Admin | Employee management | Yes | Basic table |
| 31 | Admin | Revenue reports | Yes | Simple numbers |
| 32 | Admin | IMEI blacklist | No | Spreadsheet |
| 33 | Admin | Community alerts | No | Add in v2 |
| 34 | Admin | Backup and restore | No | Manual backup |
| 35 | Tickets | Create ticket | Yes | Keep |
| 36 | Tickets | Reply to ticket | Yes | Keep |
| 37 | Chat | All chat features | No | Email support |
| 38 | IMEI | IMEI blacklist API | No | Spreadsheet |

**TOTAL MVP Features: 38 Active | 30 Removed | Custom ROM COMPULSORY**

---

## 9. Monitoring and Alerting

### 9.1 MVP Metrics to Monitor

| Metric | Threshold | Alert Action | MVP Changes |
|--------|-----------|--------------|-------------|
| API Response Time | > 1 second | Email | Relaxed from 500ms |
| API Error Rate | > 10% | Email | Relaxed from 5% |
| Database Connections | > 80% | Email | Same |
| CPU Usage | > 80% for 10 min | Manual check | No auto-scaling |
| Memory Usage | > 85% | Manual check | No auto-scaling |
| Disk Space | < 20% free | Manual check | Manual |
| SMS Delivery Rate | Ignored | None | Twilio free trial |

### 9.2 MVP Alert Rules (Simplified)

| Alert Name | Condition | Action |
|------------|-----------|--------|
| HighErrorRate | Error rate > 10% for 10 min | Email |
| API Down | No response for 5 min | Manual check |
| Database Full | Disk space < 20% | Manual check |

---

## 10. Cost Analysis

### 10.1 MVP Monthly Infrastructure Costs

| Service | Specification | MVP Cost (USD) | Full Cost (USD) | Savings |
|---------|--------------|----------------|-----------------|---------|
| Backend Hosting | Railway / Render | $5 | $80 - $150 | $75 - $145 |
| MongoDB | M0 free tier | $0 | $150 - $200 | $150 - $200 |
| Cache | In-memory | $0 | $35 - $50 | $35 - $50 |
| Cloud Storage | Local filesystem | $0 | $5 - $10 | $5 - $10 |
| CDN | CloudFlare free | $0 | $20 - $30 | $20 - $30 |
| Load Balancer | Built-in | $0 | $18 - $25 | $18 - $25 |
| **Subtotal** | | **$5** | **$308 - $465** | **$303 - $460** |

### 10.2 MVP External Services Costs

| Service | MVP Cost | Full Cost | Savings |
|---------|----------|-----------|---------|
| Twilio SMS (free trial - 10/day) | $0 | $50 - $200 | $50 - $200 |
| MTN Mobile Money fees | 0.5% | 0.5% | $0 |
| Airtel Money fees | 0.5% | 0.5% | $0 |
| Firebase FCM | $0 | $0 | $0 |
| **Subtotal** | **$0 + fees** | **$50 - $200 + fees** | **$50 - $200** |

### 10.3 MVP Total Monthly Cost

| Component | Cost (USD) |
|-----------|------------|
| Backend Hosting | $5 |
| Database | $0 |
| Cache | $0 |
| Storage | $0 |
| CDN | $0 |
| Load Balancer | $0 |
| SMS (Twilio free) | $0 |
| **Total** | **$5 + payment processing fees** |

**MVP Monthly Cost: $5 to $15 including fees for 100 users**

### 10.4 MVP Break-Even Analysis

| Premium Users | Monthly Revenue (USD) | Monthly Cost (USD) | Monthly Profit (USD) |
|---------------|----------------------|-------------------|----------------------|
| 1 | $10 | $5 | $5 |
| 5 | $50 | $5 | $45 |
| 10 | $100 | $5 | $95 |
| 20 | $200 | $5 | $195 |
| 50 | $500 | $10 | $490 |
| 100 | $1,000 | $15 | $985 |

### 10.5 MVP vs Full Production Cost Comparison

| Scale | MVP Cost | Full Production Cost | Savings |
|-------|----------|---------------------|---------|
| 10 users | $5 | $350 | $345 |
| 50 users | $10 | $400 | $390 |
| 100 users | $15 | $500 | $485 |
| 500 users | $50 | $600 | $550 |
| 1,000 users | $100 | $800 | $700 |

---

## 11. Scalability Plan

### 11.1 MVP Scaling Triggers

| Metric | Threshold | Action | MVP Approach |
|--------|-----------|--------|--------------|
| CPU Usage | > 80% for 10 min | Upgrade instance | Manual upgrade |
| Memory Usage | > 85% | Upgrade instance | Manual upgrade |
| Database Size | > 450MB (M0 limit) | Upgrade to M10 | Manual upgrade |
| Daily Active Users | > 100 | Add Redis | Enable caching |
| Location Requests | > 10,000 per day | Reduce interval to 2 min | Tune performance |

### 11.2 MVP to Production Migration Path

| Stage | Users | Configuration | Monthly Cost |
|-------|-------|---------------|--------------|
| MVP | 0 - 100 | M0, no Redis, 5 min interval | $5 - $15 |
| Growth | 100 - 500 | M10, add Redis, 2 min interval | $100 - $200 |
| Scaling | 500 - 2,000 | M20, Redis, 1 min interval | $200 - $300 |
| Production | 2,000 - 10,000 | M30, Redis cluster, 30 sec interval | $400 - $600 |

---

## 12. Backup and Disaster Recovery

### 12.1 MVP Backup Schedule (Simplified)

| Data Type | Frequency | Method |
|-----------|-----------|--------|
| MongoDB Database | Weekly | Manual mongodump |
| User Uploads | None | Not stored in MVP |
| Configuration | Per change | Git backup |

### 12.2 MVP Recovery Objectives

| Objective | Target |
|-----------|--------|
| Recovery Time Objective (RTO) | 24 hours |
| Recovery Point Objective (RPO) | 1 week |
| Backup Verification | Monthly |
| Disaster Recovery Drill | Before production launch |

### 12.3 MVP Backup Procedure

```bash
# Manual backup command
mongodump --uri="mongodb+srv://cluster.mongodb.net/silentguardian_mvp" --out=/backup/$(date +%Y%m%d)

# Restore if needed
mongorestore --uri="mongodb+srv://cluster.mongodb.net/silentguardian_mvp" --drop /backup/20241201/

12.4 MVP Data Retention
Data Category	Retention Period
Location History	7 days (automatic TTL)
User Accounts	Until deletion
Deleted Accounts	30 days
Transaction Records	1 year
13. Compliance and Legal
13.1 MVP Compliance Status
Requirement	MVP Status
GDPR Right to deletion	Manual process
GDPR Data portability	Not in MVP
User consent for tracking	Yes
Payment processing	MTN and Airtel
Privacy policy	Required
Terms of service	Required
13.2 MVP Privacy Policy (Simplified)
Section	Content
Information Collected	Location, device info, email, phone
How Information Used	Tracking, notifications, support
Data Sharing	MTN, Airtel
Data Retention	7 days for locations
User Rights	Account deletion
14. Glossary
Term	Definition
AOSP	Android Open Source Project
APK	Android Package Kit
Custom ROM	Modified Android version installed on devices
Factory Reset	Wiping all user data from a device
Hardware ID	Unique device identifier using Widevine
IMEI	International Mobile Equipment Identity
JWT	JSON Web Token
KYC	Know Your Customer
MDM	Mobile Device Management
MVP	Minimum Viable Product
RPO	Recovery Point Objective
RTO	Recovery Time Objective
SMS	Short Message Service
System App	App installed in /system partition
UGX	Ugandan Shilling
TTL	Time To Live
15. Appendices
15.1 MVP Environment Variables
bash
APP_NAME=Silent Guardian MVP
DEBUG=True
PORT=8000
ALLOWED_ORIGINS=https://silentguardian.com,http://localhost:5173

# MongoDB Free Tier
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/silentguardian_mvp
DATABASE_NAME=silentguardian_mvp

# No Redis for MVP
REDIS_URL=None

# JWT (shorter expiry for MVP)
SECRET_KEY=your-super-secret-key-mvp
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=7

# Admin
ADMIN_EMAIL=admin@silentguardian.com
ADMIN_PASSWORD=admin123

# Frontend
FRONTEND_URL=https://silentguardian.com

# Twilio Free Trial (10 SMS/day limit)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# MTN Mobile Money
MTN_API_URL=https://sandbox.mtn.co.ug/momo
MTN_SUBSCRIPTION_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MTN_API_USER=your_api_user
MTN_API_KEY=your_api_key

# Airtel Money
AIRTEL_API_URL=https://openapi.airtel.ug/merchant
AIRTEL_CLIENT_ID=your_client_id
AIRTEL_CLIENT_SECRET=your_client_secret

# Firebase (free tier)
FIREBASE_CREDENTIALS=./firebase-credentials.json
FCM_API_KEY=your_fcm_api_key
15.2 MVP Docker Compose (Simplified)
yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=mongodb://mongodb:27017
      - REDIS_URL=None
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  mongodb_data:
15.3 Code Changes for MVP
LocationTrackingService.kt - Change interval

kotlin
// Full version (commented out)
// private const val UPDATE_INTERVAL = 30000L

// MVP version (active)
private const val UPDATE_INTERVAL = 300000L  // 5 minutes
SmsReceiver.kt - Keep only location command

kotlin
when {
    normalizedCommand == "location" -> {
        sendCurrentLocation(context, senderNumber)
    }
    // Other commands commented out for MVP
    /*
    normalizedCommand == "lock" -> lockDeviceViaAdmin(context)
    normalizedCommand == "alarm" -> triggerAlarm(context)
    */
}
BeaconService.kt - Comment out entire file

kotlin
/*
class BeaconService : Service(), BeaconConsumer {
    // All beacon code commented out for MVP
}
*/
FactoryResetReceiver.kt - Keep active

kotlin
// KEEP THIS - Core MVP feature
class FactoryResetReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_FACTORY_RESET) {
            sendFinalAlert(context)
            sendLastLocation(context)
        }
    }
}
16. Revision History
Version	Date	Author	Changes
1.0-MVP	2024-01-01	System Architect	Initial MVP document
1.1-MVP	2024-02-01	System Architect	Added cost reduction strategies
17. Document Approval
Role	Name	Signature	Date
Product Manager	_____________	_____________	_____
Technical Lead	_____________	_____________	_____
Business Owner	_____________	_____________	_____
END OF   DOCUMENT
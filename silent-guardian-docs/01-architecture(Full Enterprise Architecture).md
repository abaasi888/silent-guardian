# Silent Guardian - Full Enterprise Architecture

## Version: 1.0 (All Features Active)

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

### 1.1 What is Silent Guardian?

Silent Guardian is an enterprise-grade anti-theft tracking system distributed as a direct APK (NOT on Google Play Store). It provides:

- Real-time GPS tracking (30 second intervals)
- Remote device control (lock, alarm, data enable)
- SMS command system (#SG prefix)
- Factory reset detection and alerts
- App survival after factory reset
- BLE beacon detection
- Employee commission management
- Mobile money payments (MTN and Airtel)

### 1.2 Distribution Method

| Method | Description |
|--------|-------------|
| Direct APK Download | User downloads from website |
| QR Code | Scan from device package/flyer |
| MDM Deployment | Corporate IT pushes to devices |
| Email Attachment | Support sends APK |

### 1.3 Key Differentiators (Why Not on Play Store)

| Feature | Play Store Apps | Silent Guardian |
|---------|-----------------|-----------------|
| Survives factory reset | No | Yes |
| SMS commands without default SMS app | No | Yes |
| Detect factory reset attempts | No | Yes |
| Prevent uninstall | No | Yes |
| Auto-start after reboot | Limited | Full |
| Background location always | Restricted | Always |

---

## 2. Technology Stack

### 2.1 Android App

| Component | Technology | Version |
|-----------|------------|---------|
| Language | Kotlin | 1.9.20 |
| Minimum SDK | API 26 (Android 8.0) | - |
| Target SDK | API 34 (Android 14) | - |
| Architecture | MVVM plus Repository | - |
| Networking | OkHttp plus Retrofit | 4.12.0 / 2.9.0 |
| BLE Beacons | Android Beacon Library | 2.19.4 |
| Device Admin | DevicePolicyManager | Built-in |
| Push Notifications | Firebase Cloud Messaging | 23.4.0 |

### 2.2 Backend (Python FastAPI)

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | FastAPI | 0.104.1 |
| Server | Uvicorn | 0.24.0 |
| Database | MongoDB (Motor) | 3.3.2 |
| Cache | Redis | 5.0.1 |
| Authentication | JWT (python-jose) | 3.3.0 |
| Password Hashing | bcrypt | 1.7.4 |
| SMS | Twilio | 8.10.0 |

### 2.3 Frontend (React)

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 18 |
| Routing | React Router DOM | 6.x |
| HTTP Client | Axios | 1.x |
| Hosting | Firebase Hosting | - |

---

## 3. Architecture Diagrams

### Diagram 3.1: Complete System Architecture

[DIAGRAM TO BE INSERTED]

### Diagram 3.2: Factory Reset Protection Flow

[DIAGRAM TO BE INSERTED]

### Diagram 3.3: SMS Command Flow

[DIAGRAM TO BE INSERTED]

### Diagram 3.4: App Survival Mode Flow

[DIAGRAM TO BE INSERTED]

### Diagram 3.5: Complete Data Flow

[DIAGRAM TO BE INSERTED]

---

## 4. Database Schema

### 4.1 Complete ER Diagram

[DIAGRAM TO BE INSERTED]

### 4.2 Collections Description

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| users | Store user accounts | email, fullName, accountType |
| devices | Store tracked devices | deviceId, hardwareId, owner |
| employees | Store sales agents | email, commissionRate, totalSignups |
| subscriptions | Store active plans | deviceId, plan, amount, endDate |
| commands | Store remote commands | deviceId, type, status |
| transactions | Store payments | transactionId, amount, status |
| factory_reset_alerts | Store reset events | deviceId, lastLocation, detectedAt |
| chat_messages | Store chat history | sender, message, read |
| imei_blacklist | Block stolen devices | imei, reason |

---

## 5. API Endpoints

### 5.1 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | User registration |
| POST | /api/v1/auth/login | User login |
| POST | /api/v1/auth/employee/login | Employee login |
| POST | /api/v1/auth/refresh | Refresh JWT token |
| POST | /api/v1/auth/logout | Logout |
| POST | /api/v1/auth/change-password | Change password |
| POST | /api/v1/auth/forgot-password | Request password reset |
| POST | /api/v1/auth/reset-password | Reset password |

### 5.2 Device Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/devices/register | Register device |
| POST | /api/v1/devices/location | Update location |
| GET | /api/v1/devices/info | Get device info |
| GET | /api/v1/devices/status | Get device status |
| POST | /api/v1/devices/heartbeat | Send heartbeat |
| POST | /api/v1/devices/command | Send remote command |
| GET | /api/v1/devices/user/devices | Get user devices |
| POST | /api/v1/devices/link | Link device to user |
| POST | /api/v1/devices/unlink/{id} | Unlink device |
| GET | /api/v1/devices/history/{id} | Get location history |
| GET | /api/v1/devices/admin/all | List all devices (Admin) |
| PUT | /api/v1/devices/{id}/status | Update device status (Admin) |
| DELETE | /api/v1/devices/{id} | Delete device (Admin) |

### 5.3 Factory Reset Protection Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/devices/factory-reset-alert | Send reset alert |
| POST | /api/v1/devices/set-device-owner | Set device owner |
| POST | /api/v1/devices/enable-survival | Enable survival mode |
| GET | /api/v1/devices/survival-status | Check survival status |

### 5.4 SMS Command Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/sms/command | Process SMS command |
| POST | /api/v1/sms/reply | Send SMS reply |
| GET | /api/v1/sms/logs | View SMS history (Admin) |
| POST | /api/v1/sms/whitelist | Add authorized number (Admin) |

### 5.5 Command Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /commands/pending | Poll pending commands |
| POST | /commands/{id}/execute | Mark command executed |
| POST | /commands/send | Send command |
| GET | /commands/history/{hwId} | Get command history |
| GET | /commands/admin/all | List all commands (Admin) |

### 5.6 Beacon Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/beacon/detection | Report beacon detection |
| POST | /api/v1/beacon/alert | Send beacon alert |
| POST | /api/v1/beacon/event | Notify region event |
| GET | /api/v1/beacon/nearby | Get nearby beacons |

### 5.7 Employee Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /employees/register | Employee registration |
| GET | /employees/profile | Get employee profile |
| PUT | /employees/profile | Update employee profile |
| GET | /employees/signups | Get employee signups |
| GET | /employees/commission | Get commission data |
| GET | /employees/invite/generate | Generate invite link |
| POST | /employees/invite/send | Send invite |
| GET | /employees/admin/all | List all employees (Admin) |
| POST | /employees/admin/{id}/approve-kyc | Approve KYC (Admin) |
| POST | /employees/admin/promote | Promote to permanent (Admin) |
| DELETE | /employees/admin/{id} | Delete employee (Admin) |

### 5.8 Subscription Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /subscriptions/plans | Get available plans |
| GET | /subscriptions/my | Get user subscriptions |
| GET | /subscriptions/device/{id} | Get device subscription |
| POST | /subscriptions/cancel/{id} | Cancel subscription |
| POST | /subscriptions/reactivate/{id} | Reactivate subscription |
| GET | /subscriptions/admin/all | List all subscriptions (Admin) |
| GET | /subscriptions/admin/stats | Get subscription stats (Admin) |

### 5.9 Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /payments/mtn/initiate | Initiate MTN payment |
| POST | /payments/mtn/confirm | Confirm MTN payment |
| POST | /payments/airtel/initiate | Initiate Airtel payment |
| POST | /payments/airtel/confirm | Confirm Airtel payment |
| POST | /payments/mtn/webhook | MTN webhook |
| POST | /payments/airtel/webhook | Airtel webhook |
| GET | /payments/history | Get transaction history |

### 5.10 Ticket Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /tickets/create | Create ticket |
| GET | /tickets/my | Get user tickets |
| GET | /tickets/{id} | Get ticket details |
| POST | /tickets/{id}/reply | Reply to ticket |
| GET | /tickets/admin/all | List all tickets (Admin) |
| PUT | /tickets/admin/{id} | Update ticket (Admin) |
| POST | /tickets/admin/{id}/assign | Assign ticket (Admin) |
| POST | /tickets/admin/{id}/close | Close ticket (Admin) |
| GET | /tickets/admin/stats | Ticket statistics (Admin) |

### 5.11 Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /chat/conversations | Get conversations |
| GET | /chat/messages/{partner_id} | Get messages |
| POST | /chat/send | Send message |
| POST | /chat/mark-read/{partner_id} | Mark messages read |
| GET | /chat/unread/count | Get unread count |
| GET | /chat/admin/chats | List all chats (Admin) |
| WebSocket | /ws/{token} | WebSocket connection |

### 5.12 IMEI Blacklist Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /imei/check | Check IMEI (Public) |
| POST | /imei/add | Add to blacklist (Admin) |
| DELETE | /imei/{id} | Remove from blacklist (Admin) |
| GET | /imei/list | List blacklist (Admin) |

### 5.13 Community Alerts Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /alerts/nearby | Get nearby alerts |
| POST | /alerts/create | Create alert |
| GET | /alerts/admin/all | List all alerts (Admin) |
| PUT | /alerts/{id}/resolve | Resolve alert (Admin) |
| DELETE | /alerts/{id} | Delete alert (Admin) |

### 5.14 Report Endpoints (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /reports/revenue | Revenue report |
| GET | /reports/devices | Device report |
| GET | /reports/users | User report |
| GET | /reports/employees | Employee report |
| GET | /reports/commissions | Commission report |
| GET | /reports/export/{type} | Export report CSV |

### 5.15 Admin Dashboard Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/dashboard/stats | Dashboard statistics |
| GET | /admin/dashboard/recent | Recent activity |
| GET | /admin/settings | System settings |
| PUT | /admin/settings | Update settings |
| POST | /admin/notify/all | Broadcast notification |
| GET | /admin/health | Health check |

### 5.16 File Upload Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /upload/kyc/id-document | Upload KYC ID |
| POST | /upload/kyc/selfie | Upload selfie |
| POST | /upload/employee/cv | Upload CV |
| POST | /upload/profile/avatar | Upload avatar |
| DELETE | /upload/{file_path} | Delete file (Admin) |

---

## 6. Security Architecture

### 6.1 Security Features Matrix

| Layer | Feature | Implementation | Status |
|-------|---------|----------------|--------|
| Device | Hardware ID | Widevine DRM | Yes |
| Device | Encrypted Storage | EncryptedSharedPreferences | Yes |
| Device | Uninstall Protection | DevicePolicyManager | Yes |
| Device | Factory Reset Survival | Device Owner flag | Yes |
| Network | TLS | TLS 1.3 | Yes |
| Network | Rate Limiting | 100 requests per minute | Yes |
| Authentication | JWT | 24 hour expiry | Yes |
| Authentication | Refresh Tokens | 30 days | Yes |
| Authentication | Password | bcrypt cost 12 | Yes |
| Data | At Rest | MongoDB encryption | Yes |
| Data | In Transit | TLS 1.3 | Yes |
| Data | Backups | AES-256 | Yes |

### 6.2 Security Policies

| Policy | Implementation |
|--------|----------------|
| Password Requirements | Minimum 8 characters, letters and numbers |
| Session Timeout | 24 hours for JWT |
| Login Attempts | 5 failed attempts = 15 minute lockout |
| API Rate Limiting | 100 requests per minute per IP |
| Data Retention | Location data: 30 days |
| Data Deletion | Complete erasure within 30 days |

---

## 7. Deployment Architecture

### 7.1 Infrastructure Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| Backend Hosting | Google Cloud Run | API server |
| Database | MongoDB Atlas | Data store |
| Cache | Redis Cloud | Session management |
| File Storage | Cloud Storage | Uploads |
| CDN | CloudFlare | APK distribution |
| Monitoring | Prometheus + Grafana | Metrics |
| Logging | ELK Stack | Logs |
| Error Tracking | Sentry | Crash reporting |

### 7.2 Update Flow

| Step | Action |
|------|--------|
| 1 | Build new APK |
| 2 | Upload to CDN with version.json |
| 3 | App polls version endpoint |
| 4 | Show update dialog |
| 5 | Download APK |
| 6 | Install |
| 7 | Restart |

### 7.3 Version Check API

| Method | Endpoint | Response Fields |
|--------|----------|-----------------|
| GET | /api/version/current | version, versionCode, downloadUrl, size, minApiLevel, changelog, forceUpdate |

---

## 8. All Features Matrix

| # | Module | Feature | Status |
|---|--------|---------|--------|
| 1 | Location | GPS tracking (30 sec) | Yes |
| 2 | Location | Location history (30 days) | Yes |
| 3 | Location | Offline queue | Yes |
| 4 | Location | Movement detection | Yes |
| 5 | Commands | Remote lock | Yes |
| 6 | Commands | Remote alarm | Yes |
| 7 | Commands | Enable mobile data | Yes |
| 8 | Commands | Enable WiFi | Yes |
| 9 | Commands | Start/stop tracking | Yes |
| 10 | Commands | Command queue | Yes |
| 11 | SMS | #SG location | Yes |
| 12 | SMS | #SG lock | Yes |
| 13 | SMS | #SG alarm | Yes |
| 14 | SMS | #SG data_on | Yes |
| 15 | SMS | #SG recovery | Yes |
| 16 | SMS | Abort broadcast | Yes |
| 17 | Factory Reset | Detect reset attempt | Yes |
| 18 | Factory Reset | Send last location | Yes |
| 19 | Factory Reset | Notify owner | Yes |
| 20 | Survival | Device owner mode | Yes |
| 21 | Survival | Prevent uninstall | Yes |
| 22 | Survival | Auto-reinstall after reset | Yes |
| 23 | Survival | Auto-start on boot | Yes |
| 24 | Beacons | iBeacon detection | Yes |
| 25 | Beacons | Eddystone detection | Yes |
| 26 | Beacons | Proximity alerts | Yes |
| 27 | Beacons | Distance calculation | Yes |
| 28 | Auth | Auto-auth service | Yes |
| 29 | Auth | Token refresh | Yes |
| 30 | Auth | Hardware ID binding | Yes |
| 31 | Employees | Registration with KYC | Yes |
| 32 | Employees | Invite links | Yes |
| 33 | Employees | Commission (30% contractor) | Yes |
| 34 | Employees | Commission (10% permanent) | Yes |
| 35 | Employees | Career progression | Yes |
| 36 | Payments | MTN Mobile Money | Yes |
| 37 | Payments | Airtel Money | Yes |
| 38 | Payments | Transaction history | Yes |
| 39 | Admin | User management | Yes |
| 40 | Admin | Device management | Yes |
| 41 | Admin | Employee management | Yes |
| 42 | Admin | Revenue reports | Yes |
| 43 | Admin | Commission reports | Yes |
| 44 | Admin | IMEI blacklist | Yes |
| 45 | Admin | Community alerts | Yes |
| 46 | Admin | Backup and restore | Yes |
| 47 | Admin | Audit logs | Yes |
| 48 | Chat | Real-time chat | Yes |
| 49 | Chat | WebSocket | Yes |
| 50 | Chat | File attachments | Yes |

---

## 9. Monitoring and Alerting

### 9.1 Metrics to Monitor

| Metric | Threshold | Action |
|--------|-----------|--------|
| API Response Time | > 500ms | Email |
| API Error Rate | > 5% | Email + SMS |
| Database Connections | > 80% | Email |
| CPU Usage | > 80% for 5 min | Auto-scaling |
| Memory Usage | > 85% | Email |
| Disk Space | < 20% free | Email |
| SMS Delivery Rate | < 90% | Email |
| Payment Success Rate | < 95% | Email + SMS |

### 9.2 Alert Rules

| Alert Name | Condition | Severity |
|------------|-----------|----------|
| HighErrorRate | Error rate > 5% for 5 min | critical |
| HighLatency | Latency > 1 second for 5 min | warning |
| DatabaseDown | MongoDB not responding | critical |
| RedisDown | Redis not responding | warning |
| HighCPUUsage | CPU > 80% for 5 min | warning |
| HighMemoryUsage | Memory > 85% for 5 min | warning |

---

## 10. Cost Analysis

### 10.1 Monthly Infrastructure Costs

| Service | Cost (USD) |
|---------|------------|
| Backend Hosting (Cloud Run) | $80 - $150 |
| MongoDB Atlas M10 | $150 - $200 |
| Redis Cache 5GB | $35 - $50 |
| Cloud Storage 100GB | $5 - $10 |
| CDN (CloudFlare) | $20 - $30 |
| Load Balancer | $18 - $25 |
| **Subtotal** | **$308 - $465** |

### 10.2 External Services Costs

| Service | Estimated Monthly |
|---------|-------------------|
| Twilio SMS | $50 - $200 |
| MTN Mobile Money Fees | 0.5% of revenue |
| Airtel Money Fees | 0.5% of revenue |
| Sentry | $26 |
| **Subtotal** | **$76 - $226** |

### 10.3 Cost by Scale

| Users | Monthly Cost (USD) |
|-------|-------------------|
| < 100 | $50 - $100 |
| 1,000 | $200 - $350 |
| 10,000 | $500 - $700 |
| 50,000 | $800 - $1,200 |
| 100,000+ | $1,500 - $2,500 |

### 10.4 Revenue Model

| Plan | Price (UGX) | Price (USD) |
|------|-------------|-------------|
| Basic | 18,500 | $5.00 |
| Premium | 37,000 | $10.00 |
| Corporate | Negotiated | $8.00 |

---

## 11. Scalability Plan

### 11.1 Scaling Triggers

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU Usage | > 70% for 5 min | Add instance |
| Memory Usage | > 80% for 5 min | Add instance |
| Request Latency | > 500ms for 5 min | Add instance |
| Database Connections | > 80% | Add read replica |

### 11.2 Database Scaling

| Users | Configuration | Cost (USD) |
|-------|---------------|------------|
| 0 - 1,000 | M10 | $150 |
| 1,000 - 10,000 | M20 | $300 |
| 10,000 - 50,000 | M30 | $600 |
| 50,000 - 100,000 | M40 + replica | $1,200 |
| 100,000 - 500,000 | M50 + 2 replicas | $2,400 |

### 11.3 Auto-Scaling Configuration

| Parameter | Value |
|-----------|-------|
| minReplicas | 2 |
| maxReplicas | 20 |
| cpu_utilization_target | 70 |
| memory_utilization_target | 80 |

### 11.4 Database Connection Pool

| Users | Max Connections | Pool Size |
|-------|----------------|-----------|
| < 1,000 | 100 | 20 |
| 1,000 - 10,000 | 500 | 50 |
| 10,000 - 50,000 | 1,000 | 100 |
| 50,000 - 100,000 | 2,000 | 200 |
| 100,000 - 500,000 | 5,000 | 500 |

---

## 12. Backup and Disaster Recovery

### 12.1 Backup Schedule

| Data | Frequency | Retention |
|------|-----------|-----------|
| MongoDB Database | Daily | 30 days |
| MongoDB Database | Weekly | 90 days |
| User Uploads | Continuous | 90 days |
| Application Logs | Daily | 30 days |
| Configuration | Per commit | Forever |

### 12.2 Recovery Objectives

| Objective | Target |
|-----------|--------|
| Recovery Time Objective (RTO) | 4 hours |
| Recovery Point Objective (RPO) | 1 hour |
| Backup Verification | Weekly |
| Disaster Recovery Drill | Quarterly |

### 12.3 Disaster Recovery Steps

| Step | Action | Time |
|------|--------|------|
| 1 | Detection | 1 minute |
| 2 | Assessment | 15 minutes |
| 3 | Failover | 15 minutes |
| 4 | Restoration | 2 hours |
| 5 | Verification | 30 minutes |
| 6 | Resume | --- |

### 12.4 Data Retention

| Data Category | Retention |
|---------------|-----------|
| Location History | 30 days |
| User Accounts | Until deletion |
| Deleted Accounts | 30 days |
| KYC Documents | 7 years |
| Transaction Records | 7 years |
| Audit Logs | 90 days |
| SMS Logs | 90 days |
| Support Tickets | 1 year |
| Chat Messages | 1 year |

---

## 13. Compliance and Legal

### 13.1 Compliance Status

| Regulation | Requirement | Status |
|------------|-------------|--------|
| GDPR | Right to deletion | Yes |
| GDPR | Data portability | Yes |
| GDPR | Breach notification | Yes |
| Uganda Data Protection | Local storage | Yes |
| Uganda Data Protection | Registration with NITA | Required |
| PCI DSS | Payment security | Yes (MTN/Airtel) |

### 13.2 Data Processing Agreement

| Party | Role | Data |
|-------|------|------|
| Silent Guardian | Controller | All user data |
| MTN Uganda | Processor | Phone, payment |
| Airtel Uganda | Processor | Phone, payment |
| Twilio | Processor | Phone, SMS |
| Google Firebase | Processor | Device tokens |

---

## 14. Glossary

| Term | Definition |
|------|------------|
| AOSP | Android Open Source Project |
| APK | Android Package Kit |
| API | Application Programming Interface |
| BLE | Bluetooth Low Energy |
| CDN | Content Delivery Network |
| Custom ROM | Modified Android version |
| Device Admin | Device policy control permission |
| Device Owner | App with elevated privileges |
| DNS | Domain Name System |
| Factory Reset | Wipe all user data |
| FCM | Firebase Cloud Messaging |
| FRP | Factory Reset Protection |
| GDPR | General Data Protection Regulation |
| GPS | Global Positioning System |
| Hardware ID | Unique device identifier |
| IMEI | International Mobile Equipment Identity |
| JWT | JSON Web Token |
| KYC | Know Your Customer |
| MDM | Mobile Device Management |
| MongoDB | NoSQL database |
| OTA | Over The Air |
| PCI DSS | Payment Card Industry standard |
| RPO | Recovery Point Objective |
| RTO | Recovery Time Objective |
| SMS | Short Message Service |
| TLS | Transport Layer Security |
| TTL | Time To Live |
| UGX | Ugandan Shilling |
| WebSocket | Real-time communication protocol |
| Widevine | DRM system |

---

## 15. Appendices

### 15.1 Environment Variables

```bash
APP_NAME=Silent Guardian API
DEBUG=False
PORT=8000
ALLOWED_ORIGINS=https://silentguardian.com,https://admin.silentguardian.com
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/silentguardian
DATABASE_NAME=silentguardian
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-super-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
REFRESH_TOKEN_EXPIRE_DAYS=30
ADMIN_EMAIL=admin@silentguardian.com
ADMIN_PASSWORD=secure_password
FRONTEND_URL=https://silentguardian.com
ADMIN_URL=https://admin.silentguardian.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@silentguardian.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=support@silentguardian.com
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
MTN_API_URL=https://sandbox.mtn.co.ug/momo
MTN_SUBSCRIPTION_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MTN_API_USER=your_api_user
MTN_API_KEY=your_api_key
AIRTEL_API_URL=https://openapi.airtel.ug/merchant
AIRTEL_CLIENT_ID=your_client_id
AIRTEL_CLIENT_SECRET=your_client_secret
FIREBASE_CREDENTIALS=./firebase-credentials.json
FCM_API_KEY=your_fcm_api_key
SENTRY_DSN=https://xxxxxxxx@sentry.io/xxxxx
PROMETHEUS_ENABLED=True


5.2 Docker Compose
yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=mongodb://mongodb:27017
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  mongodb_data:
16. Revision History
Version	Date	Author	Changes
1.0	2024-01-01	System Architect	Initial document
1.1	2024-02-01	System Architect	Added cost analysis
1.2	2024-03-01	System Architect	Added DR procedures
1.3	2024-04-01	System Architect	Added compliance
17. Document Approval
Role	Name	Signature	Date
Product Manager	_____________	_____________	_____
Technical Lead	_____________	_____________	_____
Security Officer	_____________	_____________	_____
Legal Counsel	_____________	_____________	_____
Business Owner	_____________	_____________	_____
END OF DOCUMENT
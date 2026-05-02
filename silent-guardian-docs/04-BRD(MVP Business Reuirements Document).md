# Business Requirements Document - Silent Guardian Tracking System

## Version: 1.0-MVP (Minimum Viable Product)

---

## Document Information

| Property | Value |
|----------|-------|
| Project Name | Silent Guardian MVP |
| Document Type | Business Requirements Document (BRD) |
| Version | 1.0-MVP |
| Date | 2024 |
| Status | Approved |
| Author | Product Management Team |
| Distribution | Direct APK + Custom ROM (NOT Google Play Store) |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Stakeholders](#2-stakeholders)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Technical Architecture Requirements](#5-technical-architecture-requirements)
6. [Integration Requirements](#6-integration-requirements)
7. [Data Requirements](#7-data-requirements)
8. [Reporting Requirements](#8-reporting-requirements)
9. [Compliance Requirements](#9-compliance-requirements)
10. [Assumptions and Constraints](#10-assumptions-and-constraints)
11. [Success Metrics](#11-success-metrics)
12. [MVP to Production Migration Path](#12-mvp-to-production-migration-path)
13. [Glossary](#13-glossary)
14. [Approval Signatures](#14-approval-signatures)

---

## 1. Executive Summary

### 1.1 Project Overview

Silent Guardian MVP is a cost-reduced version of the enterprise anti-theft tracking system designed to validate the core value proposition with minimal investment. **Custom ROM integration is COMPULSORY for MVP** as it provides the unique value proposition of surviving factory reset.

**MVP Distribution:** Direct APK + Custom ROM (NOT on Google Play Store)

**Key MVP Features:**
- Real-time GPS tracking (5 minute intervals - reduced from 30 seconds)
- Location history (7 days - reduced from 30 days)
- Remote device control (lock, alarm, enable data, enable WiFi)
- SMS command system (only #SG location command)
- Factory reset detection and alerts
- App survival after factory reset (via Custom ROM - COMPULSORY)
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

### 1.3 MVP Business Objectives

| Objective | Metric | Target |
|-----------|--------|--------|
| User Validation | Registered users | 100 in first month |
| Device Protection | Active devices tracked | 50 |
| Revenue Validation | Paying subscribers | 20 users |
| Employee Validation | Active sales agents | 10 agents |
| Custom ROM Validation | Devices with Custom ROM | 100% of MVP devices |
| Customer Feedback | Support tickets | Less than 10 per week |

### 1.4 MVP vs Full Production Comparison

| Feature | Full Production | MVP | Reason for Deferral |
|---------|-----------------|-----|---------------------|
| Custom ROM | Optional | **COMPULSORY** | Core value proposition |
| GPS interval | 30 seconds | 5 minutes | Reduce server load |
| Location history | 30 days | 7 days | Save storage costs |
| SMS commands | 7 commands | 1 command (location) | Twilio free trial limit |
| BLE beacons | Yes | No | Save battery, complex |
| Live chat | Yes | No | Use email support |
| Redis cache | Yes | No | In-memory cache |
| Celery queue | Yes | No | Synchronous processing |
| Crypto payments | Yes | No | MTN and Airtel only |
| Card payments | Yes | No | Mobile money only |
| IMEI blacklist API | Yes | No | Manual spreadsheet |
| Community alerts | Yes | No | Add in version 2 |
| Career progression | Yes | No | Manual tracking |
| Charts and graphs | Yes | No | Simple tables |
| KYC document upload | Yes | No | Trust users initially |
| Audit logs | Yes | No | Add in version 2 |
| Backup and restore | Yes | No | Manual backup |

---

## 2. Stakeholders

### 2.1 Stakeholder List

| Stakeholder | Role | MVP Responsibilities |
|-------------|------|----------------------|
| Beta Users | Early adopters | Test core tracking features |
| Sales Agents | Pilot employees | Test invite and commission system |
| System Administrators | Admin team | Manual user approval, basic support |
| Custom ROM Builders | Technical team | Build and flash Custom ROMs |

### 2.2 MVP User Personas

#### Persona 1: MVP Beta User "Test User"

| Attribute | Description |
|-----------|-------------|
| Age | 25 to 40 |
| Technical Level | Medium to High |
| Devices | Android phone with unlockable bootloader |
| Motivation | Wants to test anti-theft that survives factory reset |
| Expectations | App works, tracks location, survives reset |
| Feedback Method | Email support |

#### Persona 2: MVP Sales Agent "Pilot Agent"

| Attribute | Description |
|-----------|-------------|
| Age | 30 to 45 |
| Role | Test commission system |
| Devices | Android phone |
| Motivation | Test invite links and commission tracking |
| Expectations | Invite system works, commission calculated correctly |

---

## 3. Functional Requirements

### 3.1 Active MVP Features Only

The following features are **ACTIVE** in MVP. All other features are deferred to later versions.

### 3.2 User Management Module (MVP - Reduced)

| ID | Requirement | Priority | MVP Acceptance Criteria |
|----|-------------|----------|-------------------------|
| UM-01 | User Registration | High | User can create account with email and password |
| UM-02 | User Login | High | User can login with email and password |
| UM-03 | Password Reset | High | Manual reset via admin (no email automation) |
| UM-04 | Profile Management | Medium | User can edit name and phone only |
| UM-05 | Account Deletion | High | Admin deletes manually from database |
| UM-06 | KYC Submission | Low | **DEFERRED** - No document upload in MVP |
| UM-07 | KYC Approval Flow | Low | **DEFERRED** - Trust users initially |
| UM-08 | Two-Factor Authentication | Low | **DEFERRED** - Add after 500 users |

### 3.3 Device Management Module (MVP)

| ID | Requirement | Priority | MVP Acceptance Criteria |
|----|-------------|----------|-------------------------|
| DM-01 | Device Registration | High | User can register device using hardware ID |
| DM-02 | Device Listing | High | User can view all registered devices |
| DM-03 | Device Details | High | User can view device status, battery, last seen |
| DM-04 | Device Status Update | High | System updates device online status (5 min interval) |
| DM-05 | Device Deletion | High | User can remove device from account |
| DM-06 | Mark as Stolen | High | User can mark device stolen to activate tracking |
| DM-07 | Device Rename | Medium | User can change device name |
| DM-08 | Track After Reset | High | **COMPULSORY** - App survives factory reset (Custom ROM) |

### 3.4 Location Tracking Module (MVP - Reduced)

| ID | Requirement | Priority | MVP Acceptance Criteria |
|----|-------------|----------|-------------------------|
| LT-01 | GPS Location Capture | High | App captures location every **5 minutes** (reduced) |
| LT-02 | Location Storage | High | Locations stored for **7 days** (reduced) |
| LT-03 | Location History View | High | User can view historical locations as **text list** (no map) |
| LT-04 | Live Location Stream | Low | **DEFERRED** - Use polling instead of WebSocket |
| LT-05 | Geofencing Alerts | Low | **DEFERRED** - Add in version 2 |
| LT-06 | Location Accuracy | High | Accuracy within 10 meters in optimal conditions |
| LT-07 | Offline Location Queue | Medium | Stores up to 100 locations offline |
| LT-08 | Movement Detection | Low | **DEFERRED** - Basic speed calculation only |

### 3.5 Remote Commands Module (MVP - Full)

| ID | Requirement | Priority | MVP Acceptance Criteria |
|----|-------------|----------|-------------------------|
| RC-01 | Enable Mobile Data | High | **ACTIVE** |
| RC-02 | Enable WiFi | High | **ACTIVE** |
| RC-03 | Get Location Once | High | **ACTIVE** |
| RC-04 | Start Live Tracking | Medium | **ACTIVE** (polling mode) |
| RC-05 | Stop Live Tracking | Medium | **ACTIVE** |
| RC-06 | Lock Device | High | **ACTIVE** |
| RC-07 | Trigger Alarm | High | **ACTIVE** |
| RC-08 | Factory Reset | Low | **DEFERRED** - Complex, add later |
| RC-09 | Command Queue | High | Simple queue in memory (no Redis) |
| RC-10 | Command History | Medium | Store in MongoDB |

### 3.6 SMS Command Module (MVP - Limited to Location Only)

| ID | Requirement | Priority | MVP Acceptance Criteria |
|----|-------------|----------|-------------------------|
| SC-01 | SMS Command Detection | High | **ACTIVE** |
| SC-02 | Location via SMS | High | **ACTIVE** - Only command in MVP |
| SC-03 | Lock via SMS | Medium | **DEFERRED** - Twilio free trial limit |
| SC-04 | Alarm via SMS | Medium | **DEFERRED** - Twilio free trial limit |
| SC-05 | Enable Data via SMS | Medium | **DEFERRED** - Twilio free trial limit |
| SC-06 | Enable WiFi via SMS | Medium | **DEFERRED** - Twilio free trial limit |
| SC-07 | Recovery Mode | High | **DEFERRED** - Add in version 2 |
| SC-08 | SMS Response | High | **ACTIVE** |
| SC-09 | Abort Broadcast | High | **ACTIVE** |
| SC-10 | Command Whitelist | Low | **DEFERRED** |

### 3.7 Factory Reset Protection Module (MVP - Full)

| ID | Requirement | Priority | MVP Acceptance Criteria |
|----|-------------|----------|-------------------------|
| FR-01 | Factory Reset Detection | High | **ACTIVE** |
| FR-02 | Last Location Capture | High | **ACTIVE** |
| FR-03 | Alert Notification | High | **ACTIVE** - Email only (SMS deferred) |
| FR-04 | Reset Attempt Logging | High | **ACTIVE** |
| FR-05 | App Survival | High | **COMPULSORY** - Requires Custom ROM |
| FR-06 | Auto-Reinstall | High | **COMPULSORY** - Requires Custom ROM |
| FR-07 | Uninstall Prevention | High | **COMPULSORY** - Requires Custom ROM |
| FR-08 | Auto-Start on Boot | High | **COMPULSORY** - Requires Custom ROM |

### 3.8 Beacon Detection Module (MVP - DISABLED)

| ID | Requirement | Priority | MVP Status |
|----|-------------|----------|------------|
| BD-01 to BD-07 | All beacon features | Medium | **COMPLETELY DISABLED** - Add in version 2 |

### 3.9 Employee Management Module (MVP - Reduced)

| ID | Requirement | Priority | MVP Acceptance Criteria |
|----|-------------|----------|-------------------------|
| EM-01 | Employee Registration | High | **ACTIVE** (no document upload) |
| EM-02 | Employee Invite Link | High | **ACTIVE** |
| EM-03 | Send Invite | High | Manual sharing (no automated SMS or email) |
| EM-04 | Track Signups | High | **ACTIVE** (simple counter) |
| EM-05 | Commission Calculation | High | **ACTIVE** (30% of $9.99 premium plan only) |
| EM-06 | Commission Dashboard | High | **ACTIVE** (simple numbers, no charts) |
| EM-07 | Payout Request | Medium | **ACTIVE** (manual via admin) |
| EM-08 | Permanent Conversion | Low | **DEFERRED** - Track manually in spreadsheet |
| EM-09 | Career Progression | Low | **DEFERRED** - No progress bar in MVP |
| EM-10 | Admin Commission Approval | High | **ACTIVE** (basic approval) |

### 3.10 Subscription and Payment Module (MVP - Mobile Money Only)

| ID | Requirement | Priority | MVP Acceptance Criteria |
|----|-------------|----------|-------------------------|
| SP-01 | Plan Display | High | **ACTIVE** (Basic $4.99, Premium $9.99) |
| SP-02 | MTN Mobile Money | High | **ACTIVE** |
| SP-03 | Airtel Money | High | **ACTIVE** |
| SP-04 | Transaction History | High | **ACTIVE** (simple list) |
| SP-05 | Subscription Activation | High | **ACTIVE** |
| SP-06 | Auto-Renewal | High | **ACTIVE** |
| SP-07 | Cancellation | High | **ACTIVE** |
| SP-08 | Payment Receipts | Low | **DEFERRED** |

### 3.11 Admin Dashboard Module (MVP - Simplified)

| ID | Requirement | Priority | MVP Acceptance Criteria |
|----|-------------|----------|-------------------------|
| AD-01 | Dashboard Overview | High | Simple numbers, no charts |
| AD-02 | User Management | High | Basic table, no advanced filters |
| AD-03 | Device Management | High | Basic table, no map view |
| AD-04 | Employee Management | High | Basic table, no progress tracking |
| AD-05 | KYC Review | Low | **DEFERRED** - No KYC in MVP |
| AD-06 | Revenue Reports | Medium | Simple numbers, no graphs |
| AD-07 | Commission Reports | Medium | Simple numbers, no graphs |
| AD-08 | Support Tickets | High | Basic email ticketing (no chat) |
| AD-09 | IMEI Blacklist | Low | **DEFERRED** - Manual spreadsheet |
| AD-10 | Community Alerts | Low | **DEFERRED** - Remove entirely |
| AD-11 | System Settings | Medium | Basic settings only |
| AD-12 | Backup and Restore | Low | **DEFERRED** - Manual database dumps |
| AD-13 | Audit Logs | Low | **DEFERRED** |
| AD-14 | Factory Reset Alerts | High | **ACTIVE** - View reset attempts |

### 3.12 Support Ticket Module (MVP - Email Based)

| ID | Requirement | Priority | MVP Acceptance Criteria |
|----|-------------|----------|-------------------------|
| ST-01 | Create Ticket | High | Email to support@ (no in-app form) |
| ST-02 | Ticket Priority | Medium | User sets priority in email subject |
| ST-03 | Ticket Status | Medium | Admin updates manually |
| ST-04 | Reply to Ticket | High | Admin replies via email |
| ST-05 | Admin Assignment | Low | **DEFERRED** - One admin handles all |
| ST-06 | Ticket History | Medium | Search email history |
| ST-07 | Email Notifications | High | Manual email responses |

### 3.13 Chat Module (MVP - DISABLED)

| ID | Requirement | Priority | MVP Status |
|----|-------------|----------|------------|
| CH-01 to CH-07 | All chat features | Medium | **COMPLETELY DISABLED** - Use email support |

### 3.14 IMEI Blacklist Module (MVP - DISABLED)

| ID | Requirement | Priority | MVP Status |
|----|-------------|----------|------------|
| IB-01 to IB-05 | All IMEI features | High | **COMPLETELY DISABLED** - Manual spreadsheet alternative |

### 3.15 Community Alerts Module (MVP - DISABLED)

| ID | Requirement | Priority | MVP Status |
|----|-------------|----------|------------|
| CA-01 to CA-06 | All alert features | Medium | **COMPLETELY DISABLED** - Add in version 2 |

---

## 4. Non-Functional Requirements

### 4.1 Performance Requirements (Relaxed for MVP)

| ID | Requirement | MVP Target | Full Target | Reason for Relaxation |
|----|-------------|------------|-------------|----------------------|
| NFR-01 | API Response Time | Less than 1 second | Less than 500ms | No Redis cache |
| NFR-02 | App Startup Time | Less than 5 seconds | Less than 3 seconds | Less optimization |
| NFR-03 | Location Update Latency | Less than 30 seconds | Less than 10 seconds | 5-minute interval |
| NFR-04 | SMS Command Response | Less than 30 seconds | Less than 10 seconds | Twilio free tier |
| NFR-05 | Concurrent Users | 100 | 10,000 | MVP scale |
| NFR-06 | Database Query Time | Less than 500ms | Less than 100ms | No index optimization |

### 4.2 Security Requirements (MVP - Basic)

| ID | Requirement | MVP Implementation | Full Implementation |
|----|-------------|-------------------|---------------------|
| NFR-07 | Data Encryption | TLS 1.3 | TLS 1.3 + Certificate Pinning |
| NFR-08 | Password Security | bcrypt (cost 10) | bcrypt (cost 12) |
| NFR-09 | Session Management | JWT in memory | JWT + Redis |
| NFR-10 | Rate Limiting | Basic (manual) | Automated (100 per minute) |
| NFR-11 | Hardware ID | Widevine DRM | Widevine DRM |
| NFR-12 | GDPR Compliance | Manual deletion | Automated deletion |

### 4.3 Availability Requirements (MVP - Reduced)

| ID | Requirement | MVP Target | Full Target | Reason |
|----|-------------|------------|-------------|--------|
| NFR-13 | System Uptime | 99% | 99.9% | Single deployment |
| NFR-14 | Backup Frequency | Weekly manual | Daily automated | Lower priority |
| NFR-15 | Disaster Recovery | 24 hours | 4 hours | Manual recovery |

### 4.4 Mobile App Requirements (MVP - Optimized)

| ID | Requirement | MVP Target | Full Target | Reason |
|----|-------------|------------|-------------|--------|
| NFR-16 | Battery Usage | Less than 10% per day | Less than 5% per day | 5-minute interval |
| NFR-17 | Data Usage | Less than 20MB per month | Less than 50MB per month | Less frequent updates |
| NFR-18 | Offline Support | 100 locations | 1,000 locations | Simpler queue |
| NFR-19 | Background Operation | Basic | Full | No beacon scanning |
| NFR-20 | Factory Reset Survival | Yes (Custom ROM) | Yes (Custom ROM) | **COMPULSORY** |

---

## 5. Technical Architecture Requirements

### 5.1 Technology Stack (MVP)

| Layer | Technology | MVP Justification |
|-------|------------|-------------------|
| Android | Kotlin | Same as full version |
| Custom ROM | AOSP Android 14 | **COMPULSORY** for MVP |
| Backend | Python FastAPI | Same as full version |
| Database | MongoDB Atlas M0 | Free tier, 512MB limit |
| Cache | In-memory dictionary | Redis removed for cost |
| Hosting | Railway or Render | $5 per month |
| Web | React | Same as full version |

### 5.2 Custom ROM Requirements (MVP - COMPULSORY)

| Requirement | Specification | MVP Status |
|-------------|---------------|------------|
| AOSP Version | Android 14 (API 34) | **COMPULSORY** |
| App Location | /system/priv-app | **COMPULSORY** |
| App Signature | Platform certificate | **COMPULSORY** |
| Persistent Flag | android:persistent="true" | **COMPULSORY** |
| Shared User ID | android:sharedUserId="android.uid.system" | **COMPULSORY** |
| Build Once | Single build, flash to unlimited devices | **COMPULSORY** |

### 5.3 API Requirements (MVP - Reduced)

| Requirement | MVP Specification |
|-------------|-------------------|
| RESTful | Follow REST conventions |
| Versioning | URL versioning (/api/v1/) |
| Authentication | Bearer JWT tokens |
| Documentation | Basic README (no Swagger) |
| Rate Limiting | None (manual monitoring) |

### 5.4 Database Requirements (MVP - Simplified)

| Requirement | MVP Specification |
|-------------|-------------------|
| Indexes | hardwareId, email only |
| TTL Indexes | Locations expire after 7 days |
| Geospatial | None (no map view) |
| Replication | Single node (M0 free tier) |

---

## 6. Integration Requirements

### 6.1 External Service Integrations (MVP Only)

| Service | Purpose | MVP Status |
|---------|---------|------------|
| Firebase FCM | Push notifications | **ACTIVE** |
| Twilio (free trial) | SMS sending (10 SMS/day limit) | **ACTIVE** |
| MTN API | Mobile money payments | **ACTIVE** |
| Airtel API | Mobile money payments | **ACTIVE** |

### 6.2 Webhook Requirements (MVP)

| Webhook | Purpose | MVP Status |
|---------|---------|------------|
| MTN Webhook | Payment confirmation | **ACTIVE** |
| Airtel Webhook | Payment confirmation | **ACTIVE** |

---

## 7. Data Requirements

### 7.1 Data Retention Policy (MVP)

| Data Type | Retention Period | MVP Approach |
|-----------|-----------------|--------------|
| User Accounts | Until deletion | Manual deletion |
| Location History | 7 days | Automatic TTL deletion |
| Command History | 30 days | Not archived |
| Transaction Records | 1 year | Manual archive |
| Factory Reset Alerts | 90 days | Keep for analysis |

### 7.2 Data Volume Estimates (MVP)

| Entity | Monthly Growth (MVP) | 3 Month Total |
|--------|----------------------|---------------|
| Users | 30 | 100 |
| Devices | 15 | 50 |
| Locations | 5,000 | 15,000 |
| Commands | 500 | 1,500 |
| Transactions | 50 | 150 |

---

## 8. Reporting Requirements

### 8.1 MVP Reports (Basic)

| Report | Frequency | Audience | Format |
|--------|-----------|----------|--------|
| User Count | Weekly | Admin | Manual query |
| Device Count | Weekly | Admin | Manual query |
| Revenue Total | Weekly | Admin | Manual calculation |
| Commission Total | Weekly | Admin | Manual calculation |

---

## 9. Compliance Requirements

| Requirement | Standard | MVP Implementation |
|-------------|----------|-------------------|
| Data Protection | GDPR | Manual deletion on request |
| Payment Security | PCI DSS | MTN and Airtel handle payments |
| User Consent | Local laws | Basic consent checkbox |
| Privacy Policy | Required | Basic policy page |

---

## 10. Assumptions and Constraints

### 10.1 MVP Assumptions

| ID | Assumption |
|----|------------|
| A-01 | Beta users have technical knowledge for Custom ROM |
| A-02 | Beta users accept 5-minute location interval |
| A-03 | Manual support is sufficient for MVP |
| A-04 | Twilio free trial (10 SMS/day) is enough |
| A-05 | MongoDB M0 free tier (512MB) is sufficient |
| A-06 | Users will provide feedback via email |

### 10.2 MVP Constraints

| ID | Constraint |
|----|------------|
| C-01 | Custom ROM requires bootloader unlock |
| C-02 | SMS limited to 10 per day (Twilio free trial) |
| C-03 | Location history limited to 7 days |
| C-04 | No map view (text coordinates only) |
| C-05 | No automated backups |
| C-06 | No automated reports |
| C-07 | Manual commission payouts |

---

## 11. Success Metrics

### 11.1 MVP Success Criteria

| Metric | MVP Target | How to Measure |
|--------|------------|----------------|
| User signups | 100 | Database count |
| Device registrations | 50 | Database count |
| Paying subscribers | 20 | Transaction records |
| MTN payment success | Greater than 90% | Transaction logs |
| Airtel payment success | Greater than 90% | Transaction logs |
| Employee agents | 10 | Database count |
| Monthly revenue | $200 | Transaction sum |
| Support emails | Less than 10 per week | Email count |
| App crash rate | Less than 2% | Crashlytics |
| Factory reset detection | 100% of attempts | Alert logs |

### 11.2 MVP Validation Checklist

| Validation Item | Success Criteria |
|-----------------|------------------|
| Core tracking works | User sees location updates |
| Factory reset survival | App works after reset (Custom ROM) |
| SMS command works | "#SG location" returns coordinates |
| Payment works | MTN and Airtel payments succeed |
| Commission works | Employee sees commission added |
| Admin works | Admin can view users and devices |

---

## 12. MVP to Production Migration Path

### 12.1 Phase 2 Triggers (Add at 100 Users)

| Feature | Enable When | Estimated Cost |
|---------|-------------|----------------|
| Email Service | 50 users | $10 per month |
| Location Map View | 100 users | $20 per month (Maps API) |
| Basic Charts | 100 users | $0 (remove conditional) |
| Location History | 30 days (from 7) | Storage cost increase |

### 12.2 Phase 3 Triggers (Add at 500 Users)

| Feature | Enable When | Estimated Cost |
|---------|-------------|----------------|
| SMS Commands (all) | 200 users | $50 per month |
| Live Chat (WebSocket) | 500 users | $20 per month |
| Redis Cache | 500 users | $42 per month |
| Push Notifications | 500 users | $25 per month |

### 12.3 Phase 4 Triggers (Add at 1,000+ Users)

| Feature | Enable When | Estimated Cost |
|---------|-------------|----------------|
| IMEI Blacklist API | 1,000 users | $30 per month |
| Community Alerts | 1,000 users | $20 per month |
| Full Production Stack | 5,000 users | $700+ per month |

### 12.4 MVP Cost Summary

| Component | Monthly Cost |
|-----------|--------------|
| Backend Hosting (Railway/Render) | $5 |
| MongoDB M0 | $0 |
| Twilio Free Trial | $0 |
| Firebase FCM | $0 |
| MTN and Airtel Fees | 0.5% of revenue |
| **Total** | **$5 to $15 + fees** |

---

## 13. Glossary

| Term | Definition |
|------|------------|
| **AOSP** | Android Open Source Project |
| **APK** | Android Package Kit |
| **Custom ROM** | Modified Android version installed on devices |
| **Factory Reset** | Process of wiping all user data from a device |
| **Hardware ID** | Unique device identifier using Widevine |
| **IMEI** | International Mobile Equipment Identity |
| **JWT** | JSON Web Token |
| **KYC** | Know Your Customer |
| **MVP** | Minimum Viable Product |
| **RPO** | Recovery Point Objective |
| **RTO** | Recovery Time Objective |
| **SMS** | Short Message Service |
| **System App** | App installed in /system partition that survives factory reset |
| **UGX** | Ugandan Shilling |
| **TTL** | Time To Live |

---

## 14. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | _____________ | _____________ | _____ |
| Technical Lead | _____________ | _____________ | _____ |
| Business Owner | _____________ | _____________ | _____ |

---

**END OF DOCUMENT**
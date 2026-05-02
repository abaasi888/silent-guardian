# Business Requirements Document - Silent Guardian Tracking System

## Version: 1.0 (Full Production)

---

## Document Information

| Property | Value |
|----------|-------|
| Project Name | Silent Guardian Tracking System |
| Document Type | Business Requirements Document (BRD) |
| Version | 1.0 |
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
12. [Glossary](#12-glossary)
13. [Approval Signatures](#13-approval-signatures)

---

## 1. Executive Summary

### 1.1 Project Overview

Silent Guardian is a comprehensive enterprise-grade anti-theft tracking system distributed as a direct APK (NOT on Google Play Store). The system enables users to track their mobile devices, receive real-time location updates, and remotely control devices when lost or stolen. The system also includes an employee management module for sales agents who earn commissions by referring new users.

**Key Differentiator:** The app is designed to be embedded as a system app in custom Android ROMs, allowing it to survive factory reset and continue tracking even after theft.

### 1.2 Business Objectives

| Objective | Metric | Target |
|-----------|--------|--------|
| User Acquisition | Registered users | 100,000 in Year 1 |
| Device Protection | Active devices tracked | 50,000 |
| Revenue Generation | Monthly recurring revenue | $500,000 |
| Employee Growth | Active sales agents | 5,000 |
| Customer Satisfaction | Support ticket resolution | 24 hours |
| Factory Reset Survival | Devices protected after reset | 100% (Custom ROM required) |

### 1.3 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| User Retention Rate | 70% after 3 months | Cohort analysis |
| Device Online Rate | 95% | Heartbeat monitoring |
| Commission Payout Time | Less than 7 days | Payment processing |
| App Crash Rate | Less than 1% | Crashlytics |
| API Response Time | Less than 500ms | Prometheus metrics |
| Factory Reset Detection | 100% of reset attempts | Alert logs |
| SMS Command Response | Less than 10 seconds | Command logs |

---

## 2. Stakeholders

### 2.1 Stakeholder List

| Stakeholder | Role | Responsibilities |
|-------------|------|------------------|
| End Users | Device owners | Track devices, manage subscriptions |
| Sales Agents | Employees | Invite users, earn commissions |
| System Administrators | Admin team | Manage users, approve KYC, handle tickets |
| Corporate Clients | Organizations | Manage multiple devices under one account |
| Device Manufacturers | OEM Partners | Pre-install Silent Guardian as system app |
| Investors | Funding | ROI tracking, growth metrics |

### 2.2 User Personas

#### Persona 1: Regular User "Sarah"

| Attribute | Description |
|-----------|-------------|
| Age | 28 |
| Occupation | Marketing Manager |
| Devices | iPhone 14, MacBook |
| Pain Points | Worried about phone theft, wants location history |
| Goals | Track devices in real-time, get alerts when device moves |
| Frequency | Daily tracking, monthly subscription review |
| Custom ROM | Uses pre-flashed phone with Silent Guardian |

#### Persona 2: Sales Agent "John"

| Attribute | Description |
|-----------|-------------|
| Age | 35 |
| Occupation | Independent Sales Agent |
| Devices | Android phone |
| Pain Points | Wants to track commission earnings |
| Goals | Convert from contractor to permanent employee |
| Frequency | Daily invite sharing, weekly commission check |

#### Persona 3: System Admin "Michael"

| Attribute | Description |
|-----------|-------------|
| Age | 42 |
| Occupation | IT Administrator |
| Devices | Work laptop |
| Pain Points | Needs visibility into system health |
| Goals | Approve KYC, resolve support tickets, monitor devices |
| Frequency | Daily dashboard review |

#### Persona 4: Device Manufacturer "TechPhone Inc"

| Attribute | Description |
|-----------|-------------|
| Business | Phone manufacturer |
| Goal | Offer anti-theft as value-add feature |
| Method | Pre-install Silent Guardian in /system partition |
| Benefit | Differentiate devices from competitors |

---

## 3. Functional Requirements

### 3.1 User Management Module

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| UM-01 | User Registration | High | User can create account with email and password |
| UM-02 | User Login | High | User can login with email and password |
| UM-03 | Password Reset | High | User can reset password via email link |
| UM-04 | Profile Management | Medium | User can edit name, phone, profile picture |
| UM-05 | Account Deletion | High | User can delete account with all associated data |
| UM-06 | KYC Submission | High | User can upload ID document and selfie |
| UM-07 | KYC Approval Flow | High | Admin can approve or reject KYC with reason |
| UM-08 | Two-Factor Authentication | Low | User can enable 2FA for account security |

### 3.2 Device Management Module

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| DM-01 | Device Registration | High | User can register device using hardware ID |
| DM-02 | Device Listing | High | User can view all registered devices |
| DM-03 | Device Details | High | User can view device status, battery, last seen |
| DM-04 | Device Status Update | High | System automatically updates device online status |
| DM-05 | Device Deletion | High | User can remove device from account |
| DM-06 | Mark as Stolen | High | User can mark device stolen to activate tracking |
| DM-07 | Device Rename | Medium | User can change device name |
| DM-08 | Track After Reset | High | App survives factory reset (requires Custom ROM) |

### 3.3 Location Tracking Module

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| LT-01 | GPS Location Capture | High | App captures location every 30 seconds |
| LT-02 | Location Storage | High | Locations stored in database for 30 days |
| LT-03 | Location History View | High | User can view historical locations on map |
| LT-04 | Live Location Stream | Medium | User can see real-time location updates |
| LT-05 | Geofencing Alerts | Medium | User receives alert when device enters or exits zone |
| LT-06 | Location Accuracy | High | Accuracy within 10 meters in optimal conditions |
| LT-07 | Offline Location Queue | Medium | App stores locations when offline, syncs later |
| LT-08 | Movement Detection | Medium | System detects when device is moving versus stationary |

### 3.4 Remote Commands Module

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| RC-01 | Enable Mobile Data | High | Admin can remotely enable device mobile data |
| RC-02 | Enable WiFi | High | Admin can remotely turn on WiFi |
| RC-03 | Get Location Once | High | Admin can request immediate location update |
| RC-04 | Start Live Tracking | High | Admin can start continuous location updates |
| RC-05 | Stop Live Tracking | High | Admin can stop continuous tracking |
| RC-06 | Lock Device | High | Admin can remotely lock device screen |
| RC-07 | Trigger Alarm | High | Admin can make device ring loudly |
| RC-08 | Factory Reset | Medium | Admin can trigger factory reset (requires device admin) |
| RC-09 | Command Queue | High | Commands stored when device offline, delivered when online |
| RC-10 | Command History | Medium | Admin can view all commands sent to device |

### 3.5 SMS Command Module

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SC-01 | SMS Command Detection | High | App detects SMS with "#SG" prefix |
| SC-02 | Location via SMS | High | User can send "#SG location" to get device location |
| SC-03 | Lock via SMS | High | User can send "#SG lock" to lock device |
| SC-04 | Alarm via SMS | High | User can send "#SG alarm" to trigger sound |
| SC-05 | Enable Data via SMS | High | User can send "#SG data_on" to enable mobile data |
| SC-06 | Enable WiFi via SMS | High | User can send "#SG wifi_on" to enable WiFi |
| SC-07 | Recovery Mode | High | User can send "#SG recovery" to activate full tracking |
| SC-08 | SMS Response | High | Device replies via SMS with requested information |
| SC-09 | Abort Broadcast | High | SMS never reaches device inbox (intercepted) |
| SC-10 | Command Whitelist | Medium | Admin can whitelist authorized phone numbers |

### 3.6 Factory Reset Protection Module

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-01 | Factory Reset Detection | High | App detects when factory reset is initiated |
| FR-02 | Last Location Capture | High | App gets GPS location before reset completes |
| FR-03 | Alert Notification | High | Server sends SMS and Email alert to device owner |
| FR-04 | Reset Attempt Logging | High | Reset events stored in database |
| FR-05 | App Survival | High | App survives factory reset (Custom ROM required) |
| FR-06 | Auto-Reinstall | High | App auto-reinstalls after reset (Custom ROM required) |
| FR-07 | Uninstall Prevention | High | User cannot uninstall app (Custom ROM required) |
| FR-08 | Auto-Start on Boot | High | App starts automatically after reboot (Custom ROM required) |

### 3.7 Beacon Detection Module

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| BD-01 | BLE Scanning | Medium | App scans for BLE beacons in background |
| BD-02 | iBeacon Detection | Medium | App detects iBeacon protocol beacons |
| BD-03 | Eddystone Detection | Medium | App detects Eddystone beacons |
| BD-04 | AltBeacon Detection | Low | App detects AltBeacon protocol |
| BD-05 | Beacon Proximity Alert | Medium | App sends alert when specific beacon detected |
| BD-06 | Beacon Distance Calculation | Medium | App calculates approximate distance to beacon |
| BD-07 | Beacon History | Low | App stores detected beacons for later analysis |

### 3.8 Employee Management Module

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| EM-01 | Employee Registration | High | Sales agent can register with KYC documents |
| EM-02 | Employee Invite Link | High | Employee can generate unique invite links |
| EM-03 | Send Invite | High | Employee can send invites via email and SMS |
| EM-04 | Track Signups | High | Employee can see users who signed up using their link |
| EM-05 | Commission Calculation | High | System calculates 30% commission on new user subscriptions |
| EM-06 | Commission Dashboard | High | Employee can view total and monthly commissions |
| EM-07 | Payout Request | Medium | Employee can request commission payout |
| EM-08 | Permanent Conversion | High | System tracks progress toward permanent employee status |
| EM-09 | Career Progression | High | Employee sees progress bar to permanent position |
| EM-10 | Admin Commission Approval | High | Admin can review and approve commission payouts |

### 3.9 Subscription and Payment Module

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SP-01 | Plan Display | High | User can view Basic ($4.99) and Premium ($9.99) plans |
| SP-02 | MTN Mobile Money | High | User can pay using MTN Mobile Money |
| SP-03 | Airtel Money | High | User can pay using Airtel Money |
| SP-04 | Transaction History | High | User can view all past transactions |
| SP-05 | Subscription Activation | High | Subscription activates immediately after payment |
| SP-06 | Auto-Renewal | High | Subscription auto-renews monthly |
| SP-07 | Cancellation | High | User can cancel auto-renewal |
| SP-08 | Payment Receipts | Medium | System generates downloadable receipts |

### 3.10 Admin Dashboard Module

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| AD-01 | Dashboard Overview | High | Admin sees total users, devices, revenue |
| AD-02 | User Management | High | Admin can view, approve, delete users |
| AD-03 | Device Management | High | Admin can view all devices, mark as stolen |
| AD-04 | Employee Management | High | Admin can view, approve, promote employees |
| AD-05 | KYC Review | High | Admin can review and approve KYC documents |
| AD-06 | Revenue Reports | High | Admin can generate revenue reports by month or year |
| AD-07 | Commission Reports | High | Admin can view all employee commissions |
| AD-08 | Support Tickets | High | Admin can view and respond to tickets |
| AD-09 | IMEI Blacklist | High | Admin can add or remove IMEI numbers from blacklist |
| AD-10 | Community Alerts | Medium | Admin can view user-submitted stolen device alerts |
| AD-11 | System Settings | Medium | Admin can configure system parameters |
| AD-12 | Backup and Restore | High | Admin can create and restore system backups |
| AD-13 | Audit Logs | High | Admin can view all system actions with timestamps |
| AD-14 | Factory Reset Alerts | High | Admin can view all factory reset attempts |

### 3.11 Support Ticket Module

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| ST-01 | Create Ticket | High | User can create support ticket with subject and description |
| ST-02 | Ticket Priority | High | User can select Low, Medium, or High priority |
| ST-03 | Ticket Status | High | User can see ticket status (Open, In-Progress, Closed) |
| ST-04 | Reply to Ticket | High | User can reply to existing ticket |
| ST-05 | Admin Assignment | Medium | Admin can assign ticket to specific employee |
| ST-06 | Ticket History | Medium | User can view all past tickets |
| ST-07 | Email Notifications | High | User receives email when ticket is updated |

### 3.12 Chat Module

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CH-01 | Real-time Chat | Medium | User can chat with support in real-time |
| CH-02 | Admin-Employee Chat | Medium | Admin can chat with employees |
| CH-03 | Message Read Receipts | Low | User sees when message is read |
| CH-04 | Typing Indicator | Low | User sees when other party is typing |
| CH-05 | Chat History | Medium | Chat messages are saved and viewable |
| CH-06 | File Attachments | Low | User can attach files to chat messages |
| CH-07 | Unread Count | Medium | User sees badge for unread messages |

### 3.13 IMEI Blacklist Module

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| IB-01 | IMEI Check | High | System checks IMEI against blacklist during registration |
| IB-02 | Add to Blacklist | High | Admin can add IMEI with reason |
| IB-03 | Remove from Blacklist | High | Admin can remove IMEI when device recovered |
| IB-04 | Blacklist API | Medium | External systems can query blacklist status |
| IB-05 | Auto-Blacklist on Stolen | High | Device automatically blacklisted when marked stolen |

### 3.14 Community Alerts Module

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CA-01 | Create Alert | Medium | User can report stolen device with location |
| CA-02 | Nearby Alerts | Medium | User can see stolen device alerts near their location |
| CA-03 | Alert Radius | Medium | User can set search radius (1km, 5km, 10km) |
| CA-04 | Alert Expiration | Medium | Alerts expire after 30 days |
| CA-05 | Reward Offering | Low | User can offer reward for finding device |
| CA-06 | Alert Resolution | Medium | User can mark alert as resolved |

---

## 4. Non-Functional Requirements

### 4.1 Performance Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | API Response Time | Less than 500ms for 95% of requests |
| NFR-02 | App Startup Time | Less than 3 seconds |
| NFR-03 | Location Update Latency | Less than 10 seconds from capture to display |
| NFR-04 | SMS Command Response | Less than 10 seconds from SMS received |
| NFR-05 | Concurrent Users | Support 10,000 concurrent users |
| NFR-06 | Database Query Time | Less than 100ms for indexed queries |
| NFR-07 | Command Execution | Less than 5 seconds when device online |

### 4.2 Security Requirements

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-08 | Data Encryption | TLS 1.3 for all network traffic |
| NFR-09 | Password Security | bcrypt hashing, minimum 8 characters |
| NFR-10 | Session Management | JWT tokens with 24-hour expiry |
| NFR-11 | Rate Limiting | 100 requests per minute per IP address |
| NFR-12 | Hardware ID | Widevine DRM for device identification |
| NFR-13 | GDPR Compliance | User data deletion within 30 days of request |
| NFR-14 | Factory Reset Protection | App survives factory reset (Custom ROM) |

### 4.3 Availability Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-15 | System Uptime | 99.9% (8.76 hours downtime per year) |
| NFR-16 | Backup Frequency | Daily automated backups |
| NFR-17 | Disaster Recovery | RTO: 4 hours, RPO: 1 hour |

### 4.4 Scalability Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-18 | User Growth | Support 100,000 users in Year 1 |
| NFR-19 | Device Growth | Support 50,000 active devices |
| NFR-20 | Location Storage | Store 30 days of history per device |
| NFR-21 | Horizontal Scaling | Auto-scale based on CPU and memory |

### 4.5 Mobile App Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-22 | Battery Usage | Less than 5% battery drain per day |
| NFR-23 | Data Usage | Less than 50MB per month for location updates |
| NFR-24 | Offline Support | Store up to 1,000 locations offline |
| NFR-25 | Background Operation | Service restarts on device boot |
| NFR-26 | Factory Reset Survival | App persists after factory reset (Custom ROM) |
| NFR-27 | Uninstall Protection | User cannot uninstall (Custom ROM) |

---

## 5. Technical Architecture Requirements

### 5.1 Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| Android | Kotlin | Modern, safe, Google-supported |
| Custom ROM | AOSP Android 14 | Required for system app installation |
| Backend | Python FastAPI | High performance, async support |
| Database | MongoDB | Flexible schema for location data |
| Cache | Redis | Fast session storage |
| Hosting | Google Cloud Run | Serverless, auto-scaling |
| Web | React | Component-based, large ecosystem |

### 5.2 Custom ROM Requirements

| Requirement | Specification |
|-------------|---------------|
| AOSP Version | Android 14 (API 34) |
| App Location | /system/priv-app |
| App Signature | Platform certificate |
| Persistent Flag | android:persistent="true" |
| Shared User ID | android:sharedUserId="android.uid.system" |
| Build Once | Single build, flash to unlimited devices |

### 5.3 API Requirements

| Requirement | Specification |
|-------------|---------------|
| RESTful | Follow REST conventions |
| Versioning | URL versioning (/api/v1/) |
| Authentication | Bearer JWT tokens |
| Documentation | OpenAPI/Swagger auto-generated |
| Rate Limiting | 100 requests per minute per IP |

### 5.4 Database Requirements

| Requirement | Specification |
|-------------|---------------|
| Indexes | hardwareId, email, deviceId |
| TTL Indexes | Locations expire after 30 days |
| Geospatial | 2dsphere indexes for location queries |
| Replication | Minimum 3-node replica set |

---

## 6. Integration Requirements

### 6.1 External Service Integrations

| Service | Purpose | Criticality |
|---------|---------|-------------|
| Firebase FCM | Push notifications | High |
| Twilio | SMS sending | High |
| MTN API | Mobile money payments | High |
| Airtel API | Mobile money payments | High |

### 6.2 Webhook Requirements

| Webhook | Purpose | Retry Policy |
|---------|---------|--------------|
| MTN Webhook | Payment confirmation | 5 retries, exponential backoff |
| Airtel Webhook | Payment confirmation | 5 retries, exponential backoff |

---

## 7. Data Requirements

### 7.1 Data Retention Policy

| Data Type | Retention Period | Archival |
|-----------|-----------------|----------|
| User Accounts | Until deletion request | 30 days after deletion |
| Location History | 30 days | Compressed backup |
| Command History | 90 days | Not archived |
| Chat Messages | 1 year | Compressed backup |
| Audit Logs | 90 days | Not archived |
| Transaction Records | 7 years | Encrypted archive |
| Factory Reset Alerts | 1 year | Compressed backup |

### 7.2 Data Volume Estimates

| Entity | Monthly Growth | Year 1 Total |
|--------|---------------|--------------|
| Users | 8,300 | 100,000 |
| Devices | 4,100 | 50,000 |
| Locations | 150 million | 1.8 billion |
| Commands | 500,000 | 6 million |
| Transactions | 10,000 | 120,000 |

---

## 8. Reporting Requirements

### 8.1 Reports

| Report | Frequency | Audience | Format |
|--------|-----------|----------|--------|
| Revenue Report | Monthly | Admin | PDF and CSV |
| User Growth Report | Weekly | Admin | Dashboard |
| Device Activity Report | Daily | Admin | Dashboard |
| Commission Report | Monthly | Admin | PDF and CSV |
| Employee Performance | Monthly | Admin | Dashboard |
| KYC Pending Report | Daily | Admin | Dashboard |
| Support Ticket Report | Weekly | Admin | Dashboard |
| Factory Reset Alert Report | Daily | Admin | Dashboard |

---

## 9. Compliance Requirements

| Requirement | Standard | Implementation |
|-------------|----------|----------------|
| Data Protection | GDPR | User data deletion, export |
| Payment Security | PCI DSS | MTN and Airtel handle payments |
| Mobile Tracking | Local laws | User consent required |
| Employee Data | Labor laws | Commission transparency |
| Device Tracking | Privacy laws | User must enable tracking |

---

## 10. Assumptions and Constraints

### 10.1 Assumptions

| ID | Assumption |
|----|------------|
| A-01 | Users have smartphones with GPS capability |
| A-02 | Users have internet connectivity for real-time tracking |
| A-03 | Sales agents have valid KYC documents |
| A-04 | Payment gateways remain available |
| A-05 | Mobile network operators support SMS commands |
| A-06 | Users accept Custom ROM installation |
| A-07 | Devices have unlockable bootloaders |

### 10.2 Constraints

| ID | Constraint |
|----|------------|
| C-01 | App requires Android 8.0 or higher |
| C-02 | Location tracking requires user permission |
| C-03 | SMS commands require SMS permission |
| C-04 | Device admin features require user activation |
| C-05 | Custom ROM requires bootloader unlock |
| C-06 | Factory reset survival requires Custom ROM |
| C-07 | App cannot be distributed via Google Play Store |

---

## 11. Success Metrics

| Metric | Year 1 Target |
|--------|---------------|
| Active devices | 50,000 |
| Paying users | 20,000 |
| Monthly revenue | $200,000 |
| Employee agents | 5,000 |
| Commission paid | $60,000 per month |
| App crash rate | Less than 0.5% |
| Factory reset survival rate | 100% (Custom ROM devices) |
| SMS command success rate | 99% |
| Customer satisfaction | 4.5 out of 5 |

---

## 12. Glossary

| Term | Definition |
|------|------------|
| **AOSP** | Android Open Source Project - Source code for Android |
| **APK** | Android Package Kit - Installation file format |
| **Custom ROM** | Modified version of Android installed on devices |
| **Device Admin** | Android permission allowing app to control device policies |
| **Device Owner** | App with elevated privileges for enterprise management |
| **Factory Reset** | Process of wiping all user data from a device |
| **FCM** | Firebase Cloud Messaging - Push notification service |
| **FRP** | Factory Reset Protection - Google's anti-theft feature |
| **GDPR** | General Data Protection Regulation - EU privacy law |
| **GPS** | Global Positioning System - Location tracking |
| **Hardware ID** | Unique identifier based on device hardware |
| **IMEI** | International Mobile Equipment Identity - Unique device number |
| **JWT** | JSON Web Token - Authentication mechanism |
| **KYC** | Know Your Customer - Identity verification |
| **MDM** | Mobile Device Management - Enterprise device control |
| **RPO** | Recovery Point Objective - Maximum data loss allowed |
| **RTO** | Recovery Time Objective - Time to restore service |
| **SMS** | Short Message Service - Text messaging |
| **System App** | App installed in /system partition that survives factory reset |
| **UGX** | Ugandan Shilling - Local currency |

---

## 13. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | _____________ | _____________ | _____ |
| Technical Lead | _____________ | _____________ | _____ |
| Security Officer | _____________ | _____________ | _____ |
| Business Owner | _____________ | _____________ | _____ |

---

**END OF DOCUMENT**
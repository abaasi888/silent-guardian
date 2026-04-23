# Silent Guardian – Ultimate Device Tracking & Protection Suite

## Overview

Silent Guardian is an enterprise‑grade fleet tracking, workforce management, and corporate security platform. It provides:

- **Real‑time device tracking** (Android client app) with background GPS, BLE beacon, and SMS trigger.
- **Employee management** – fingerprint attendance, hourly location checks, referral marketing, and commission tracking.
- **Admin portal** (web + Android app) – full control over users, devices, employees, geofences, reports, and live chat.
- **Subscription system** with crypto payments (USDT – TRC20/BEP20) and device tiers (CHEAP / EXPENSIVE).
- **Corporate features** – multi‑tenant organizations, geofencing, audit logs, webhooks, automated reports.

The system uses **Kotlin + Spring Boot WebFlux** (reactive) backend, **MongoDB**, **Redis**, **JWT** authentication, and **WebSocket** for real‑time chat.

## Key Features

### For Device Owners (Client App)
- One device per user (enforced by backend).
- Background location reporting (interval based on subscription plan).
- BLE beacon advertisement for proximity detection.
- SMS trigger: send "SILENTGUARDIAN" to your device → immediate location response.
- Crypto subscription payments (USDT).

### For Employees (Employee App)
- Fingerprint attendance (CHECK_IN, CHECK_OUT, hourly FIELD_CHECK).
- Hourly location capture while on duty.
- Unique referral link generation.
- Commission tracking (30% of referred user’s first subscription).
- Automatic promotion to permanent employee after 1000 referrals (fixed salary + commission).

### For Administrators (Web & Admin App)
- Dashboard with key metrics and device activity charts.
- User management (list, approve/reject KYC, delete).
- Device management (list, mark as stolen).
- Employee management (invite, track performance, deactivate app).
- Geofence creation (circle/polygon) with enter/exit alerts.
- Live chat with employees (WebSocket).
- Audit logs and report generation.
- Corporate features: organizations, device groups, webhooks.

## Technology Stack

| Layer | Technologies |
|-------|--------------|
| Backend | Kotlin 1.9.20, Spring Boot 3.2 (WebFlux), Spring Security, MongoDB Reactive, Redis Reactive, JWT, WebSocket |
| Frontend (web) | React 18, Vite, React Router, Axios, Leaflet (maps) |
| Android Client | Kotlin, Jetpack, Room, WorkManager, Google Play Services (Location, Integrity), BLE |
| Android Employee | Kotlin, BiometricPrompt, Location Services, Retrofit, Firebase FCM |
| Android Admin | Kotlin, MPAndroidChart, WebSocket, Retrofit |
| Infrastructure | Docker, Terraform (AWS/GCP), Kubernetes, Prometheus, Grafana |

## Project Structure
silent-guardian-ultimate/
├── backend/ # Kotlin + Spring Boot (reactive)
├── frontend/ # React + Vite (client + admin portals)
├── android/ # Client tracking app
├── android-employee/ # Employee app
├── android-admin/ # Admin app
├── infrastructure/ # Docker compose, Terraform, K8s
├── docs/ # Full documentation (architecture, API, guides)
├── .github/workflows/ # CI/CD pipelines
└── PROJECT_REFERENCE.md # Complete technical reference

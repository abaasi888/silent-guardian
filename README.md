# 🛡️ Silent Guardian - Complete Security & Tracking Platform

[![Python Version](https://img.shields.io/badge/python-3.11%2B-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104%2B-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2%2B-61dafb.svg)](https://reactjs.org)
[![Kotlin](https://img.shields.io/badge/Kotlin-1.9%2B-purple.svg)](https://kotlinlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0%2B-darkgreen.svg)](https://mongodb.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📱 A Complete End-to-End Security & Workforce Management Solution

Silent Guardian is a **production-ready platform** that combines device tracking, employee monitoring, and administrative controls into a single integrated system. Built for enterprises, security companies, and organizations needing real-time visibility over their assets and workforce.

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, User, Employee)
- Password hashing with bcrypt
- Session management with Redis

### 📍 Real-time Tracking
- Live GPS location tracking for devices and employees
- Location history with 30-day retention
- WebSocket for real-time updates
- Background location tracking on Android

### 📱 Device Management
- Remote lock, wipe, and locate commands
- Device admin features for Android
- SMS command receiver
- Factory reset protection
- IMEI blacklisting system

### 👔 Employee Management
- Invite-only registration system
- Commission tracking and analytics
- Performance dashboard with charts
- Signup tracking and referral monitoring
- Real-time location sharing with admin

### 👑 Admin Dashboard
- Complete user management CRUD
- Device monitoring and control
- Employee invite generation
- System analytics and reports
- Audit logs for security tracking

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Backend | Python 3.11+, FastAPI | REST API & WebSocket server |
| Database | MongoDB 7.0+ | Primary data store |
| Cache | Redis 7.0+ | Session management & caching |
| Frontend | React 18, Vite, Tailwind CSS | Admin dashboard |
| Android | Kotlin, Jetpack, Room | Tracking & employee apps |
| Real-time | WebSockets, Socket.IO | Live location updates |

---

## 📁 Project Structure
silent-guardian/
├── backend-python/ # FastAPI Backend
│ ├── app/
│ │ ├── routers/ # API endpoints
│ │ ├── services/ # Business logic
│ │ ├── models.py # Data models
│ │ ├── database.py # DB connection
│ │ ├── auth.py # Auth utilities
│ │ ├── config.py # Configuration
│ │ └── websocket.py # WebSocket handler
│ ├── requirements.txt
│ └── main.py
│
├── frontend/ # React Web Application
│ ├── src/
│ │ ├── pages/ # User pages
│ │ ├── admin/ # Admin panel
│ │ ├── components/ # Reusable components
│ │ └── services/ # API services
│ ├── package.json
│ └── vite.config.js
│
├── android/
│ └── tracking_app/ # Android Tracking App
│ ├── app/src/main/java/ # Kotlin code
│ └── app/src/main/res/ # Resources
│
├── android-employee/
│ └── employee_app/ # Android Employee App
│ ├── app/src/main/java/ # Kotlin code
│ └── app/src/main/res/ # Resources
│
├── infrastructure/
│ └── docker/ # Docker configuration
│ ├── docker-compose.yml
│ ├── Dockerfile.backend
│ └── Dockerfile.frontend
│
└── docs/ # Documentation
# Silent Guardian - Complete Tracking Solution (Kotlin + React + Android)

## Features
- Kotlin backend (Spring Boot) with MongoDB, Redis, JWT
- React frontend (Vite PWA) with KYC and USDT checkout
- Native Android app (background GPS, BLE beacon, SMS trigger, Device Recall API)
- Crypto payments (USDT – TRC20/BEP20)
- KYC verification

## Quick Start

### Prerequisites
- Java 17, MongoDB, Redis
- Node.js 18+
- Android SDK (for building APK)

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env (MONGODB_URI, JWT_SECRET, CRYPTO_WALLET_ADDRESS, etc.)
./gradlew bootRun

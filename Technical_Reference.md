# Silent Guardian – Complete Technical Reference & Operational Guide

> This document contains everything you need to know about the Silent Guardian ecosystem: architecture, component interactions, how to build and deploy all parts, security, monitoring, backup, troubleshooting, and a detailed breakdown of **operational costs**. No file trees – just clear, actionable information.

---

## 1. What Silent Guardian Does

Silent Guardian is an end‑to‑end platform that combines:# Silent Guardian – Complete Technical Reference & Operational Guide

> This document contains everything you need to know about the Silent Guardian ecosystem: architecture, component interactions, how to build and deploy all parts, security, monitoring, backup, troubleshooting, and a detailed breakdown of **operational costs**. No file trees – just clear, actionable information.

---

## 1. What Silent Guardian Does

Silent Guardian is an end‑to‑end platform that combines:

- **Device tracking** – GPS, BLE beacon, SMS trigger (Android client app).
- **Workforce management** – fingerprint attendance, hourly location checks, referral marketing, commission tracking (employee Android app).
- **Corporate administration** – user/device/employee management, geofencing, live chat, audit logs, reports (admin Android app + web portal).
- **Monetisation** – subscription plans with crypto payments (USDT) and automatic commission for employees.

All components talk to a central Kotlin/Spring Boot backend. The same backend serves the web portal and all three Android apps.

---

## 2. Core Components Explained

### 2.1 Backend (Kotlin + Spring Boot WebFlux)
- **Role**: Handles all business logic, authentication, data persistence, and real‑time events.
- **Database**: MongoDB (stores users, devices, locations, subscriptions, employees, commissions, geofences, etc.).
- **Cache**: Redis (for sessions and temporary data).
- **External APIs**: TRON/BSC blockchain for USDT payment verification; email SMTP; Firebase Cloud Messaging (FCM) for push notifications.
- **Real‑time**: WebSocket server for admin chat.

### 2.2 Frontend Web Portal (React + Vite)
- **Client area**: Users log in, view their devices, see location history, submit KYC, buy subscriptions.
- **Admin area**: Full management dashboard with statistics, user/device/employee CRUD, geofence creation, live chat, reports.

### 2.3 Android Client App
- Installed on devices that need to be tracked.
- Sends GPS location every few minutes (interval depends on subscription plan).
- Advertises a BLE beacon (useful for proximity detection).
- Listens for SMS with the keyword `SILENTGUARDIAN` → responds with current location.
- Enforces one device per user – backend rejects second registrations.

### 2.4 Android Employee App
- For field agents. Uses biometric (fingerprint) for attendance.
- Records CHECK_IN, CHECK_OUT, and hourly FIELD_CHECK with location.
- Generates a unique referral link; when a new user registers via that link and buys a subscription, the employee earns 30% commission.
- Shows commissions earned and total referrals.
- Receives push notifications (FCM) when admin deactivates the account.

### 2.5 Android Admin App
- Full mobile management console.
- Dashboard with real‑time charts (users, devices, activity).
- Manage users (approve KYC, delete).
- Manage devices (mark as stolen/active).
- Manage employees (view performance, deactivate employee app).
- Create and delete geofences (circle or polygon).
- Live chat with employees (WebSocket).
- Generate reports and view audit logs.

---

## 3. How Components Work Together

- All Android apps and the web portal **call the same backend API** over HTTPS.
- The admin portal (both web and Android) also maintains a **WebSocket connection** to the backend for live chat.
- When an admin marks a device as stolen, the backend updates the `devices` collection; the client app next time it sends location will receive a push notification (via FCM) and can increase tracking frequency.
- When an admin deactivates an employee, the backend sets `appActive = false` and sends an FCM push to that employee’s device, which triggers a logout.
- Subscription expiry is checked daily by a background scheduler; users with expired subscriptions cannot send locations.

---

## 4. Building and Deploying the System

### 4.1 Local Development Setup

**Prerequisites:** Java 17, Node.js 18+, MongoDB, Redis, Android Studio.

**Steps:**
1. Clone the project repository.
2. Start MongoDB and Redis locally (use `mongod` and `redis-server`).
3. Backend: create `.env` from `.env.example`, then `./gradlew bootRun` – runs on port 5000.
4. Frontend: `npm install && npm run dev` – runs on port 5173, proxies `/api` to backend.
5. Android apps: open each in Android Studio, update the API base URL to `http://your-local-ip:5000`, build and install on devices.

### 4.2 Production Deployment

#### Backend (VPS recommendation)
- Provision Ubuntu 22.04 VPS (e.g., DigitalOcean, AWS Lightsail, Linode).
- Install Java 17, MongoDB, Redis, Nginx.
- Upload the built JAR (from `./gradlew build`) and the `.env` file.
- Create a systemd service to keep it running.
- Configure Nginx as reverse proxy with SSL (Let’s Encrypt).

**Cost estimate (minimum):** $6‑12/month for a small VPS (1‑2 GB RAM) + free tier MongoDB/Redis if self‑hosted.

#### Frontend (static hosting)
- Build frontend: `npm run build` → `dist/` folder.
- Deploy to **Vercel** (free tier) or **Netlify** (free tier) or **Nginx on the same VPS**.
- If self‑hosted, add a second Nginx server block for the frontend domain.

**Cost:** free (Vercel/Netlify) or included in VPS cost.

#### Android Apps
- Build signed release APKs (as described in section 5).
- Distribute via direct download (website) or upload to Google Play (one‑time $25 fee per app).
- Update API base URL to `https://api.yourdomain.com` before building.

**Cost:** $0 if direct download; $25 per app if published on Google Play.

---

## 5. Operational Costs Breakdown

| Item | Estimated Monthly Cost (USD) | Notes |
|------|------------------------------|-------|
| **VPS (backend + database)** | $10 – $20 | 2‑4 GB RAM, 2 vCPUs, 50 GB SSD (e.g., DigitalOcean, Vultr). Self‑hosted MongoDB/Redis included. |
| **Domain name** | $0 – $15 | Yearly cost divided by 12. Use cheap `.com` or free `.tk`. |
| **SSL certificate** | $0 | Let’s Encrypt free. |
| **Frontend hosting (Vercel/Netlify)** | $0 | Free tier sufficient for moderate traffic. |
| **Google Play Developer account** | $25 (one‑time) | Per app, but you can publish three apps under one account. |
| **Firebase Cloud Messaging** | $0 | Free for push notifications. |
| **Email SMTP (e.g., SendGrid)** | $0 – $15 | Free tier (100 emails/day) may be enough; upgrade if needed. |
| **Blockchain API (TRON/BSC)** | $0 | Public APIs are free but rate‑limited. For high volume, consider paid plans (~$50/month). |
| **Backup storage (e.g., AWS S3)** | $1 – $5 | For daily MongoDB dumps (few GB). |
| **Monitoring (UptimeRobot)** | $0 | Free plan checks every 5 minutes. |
| **Total minimum** | ~ $15 – $30 per month | Excluding one‑time Google Play fees. |

For a small to medium deployment (a few hundred devices), this cost is realistic. As traffic grows, you may need to scale the VPS or move to managed databases (MongoDB Atlas ~$15/month, Redis Cloud ~$10/month), increasing total to $50‑80/month.

---

## 6. Security & Privacy

- **Data in transit:** All communication is over HTTPS/WSS. Backend Nginx enforces TLS 1.2/1.3.
- **Authentication:** JWT with short‑lived access tokens (7 days) and refresh tokens (30 days). Passwords hashed with BCrypt.
- **Role‑based access:** Endpoints are protected by `@PreAuthorize`; admins have separate privileges.
- **Database:** MongoDB bound to localhost; authentication enabled (create admin user).
- **API rate limiting:** Implement via Nginx `limit_req` zone to prevent abuse.
- **Android apps:** ProGuard obfuscation; no hardcoded secrets.
- **GDPR compliance:** If serving EU users, you must:
  - Obtain explicit consent for location tracking.
  - Provide a way to delete personal data (endpoint `/api/v1/user/delete` – you can add it).
  - Keep audit logs for no longer than 30 days.

---

## 7. Monitoring & Maintenance

### 7.1 Health Checks
- Backend exposes `/health` – monitor with **UptimeRobot** (free) or **Better Stack**.
- Set up alerts for downtime.

### 7.2 Logs
- Backend logs: `sudo journalctl -u silent-guardian -f` (systemd).
- MongoDB logs: `/var/log/mongodb/mongod.log`.
- Redis logs: `journalctl -u redis`.

### 7.3 Regular Tasks
- **Daily** – backup MongoDB (see section 8).
- **Weekly** – check disk space and log rotation.
- **Monthly** – review audit logs for suspicious activity; update dependencies (backend, frontend, Android).

### 7.4 Scaling Tips
- If the number of devices exceeds 1,000, consider:
  - Moving MongoDB to a separate server or use MongoDB Atlas.
  - Adding a second backend instance behind a load balancer.
  - Using a dedicated Redis instance for caching.

---

## 8. Backup & Disaster Recovery

### 8.1 Automated MongoDB Backup
Create a cron job on the VPS (e.g., daily at 2 AM):

```bash
0 2 * * * mongodump --uri="mongodb://localhost:27017/silentguardian" --out=/backups/$(date +\%Y-\%m-\%d) && tar -czf /backups/backup-$(date +\%Y-\%m-\%d).tar.gz /backups/$(date +\%Y-\%m-\%d) && rm -rf /backups/$(date +\%Y-\%m-\%d)# Silent Guardian – Complete Technical Reference & Operational Guide

> This document contains everything you need to know about the Silent Guardian ecosystem: architecture, component interactions, how to build and deploy all parts, security, monitoring, backup, troubleshooting, and a detailed breakdown of **operational costs**. No file trees – just clear, actionable information.

---

## 1. What Silent Guardian Does

Silent Guardian is an end‑to‑end platform that combines:

- **Device tracking** – GPS, BLE beacon, SMS trigger (Android client app).
- **Workforce management** – fingerprint attendance, hourly location checks, referral marketing, commission tracking (employee Android app).
- **Corporate administration** – user/device/employee management, geofencing, live chat, audit logs, reports (admin Android app + web portal).
- **Monetisation** – subscription plans with crypto payments (USDT) and automatic commission for employees.

All components talk to a central Kotlin/Spring Boot backend. The same backend serves the web portal and all three Android apps.

---

## 2. Core Components Explained

### 2.1 Backend (Kotlin + Spring Boot WebFlux)
- **Role**: Handles all business logic, authentication, data persistence, and real‑time events.
- **Database**: MongoDB (stores users, devices, locations, subscriptions, employees, commissions, geofences, etc.).
- **Cache**: Redis (for sessions and temporary data).
- **External APIs**: TRON/BSC blockchain for USDT payment verification; email SMTP; Firebase Cloud Messaging (FCM) for push notifications.
- **Real‑time**: WebSocket server for admin chat.

### 2.2 Frontend Web Portal (React + Vite)
- **Client area**: Users log in, view their devices, see location history, submit KYC, buy subscriptions.
- **Admin area**: Full management dashboard with statistics, user/device/employee CRUD, geofence creation, live chat, reports.

### 2.3 Android Client App
- Installed on devices that need to be tracked.
- Sends GPS location every few minutes (interval depends on subscription plan).
- Advertises a BLE beacon (useful for proximity detection).
- Listens for SMS with the keyword `SILENTGUARDIAN` → responds with current location.
- Enforces one device per user – backend rejects second registrations.

### 2.4 Android Employee App
- For field agents. Uses biometric (fingerprint) for attendance.
- Records CHECK_IN, CHECK_OUT, and hourly FIELD_CHECK with location.
- Generates a unique referral link; when a new user registers via that link and buys a subscription, the employee earns 30% commission.
- Shows commissions earned and total referrals.
- Receives push notifications (FCM) when admin deactivates the account.

### 2.5 Android Admin App
- Full mobile management console.
- Dashboard with real‑time charts (users, devices, activity).
- Manage users (approve KYC, delete).
- Manage devices (mark as stolen/active).
- Manage employees (view performance, deactivate employee app).
- Create and delete geofences (circle or polygon).
- Live chat with employees (WebSocket).
- Generate reports and view audit logs.

---

## 3. How Components Work Together

- All Android apps and the web portal **call the same backend API** over HTTPS.
- The admin portal (both web and Android) also maintains a **WebSocket connection** to the backend for live chat.
- When an admin marks a device as stolen, the backend updates the `devices` collection; the client app next time it sends location will receive a push notification (via FCM) and can increase tracking frequency.
- When an admin deactivates an employee, the backend sets `appActive = false` and sends an FCM push to that employee’s device, which triggers a logout.
- Subscription expiry is checked daily by a background scheduler; users with expired subscriptions cannot send locations.

---

## 4. Building and Deploying the System

### 4.1 Local Development Setup

**Prerequisites:** Java 17, Node.js 18+, MongoDB, Redis, Android Studio.

**Steps:**
1. Clone the project repository.
2. Start MongoDB and Redis locally (use `mongod` and `redis-server`).
3. Backend: create `.env` from `.env.example`, then `./gradlew bootRun` – runs on port 5000.
4. Frontend: `npm install && npm run dev` – runs on port 5173, proxies `/api` to backend.
5. Android apps: open each in Android Studio, update the API base URL to `http://your-local-ip:5000`, build and install on devices.

### 4.2 Production Deployment

#### Backend (VPS recommendation)
- Provision Ubuntu 22.04 VPS (e.g., DigitalOcean, AWS Lightsail, Linode).
- Install Java 17, MongoDB, Redis, Nginx.
- Upload the built JAR (from `./gradlew build`) and the `.env` file.
- Create a systemd service to keep it running.
- Configure Nginx as reverse proxy with SSL (Let’s Encrypt).

**Cost estimate (minimum):** $6‑12/month for a small VPS (1‑2 GB RAM) + free tier MongoDB/Redis if self‑hosted.

#### Frontend (static hosting)
- Build frontend: `npm run build` → `dist/` folder.
- Deploy to **Vercel** (free tier) or **Netlify** (free tier) or **Nginx on the same VPS**.
- If self‑hosted, add a second Nginx server block for the frontend domain.

**Cost:** free (Vercel/Netlify) or included in VPS cost.

#### Android Apps
- Build signed release APKs (as described in section 5).
- Distribute via direct download (website) or upload to Google Play (one‑time $25 fee per app).
- Update API base URL to `https://api.yourdomain.com` before building.

**Cost:** $0 if direct download; $25 per app if published on Google Play.

---

## 5. Operational Costs Breakdown

| Item | Estimated Monthly Cost (USD) | Notes |
|------|------------------------------|-------|
| **VPS (backend + database)** | $10 – $20 | 2‑4 GB RAM, 2 vCPUs, 50 GB SSD (e.g., DigitalOcean, Vultr). Self‑hosted MongoDB/Redis included. |
| **Domain name** | $0 – $15 | Yearly cost divided by 12. Use cheap `.com` or free `.tk`. |
| **SSL certificate** | $0 | Let’s Encrypt free. |
| **Frontend hosting (Vercel/Netlify)** | $0 | Free tier sufficient for moderate traffic. |
| **Google Play Developer account** | $25 (one‑time) | Per app, but you can publish three apps under one account. |
| **Firebase Cloud Messaging** | $0 | Free for push notifications. |
| **Email SMTP (e.g., SendGrid)** | $0 – $15 | Free tier (100 emails/day) may be enough; upgrade if needed. |
| **Blockchain API (TRON/BSC)** | $0 | Public APIs are free but rate‑limited. For high volume, consider paid plans (~$50/month). |
| **Backup storage (e.g., AWS S3)** | $1 – $5 | For daily MongoDB dumps (few GB). |
| **Monitoring (UptimeRobot)** | $0 | Free plan checks every 5 minutes. |
| **Total minimum** | ~ $15 – $30 per month | Excluding one‑time Google Play fees. |

For a small to medium deployment (a few hundred devices), this cost is realistic. As traffic grows, you may need to scale the VPS or move to managed databases (MongoDB Atlas ~$15/month, Redis Cloud ~$10/month), increasing total to $50‑80/month.

---

## 6. Security & Privacy

- **Data in transit:** All communication is over HTTPS/WSS. Backend Nginx enforces TLS 1.2/1.3.
- **Authentication:** JWT with short‑lived access tokens (7 days) and refresh tokens (30 days). Passwords hashed with BCrypt.
- **Role‑based access:** Endpoints are protected by `@PreAuthorize`; admins have separate privileges.
- **Database:** MongoDB bound to localhost; authentication enabled (create admin user).
- **API rate limiting:** Implement via Nginx `limit_req` zone to prevent abuse.
- **Android apps:** ProGuard obfuscation; no hardcoded secrets.
- **GDPR compliance:** If serving EU users, you must:
  - Obtain explicit consent for location tracking.
  - Provide a way to delete personal data (endpoint `/api/v1/user/delete` – you can add it).
  - Keep audit logs for no longer than 30 days.

---

## 7. Monitoring & Maintenance

### 7.1 Health Checks
- Backend exposes `/health` – monitor with **UptimeRobot** (free) or **Better Stack**.
- Set up alerts for downtime.

### 7.2 Logs
- Backend logs: `sudo journalctl -u silent-guardian -f` (systemd).
- MongoDB logs: `/var/log/mongodb/mongod.log`.
- Redis logs: `journalctl -u redis`.

### 7.3 Regular Tasks
- **Daily** – backup MongoDB (see section 8).
- **Weekly** – check disk space and log rotation.
- **Monthly** – review audit logs for suspicious activity; update dependencies (backend, frontend, Android).

### 7.4 Scaling Tips
- If the number of devices exceeds 1,000, consider:
  - Moving MongoDB to a separate server or use MongoDB Atlas.
  - Adding a second backend instance behind a load balancer.
  - Using a dedicated Redis instance for caching.

---

## 8. Backup & Disaster Recovery

### 8.1 Automated MongoDB Backup
Create a cron job on the VPS (e.g., daily at 2 AM):

```bash
0 2 * * * mongodump --uri="mongodb://localhost:27017/silentguardian" --out=/backups/$(date +\%Y-\%m-\%d) && tar -czf /backups/backup-$(date +\%Y-\%m-\%d).tar.gz /backups/$(date +\%Y-\%m-\%d) && rm -rf /backups/$(date +\%Y-\%m-\%d)# Silent Guardian – Complete Technical Reference & Operational Guide

> This document contains everything you need to know about the Silent Guardian ecosystem: architecture, component interactions, how to build and deploy all parts, security, monitoring, backup, troubleshooting, and a detailed breakdown of **operational costs**. No file trees – just clear, actionable information.

---

## 1. What Silent Guardian Does

Silent Guardian is an end‑to‑end platform that combines:

- **Device tracking** – GPS, BLE beacon, SMS trigger (Android client app).
- **Workforce management** – fingerprint attendance, hourly location checks, referral marketing, commission tracking (employee Android app).
- **Corporate administration** – user/device/employee management, geofencing, live chat, audit logs, reports (admin Android app + web portal).
- **Monetisation** – subscription plans with crypto payments (USDT) and automatic commission for employees.

All components talk to a central Kotlin/Spring Boot backend. The same backend serves the web portal and all three Android apps.

---

## 2. Core Components Explained

### 2.1 Backend (Kotlin + Spring Boot WebFlux)
- **Role**: Handles all business logic, authentication, data persistence, and real‑time events.
- **Database**: MongoDB (stores users, devices, locations, subscriptions, employees, commissions, geofences, etc.).
- **Cache**: Redis (for sessions and temporary data).
- **External APIs**: TRON/BSC blockchain for USDT payment verification; email SMTP; Firebase Cloud Messaging (FCM) for push notifications.
- **Real‑time**: WebSocket server for admin chat.

### 2.2 Frontend Web Portal (React + Vite)
- **Client area**: Users log in, view their devices, see location history, submit KYC, buy subscriptions.
- **Admin area**: Full management dashboard with statistics, user/device/employee CRUD, geofence creation, live chat, reports.

### 2.3 Android Client App
- Installed on devices that need to be tracked.
- Sends GPS location every few minutes (interval depends on subscription plan).
- Advertises a BLE beacon (useful for proximity detection).
- Listens for SMS with the keyword `SILENTGUARDIAN` → responds with current location.
- Enforces one device per user – backend rejects second registrations.

### 2.4 Android Employee App
- For field agents. Uses biometric (fingerprint) for attendance.
- Records CHECK_IN, CHECK_OUT, and hourly FIELD_CHECK with location.
- Generates a unique referral link; when a new user registers via that link and buys a subscription, the employee earns 30% commission.
- Shows commissions earned and total referrals.
- Receives push notifications (FCM) when admin deactivates the account.

### 2.5 Android Admin App
- Full mobile management console.
- Dashboard with real‑time charts (users, devices, activity).
- Manage users (approve KYC, delete).
- Manage devices (mark as stolen/active).
- Manage employees (view performance, deactivate employee app).
- Create and delete geofences (circle or polygon).
- Live chat with employees (WebSocket).
- Generate reports and view audit logs.

---

## 3. How Components Work Together

- All Android apps and the web portal **call the same backend API** over HTTPS.
- The admin portal (both web and Android) also maintains a **WebSocket connection** to the backend for live chat.
- When an admin marks a device as stolen, the backend updates the `devices` collection; the client app next time it sends location will receive a push notification (via FCM) and can increase tracking frequency.
- When an admin deactivates an employee, the backend sets `appActive = false` and sends an FCM push to that employee’s device, which triggers a logout.
- Subscription expiry is checked daily by a background scheduler; users with expired subscriptions cannot send locations.

---

## 4. Building and Deploying the System

### 4.1 Local Development Setup

**Prerequisites:** Java 17, Node.js 18+, MongoDB, Redis, Android Studio.

**Steps:**
1. Clone the project repository.
2. Start MongoDB and Redis locally (use `mongod` and `redis-server`).
3. Backend: create `.env` from `.env.example`, then `./gradlew bootRun` – runs on port 5000.
4. Frontend: `npm install && npm run dev` – runs on port 5173, proxies `/api` to backend.
5. Android apps: open each in Android Studio, update the API base URL to `http://your-local-ip:5000`, build and install on devices.

### 4.2 Production Deployment

#### Backend (VPS recommendation)
- Provision Ubuntu 22.04 VPS (e.g., DigitalOcean, AWS Lightsail, Linode).
- Install Java 17, MongoDB, Redis, Nginx.
- Upload the built JAR (from `./gradlew build`) and the `.env` file.
- Create a systemd service to keep it running.
- Configure Nginx as reverse proxy with SSL (Let’s Encrypt).

**Cost estimate (minimum):** $6‑12/month for a small VPS (1‑2 GB RAM) + free tier MongoDB/Redis if self‑hosted.

#### Frontend (static hosting)
- Build frontend: `npm run build` → `dist/` folder.
- Deploy to **Vercel** (free tier) or **Netlify** (free tier) or **Nginx on the same VPS**.
- If self‑hosted, add a second Nginx server block for the frontend domain.

**Cost:** free (Vercel/Netlify) or included in VPS cost.

#### Android Apps
- Build signed release APKs (as described in section 5).
- Distribute via direct download (website) or upload to Google Play (one‑time $25 fee per app).
- Update API base URL to `https://api.yourdomain.com` before building.

**Cost:** $0 if direct download; $25 per app if published on Google Play.

---

## 5. Operational Costs Breakdown

| Item | Estimated Monthly Cost (USD) | Notes |
|------|------------------------------|-------|
| **VPS (backend + database)** | $10 – $20 | 2‑4 GB RAM, 2 vCPUs, 50 GB SSD (e.g., DigitalOcean, Vultr). Self‑hosted MongoDB/Redis included. |
| **Domain name** | $0 – $15 | Yearly cost divided by 12. Use cheap `.com` or free `.tk`. |
| **SSL certificate** | $0 | Let’s Encrypt free. |
| **Frontend hosting (Vercel/Netlify)** | $0 | Free tier sufficient for moderate traffic. |
| **Google Play Developer account** | $25 (one‑time) | Per app, but you can publish three apps under one account. |
| **Firebase Cloud Messaging** | $0 | Free for push notifications. |
| **Email SMTP (e.g., SendGrid)** | $0 – $15 | Free tier (100 emails/day) may be enough; upgrade if needed. |
| **Blockchain API (TRON/BSC)** | $0 | Public APIs are free but rate‑limited. For high volume, consider paid plans (~$50/month). |
| **Backup storage (e.g., AWS S3)** | $1 – $5 | For daily MongoDB dumps (few GB). |
| **Monitoring (UptimeRobot)** | $0 | Free plan checks every 5 minutes. |
| **Total minimum** | ~ $15 – $30 per month | Excluding one‑time Google Play fees. |

For a small to medium deployment (a few hundred devices), this cost is realistic. As traffic grows, you may need to scale the VPS or move to managed databases (MongoDB Atlas ~$15/month, Redis Cloud ~$10/month), increasing total to $50‑80/month.

---

## 6. Security & Privacy

- **Data in transit:** All communication is over HTTPS/WSS. Backend Nginx enforces TLS 1.2/1.3.
- **Authentication:** JWT with short‑lived access tokens (7 days) and refresh tokens (30 days). Passwords hashed with BCrypt.
- **Role‑based access:** Endpoints are protected by `@PreAuthorize`; admins have separate privileges.
- **Database:** MongoDB bound to localhost; authentication enabled (create admin user).
- **API rate limiting:** Implement via Nginx `limit_req` zone to prevent abuse.
- **Android apps:** ProGuard obfuscation; no hardcoded secrets.
- **GDPR compliance:** If serving EU users, you must:
  - Obtain explicit consent for location tracking.
  - Provide a way to delete personal data (endpoint `/api/v1/user/delete` – you can add it).
  - Keep audit logs for no longer than 30 days.

---

## 7. Monitoring & Maintenance

### 7.1 Health Checks
- Backend exposes `/health` – monitor with **UptimeRobot** (free) or **Better Stack**.
- Set up alerts for downtime.

### 7.2 Logs
- Backend logs: `sudo journalctl -u silent-guardian -f` (systemd).
- MongoDB logs: `/var/log/mongodb/mongod.log`.
- Redis logs: `journalctl -u redis`.

### 7.3 Regular Tasks
- **Daily** – backup MongoDB (see section 8).
- **Weekly** – check disk space and log rotation.
- **Monthly** – review audit logs for suspicious activity; update dependencies (backend, frontend, Android).

### 7.4 Scaling Tips
- If the number of devices exceeds 1,000, consider:
  - Moving MongoDB to a separate server or use MongoDB Atlas.
  - Adding a second backend instance behind a load balancer.
  - Using a dedicated Redis instance for caching.

---# Silent Guardian – Complete Technical Reference & Operational Guide

> This document contains everything you need to know about the Silent Guardian ecosystem: architecture, component interactions, how to build and deploy all parts, security, monitoring, backup, troubleshooting, and a detailed breakdown of **operational costs**. No file trees – just clear, actionable information.

---

## 1. What Silent Guardian Does

Silent Guardian is an end‑to‑end platform that combines:

- **Device tracking** – GPS, BLE beacon, SMS trigger (Android client app).
- **Workforce management** – fingerprint attendance, hourly location checks, referral marketing, commission tracking (employee Android app).
- **Corporate administration** – user/device/employee management, geofencing, live chat, audit logs, reports (admin Android app + web portal).
- **Monetisation** – subscription plans with crypto payments (USDT) and automatic commission for employees.

All components talk to a central Kotlin/Spring Boot backend. The same backend serves the web portal and all three Android apps.

---

## 2. Core Components Explained

### 2.1 Backend (Kotlin + Spring Boot WebFlux)
- **Role**: Handles all business logic, authentication, data persistence, and real‑time events.
- **Database**: MongoDB (stores users, devices, locations, subscriptions, employees, commissions, geofences, etc.).
- **Cache**: Redis (for sessions and temporary data).
- **External APIs**: TRON/BSC blockchain for USDT payment verification; email SMTP; Firebase Cloud Messaging (FCM) for push notifications.
- **Real‑time**: WebSocket server for admin chat.

### 2.2 Frontend Web Portal (React + Vite)
- **Client area**: Users log in, view their devices, see location history, submit KYC, buy subscriptions.
- **Admin area**: Full management dashboard with statistics, user/device/employee CRUD, geofence creation, live chat, reports.

### 2.3 Android Client App
- Installed on devices that need to be tracked.
- Sends GPS location every few minutes (interval depends on subscription plan).
- Advertises a BLE beacon (useful for proximity detection).
- Listens for SMS with the keyword `SILENTGUARDIAN` → responds with current location.
- Enforces one device per user – backend rejects second registrations.

### 2.4 Android Employee App
- For field agents. Uses biometric (fingerprint) for attendance.
- Records CHECK_IN, CHECK_OUT, and hourly FIELD_CHECK with location.
- Generates a unique referral link; when a new user registers via that link and buys a subscription, the employee earns 30% commission.
- Shows commissions earned and total referrals.
- Receives push notifications (FCM) when admin deactivates the account.

### 2.5 Android Admin App
- Full mobile management console.
- Dashboard with real‑time charts (users, devices, activity).
- Manage users (approve KYC, delete).
- Manage devices (mark as stolen/active).
- Manage employees (view performance, deactivate employee app).
- Create and delete geofences (circle or polygon).
- Live chat with employees (WebSocket).
- Generate reports and view audit logs.

---

## 3. How Components Work Together

- All Android apps and the web portal **call the same backend API** over HTTPS.
- The admin portal (both web and Android) also maintains a **WebSocket connection** to the backend for live chat.
- When an admin marks a device as stolen, the backend updates the `devices` collection; the client app next time it sends location will receive a push notification (via FCM) and can increase tracking frequency.
- When an admin deactivates an employee, the backend sets `appActive = false` and sends an FCM push to that employee’s device, which triggers a logout.
- Subscription expiry is checked daily by a background scheduler; users with expired subscriptions cannot send locations.

---

## 4. Building and Deploying the System

### 4.1 Local Development Setup

**Prerequisites:** Java 17, Node.js 18+, MongoDB, Redis, Android Studio.

**Steps:**
1. Clone the project repository.
2. Start MongoDB and Redis locally (use `mongod` and `redis-server`).
3. Backend: create `.env` from `.env.example`, then `./gradlew bootRun` – runs on port 5000.
4. Frontend: `npm install && npm run dev` – runs on port 5173, proxies `/api` to backend.
5. Android apps: open each in Android Studio, update the API base URL to `http://your-local-ip:5000`, build and install on devices.

### 4.2 Production Deployment

#### Backend (VPS recommendation)
- Provision Ubuntu 22.04 VPS (e.g., DigitalOcean, AWS Lightsail, Linode).
- Install Java 17, MongoDB, Redis, Nginx.
- Upload the built JAR (from `./gradlew build`) and the `.env` file.
- Create a systemd service to keep it running.
- Configure Nginx as reverse proxy with SSL (Let’s Encrypt).

**Cost estimate (minimum):** $6‑12/month for a small VPS (1‑2 GB RAM) + free tier MongoDB/Redis if self‑hosted.

#### Frontend (static hosting)
- Build frontend: `npm run build` → `dist/` folder.
- Deploy to **Vercel** (free tier) or **Netlify** (free tier) or **Nginx on the same VPS**.
- If self‑hosted, add a second Nginx server block for the frontend domain.

**Cost:** free (Vercel/Netlify) or included in VPS cost.

#### Android Apps
- Build signed release APKs (as described in section 5).
- Distribute via direct download (website) or upload to Google Play (one‑time $25 fee per app).
- Update API base URL to `https://api.yourdomain.com` before building.

**Cost:** $0 if direct download; $25 per app if published on Google Play.

---

## 5. Operational Costs Breakdown

| Item | Estimated Monthly Cost (USD) | Notes |
|------|------------------------------|-------|
| **VPS (backend + database)** | $10 – $20 | 2‑4 GB RAM, 2 vCPUs, 50 GB SSD (e.g., DigitalOcean, Vultr). Self‑hosted MongoDB/Redis included. |
| **Domain name** | $0 – $15 | Yearly cost divided by 12. Use cheap `.com` or free `.tk`. |
| **SSL certificate** | $0 | Let’s Encrypt free. |
| **Frontend hosting (Vercel/Netlify)** | $0 | Free tier sufficient for moderate traffic. |
| **Google Play Developer account** | $25 (one‑time) | Per app, but you can publish three apps under one account. |
| **Firebase Cloud Messaging** | $0 | Free for push notifications. |
| **Email SMTP (e.g., SendGrid)** | $0 – $15 | Free tier (100 emails/day) may be enough; upgrade if needed. |
| **Blockchain API (TRON/BSC)** | $0 | Public APIs are free but rate‑limited. For high volume, consider paid plans (~$50/month). |
| **Backup storage (e.g., AWS S3)** | $1 – $5 | For daily MongoDB dumps (few GB). |
| **Monitoring (UptimeRobot)** | $0 | Free plan checks every 5 minutes. |
| **Total minimum** | ~ $15 – $30 per month | Excluding one‑time Google Play fees. |

For a small to medium deployment (a few hundred devices), this cost is realistic. As traffic grows, you may need to scale the VPS or move to managed databases (MongoDB Atlas ~$15/month, Redis Cloud ~$10/month), increasing total to $50‑80/month.

---

## 6. Security & Privacy

- **Data in transit:** All communication is over HTTPS/WSS. Backend Nginx enforces TLS 1.2/1.3.
- **Authentication:** JWT with short‑lived access tokens (7 days) and refresh tokens (30 days). Passwords hashed with BCrypt.
- **Role‑based access:** Endpoints are protected by `@PreAuthorize`; admins have separate privileges.
- **Database:** MongoDB bound to localhost; authentication enabled (create admin user).
- **API rate limiting:** Implement via Nginx `limit_req` zone to prevent abuse.
- **Android apps:** ProGuard obfuscation; no hardcoded secrets.
- **GDPR compliance:** If serving EU users, you must:
  - Obtain explicit consent for location tracking.
  - Provide a way to delete personal data (endpoint `/api/v1/user/delete` – you can add it).
  - Keep audit logs for no longer than 30 days.

---

## 7. Monitoring & Maintenance

### 7.1 Health Checks
- Backend exposes `/health` – monitor with **UptimeRobot** (free) or **Better Stack**.
- Set up alerts for downtime.

### 7.2 Logs
- Backend logs: `sudo journalctl -u silent-guardian -f` (systemd).
- MongoDB logs: `/var/log/mongodb/mongod.log`.
- Redis logs: `journalctl -u redis`.

### 7.3 Regular Tasks
- **Daily** – backup MongoDB (see section 8).
- **Weekly** – check disk space and log rotation.
- **Monthly** – review audit logs for suspicious activity; update dependencies (backend, frontend, Android).

### 7.4 Scaling Tips
- If the number of devices exceeds 1,000, consider:
  - Moving MongoDB to a separate server or use MongoDB Atlas.
  - Adding a second backend instance behind a load balancer.
  - Using a dedicated Redis instance for caching.

---

## 8. Backup & Disaster Recovery

### 8.1 Automated MongoDB Backup
Create a cron job on the VPS (e.g., daily at 2 AM):

```bash
0 2 * * * mongodump --uri="mongodb://localhost:27017/silentguardian" --out=/backups/$(date +\%Y-\%m-\%d) && tar -czf /backups/backup-$(date +\%Y-\%m-\%d).tar.gz /backups/$(date +\%Y-\%m-\%d) && rm -rf /backups/$(date +\%Y-\%m-\%d)

## 8. Backup & Disaster Recovery

### 8.1 Automated MongoDB Backup
Create a cron job on the VPS (e.g., daily at 2 AM):

```bash
0 2 * * * mongodump --uri="mongodb://localhost:27017/silentguardian" --out=/backups/$(date +\%Y-\%m-\%d) && tar -czf /backups/backup-$(date +\%Y-\%m-\%d).tar.gz /backups/$(date +\%Y-\%m-\%d) && rm -rf /backups/$(date +\%Y-\%m-\%d)

- **Device tracking** – GPS, BLE beacon, SMS trigger (Android client app).
- **Workforce management** – fingerprint attendance, hourly location checks, referral marketing, commission tracking (employee Android app).
- **Corporate administration** – user/device/employee management, geofencing, live chat, audit logs, reports (admin Android app + web portal).
- **Monetisation** – subscription plans with crypto payments (USDT) and automatic commission for employees.

All components talk to a central Kotlin/Spring Boot backend. The same backend serves the web portal and all three Android apps.

---

## 2. Core Components Explained

### 2.1 Backend (Kotlin + Spring Boot WebFlux)
- **Role**: Handles all business logic, authentication, data persistence, and real‑time events.
- **Database**: MongoDB (stores users, devices, locations, subscriptions, employees, commissions, geofences, etc.).
- **Cache**: Redis (for sessions and temporary data).
- **External APIs**: TRON/BSC blockchain for USDT payment verification; email SMTP; Firebase Cloud Messaging (FCM) for push notifications.
- **Real‑time**: WebSocket server for admin chat.

### 2.2 Frontend Web Portal (React + Vite)
- **Client area**: Users log in, view their devices, see location history, submit KYC, buy subscriptions.
- **Admin area**: Full management dashboard with statistics, user/device/employee CRUD, geofence creation, live chat, reports.

### 2.3 Android Client App
- Installed on devices that need to be tracked.
- Sends GPS location every few minutes (interval depends on subscription plan).
- Advertises a BLE beacon (useful for proximity detection).
- Listens for SMS with the keyword `SILENTGUARDIAN` → responds with current location.
- Enforces one device per user – backend rejects second registrations.

### 2.4 Android Employee App
- For field agents. Uses biometric (fingerprint) for attendance.
- Records CHECK_IN, CHECK_OUT, and hourly FIELD_CHECK with location.
- Generates a unique referral link; when a new user registers via that link and buys a subscription, the employee earns 30% commission.
- Shows commissions earned and total referrals.
- Receives push notifications (FCM) when admin deactivates the account.

### 2.5 Android Admin App
- Full mobile management console.
- Dashboard with real‑time charts (users, devices, activity).
- Manage users (approve KYC, delete).
- Manage devices (mark as stolen/active).
- Manage employees (view performance, deactivate employee app).
- Create and delete geofences (circle or polygon).
- Live chat with employees (WebSocket).
- Generate reports and view audit logs.

---

## 3. How Components Work Together

- All Android apps and the web portal **call the same backend API** over HTTPS.
- The admin portal (both web and Android) also maintains a **WebSocket connection** to the backend for live chat.
- When an admin marks a device as stolen, the backend updates the `devices` collection; the client app next time it sends location will receive a push notification (via FCM) and can increase tracking frequency.
- When an admin deactivates an employee, the backend sets `appActive = false` and sends an FCM push to that employee’s device, which triggers a logout.
- Subscription expiry is checked daily by a background scheduler; users with expired subscriptions cannot send locations.

---

## 4. Building and Deploying the System

### 4.1 Local Development Setup

**Prerequisites:** Java 17, Node.js 18+, MongoDB, Redis, Android Studio.

**Steps:**
1. Clone the project repository.
2. Start MongoDB and Redis locally (use `mongod` and `redis-server`).
3. Backend: create `.env` from `.env.example`, then `./gradlew bootRun` – runs on port 5000.
4. Frontend: `npm install && npm run dev` – runs on port 5173, proxies `/api` to backend.
5. Android apps: open each in Android Studio, update the API base URL to `http://your-local-ip:5000`, build and install on devices.

### 4.2 Production Deployment

#### Backend (VPS recommendation)
- Provision Ubuntu 22.04 VPS (e.g., DigitalOcean, AWS Lightsail, Linode).
- Install Java 17, MongoDB, Redis, Nginx.
- Upload the built JAR (from `./gradlew build`) and the `.env` file.
- Create a systemd service to keep it running.
- Configure Nginx as reverse proxy with SSL (Let’s Encrypt).

**Cost estimate (minimum):** $6‑12/month for a small VPS (1‑2 GB RAM) + free tier MongoDB/Redis if self‑hosted.

#### Frontend (static hosting)
- Build frontend: `npm run build` → `dist/` folder.
- Deploy to **Vercel** (free tier) or **Netlify** (free tier) or **Nginx on the same VPS**.
- If self‑hosted, add a second Nginx server block for the frontend domain.

**Cost:** free (Vercel/Netlify) or included in VPS cost.

#### Android Apps
- Build signed release APKs (as described in section 5).
- Distribute via direct download (website) or upload to Google Play (one‑time $25 fee per app).
- Update API base URL to `https://api.yourdomain.com` before building.

**Cost:** $0 if direct download; $25 per app if published on Google Play.

---

## 5. Operational Costs Breakdown

| Item | Estimated Monthly Cost (USD) | Notes |
|------|------------------------------|-------|
| **VPS (backend + database)** | $10 – $20 | 2‑4 GB RAM, 2 vCPUs, 50 GB SSD (e.g., DigitalOcean, Vultr). Self‑hosted MongoDB/Redis included. |
| **Domain name** | $0 – $15 | Yearly cost divided by 12. Use cheap `.com` or free `.tk`. |
| **SSL certificate** | $0 | Let’s Encrypt free. |
| **Frontend hosting (Vercel/Netlify)** | $0 | Free tier sufficient for moderate traffic. |
| **Google Play Developer account** | $25 (one‑time) | Per app, but you can publish three apps under one account. |
| **Firebase Cloud Messaging** | $0 | Free for push notifications. |
| **Email SMTP (e.g., SendGrid)** | $0 – $15 | Free tier (100 emails/day) may be enough; upgrade if needed. |
| **Blockchain API (TRON/BSC)** | $0 | Public APIs are free but rate‑limited. For high volume, consider paid plans (~$50/month). |
| **Backup storage (e.g., AWS S3)** | $1 – $5 | For daily MongoDB dumps (few GB). |
| **Monitoring (UptimeRobot)** | $0 | Free plan checks every 5 minutes. |
| **Total minimum** | ~ $15 – $30 per month | Excluding one‑time Google Play fees. |

For a small to medium deployment (a few hundred devices), this cost is realistic. As traffic grows, you may need to scale the VPS or move to managed databases (MongoDB Atlas ~$15/month, Redis Cloud ~$10/month), increasing total to $50‑80/month.

---

## 6. Security & Privacy

- **Data in transit:** All communication is over HTTPS/WSS. Backend Nginx enforces TLS 1.2/1.3.
- **Authentication:** JWT with short‑lived access tokens (7 days) and refresh tokens (30 days). Passwords hashed with BCrypt.
- **Role‑based access:** Endpoints are protected by `@PreAuthorize`; admins have separate privileges.
- **Database:** MongoDB bound to localhost; authentication enabled (create admin user).
- **API rate limiting:** Implement via Nginx `limit_req` zone to prevent abuse.
- **Android apps:** ProGuard obfuscation; no hardcoded secrets.
- **GDPR compliance:** If serving EU users, you must:
  - Obtain explicit consent for location tracking.
  - Provide a way to delete personal data (endpoint `/api/v1/user/delete` – you can add it).
  - Keep audit logs for no longer than 30 days.

---

## 7. Monitoring & Maintenance

### 7.1 Health Checks
- Backend exposes `/health` – monitor with **UptimeRobot** (free) or **Better Stack**.
- Set up alerts for downtime.

### 7.2 Logs
- Backend logs: `sudo journalctl -u silent-guardian -f` (systemd).
- MongoDB logs: `/var/log/mongodb/mongod.log`.
- Redis logs: `journalctl -u redis`.

### 7.3 Regular Tasks
- **Daily** – backup MongoDB (see section 8).
- **Weekly** – check disk space and log rotation.
- **Monthly** – review audit logs for suspicious activity; update dependencies (backend, frontend, Android).

### 7.4 Scaling Tips
- If the number of devices exceeds 1,000, consider:
  - Moving MongoDB to a separate server or use MongoDB Atlas.
  - Adding a second backend instance behind a load balancer.
  - Using a dedicated Redis instance for caching.

---

## 8. Backup & Disaster Recovery

### 8.1 Automated MongoDB Backup# Silent Guardian – Complete Technical Reference & Operational Guide

> This document contains everything you need to know about the Silent Guardian ecosystem: architecture, component interactions, how to build and deploy all parts, security, monitoring, backup, troubleshooting, and a detailed breakdown of **operational costs**. No file trees – just clear, actionable information.

---

## 1. What Silent Guardian Does

Silent Guardian is an end‑to‑end platform that combines:

- **Device tracking** – GPS, BLE beacon, SMS trigger (Android client app).
- **Workforce management** – fingerprint attendance, hourly location checks, referral marketing, commission tracking (employee Android app).
- **Corporate administration** – user/device/employee management, geofencing, live chat, audit logs, reports (admin Android app + web portal).
- **Monetisation** – subscription plans with crypto payments (USDT) and automatic commission for employees.

All components talk to a central Kotlin/Spring Boot backend. The same backend serves the web portal and all three Android apps.

---

## 2. Core Components Explained

### 2.1 Backend (Kotlin + Spring Boot WebFlux)
- **Role**: Handles all business logic, authentication, data persistence, and real‑time events.
- **Database**: MongoDB (stores users, devices, locations, subscriptions, employees, commissions, geofences, etc.).
- **Cache**: Redis (for sessions and temporary data).
- **External APIs**: TRON/BSC blockchain for USDT payment verification; email SMTP; Firebase Cloud Messaging (FCM) for push notifications.
- **Real‑time**: WebSocket server for admin chat.

### 2.2 Frontend Web Portal (React + Vite)
- **Client area**: Users log in, view their devices, see location history, submit KYC, buy subscriptions.
- **Admin area**: Full management dashboard with statistics, user/device/employee CRUD, geofence creation, live chat, reports.

### 2.3 Android Client App
- Installed on devices that need to be tracked.
- Sends GPS location every few minutes (interval depends on subscription plan).
- Advertises a BLE beacon (useful for proximity detection).
- Listens for SMS with the keyword `SILENTGUARDIAN` → responds with current location.
- Enforces one device per user – backend rejects second registrations.

### 2.4 Android Employee App
- For field agents. Uses biometric (fingerprint) for attendance.
- Records CHECK_IN, CHECK_OUT, and hourly FIELD_CHECK with location.
- Generates a unique referral link; when a new user registers via that link and buys a subscription, the employee earns 30% commission.
- Shows commissions earned and total referrals.
- Receives push notifications (FCM) when admin deactivates the account.

### 2.5 Android Admin App
- Full mobile management console.
- Dashboard with real‑time charts (users, devices, activity).
- Manage users (approve KYC, delete).
- Manage devices (mark as stolen/active).
- Manage employees (view performance, deactivate employee app).
- Create and delete geofences (circle or polygon).
- Live chat with employees (WebSocket).
- Generate reports and view audit logs.

---

## 3. How Components Work Together

- All Android apps and the web portal **call the same backend API** over HTTPS.
- The admin portal (both web and Android) also maintains a **WebSocket connection** to the backend for live chat.
- When an admin marks a device as stolen, the backend updates the `devices` collection; the client app next time it sends location will receive a push notification (via FCM) and can increase tracking frequency.
- When an admin deactivates an employee, the backend sets `appActive = false` and sends an FCM push to that employee’s device, which triggers a logout.
- Subscription expiry is checked daily by a background scheduler; users with expired subscriptions cannot send locations.

---

## 4. Building and Deploying the System

### 4.1 Local Development Setup

**Prerequisites:** Java 17, Node.js 18+, MongoDB, Redis, Android Studio.

**Steps:**
1. Clone the project repository.
2. Start MongoDB and Redis locally (use `mongod` and `redis-server`).
3. Backend: create `.env` from `.env.example`, then `./gradlew bootRun` – runs on port 5000.
4. Frontend: `npm install && npm run dev` – runs on port 5173, proxies `/api` to backend.
5. Android apps: open each in Android Studio, update the API base URL to `http://your-local-ip:5000`, build and install on devices.

### 4.2 Production Deployment

#### Backend (VPS recommendation)
- Provision Ubuntu 22.04 VPS (e.g., DigitalOcean, AWS Lightsail, Linode).
- Install Java 17, MongoDB, Redis, Nginx.
- Upload the built JAR (from `./gradlew build`) and the `.env` file.
- Create a systemd service to keep it running.
- Configure Nginx as reverse proxy with SSL (Let’s Encrypt).

**Cost estimate (minimum):** $6‑12/month for a small VPS (1‑2 GB RAM) + free tier MongoDB/Redis if self‑hosted.

#### Frontend (static hosting)
- Build frontend: `npm run build` → `dist/` folder.
- Deploy to **Vercel** (free tier) or **Netlify** (free tier) or **Nginx on the same VPS**.
- If self‑hosted, add a second Nginx server block for the frontend domain.

**Cost:** free (Vercel/Netlify) or included in VPS cost.

#### Android Apps
- Build signed release APKs (as described in section 5).
- Distribute via direct download (website) or upload to Google Play (one‑time $25 fee per app).
- Update API base URL to `https://api.yourdomain.com` before building.

**Cost:** $0 if direct download; $25 per app if published on Google Play.

---

## 5. Operational Costs Breakdown

| Item | Estimated Monthly Cost (USD) | Notes |
|------|------------------------------|-------|
| **VPS (backend + database)** | $10 – $20 | 2‑4 GB RAM, 2 vCPUs, 50 GB SSD (e.g., DigitalOcean, Vultr). Self‑hosted MongoDB/Redis included. |
| **Domain name** | $0 – $15 | Yearly cost divided by 12. Use cheap `.com` or free `.tk`. |
| **SSL certificate** | $0 | Let’s Encrypt free. |
| **Frontend hosting (Vercel/Netlify)** | $0 | Free tier sufficient for moderate traffic. |
| **Google Play Developer account** | $25 (one‑time) | Per app, but you can publish three apps under one account. |
| **Firebase Cloud Messaging** | $0 | Free for push notifications. |
| **Email SMTP (e.g., SendGrid)** | $0 – $15 | Free tier (100 emails/day) may be enough; upgrade if needed. |
| **Blockchain API (TRON/BSC)** | $0 | Public APIs are free but rate‑limited. For high volume, consider paid plans (~$50/month). |
| **Backup storage (e.g., AWS S3)** | $1 – $5 | For daily MongoDB dumps (few GB). |
| **Monitoring (UptimeRobot)** | $0 | Free plan checks every 5 minutes. |
| **Total minimum** | ~ $15 – $30 per month | Excluding one‑time Google Play fees. |

For a small to medium deployment (a few hundred devices), this cost is realistic. As traffic grows, you may need to scale the VPS or move to managed databases (MongoDB Atlas ~$15/month, Redis Cloud ~$10/month), increasing total to $50‑80/month.

---

## 6. Security & Privacy

- **Data in transit:** All communication is over HTTPS/WSS. Backend Nginx enforces TLS 1.2/1.3.
- **Authentication:** JWT with short‑lived access tokens (7 days) and refresh tokens (30 days). Passwords hashed with BCrypt.
- **Role‑based access:** Endpoints are protected by `@PreAuthorize`; admins have separate privileges.
- **Database:** MongoDB bound to localhost; authentication enabled (create admin user).
- **API rate limiting:** Implement via Nginx `limit_req` zone to prevent abuse.
- **Android apps:** ProGuard obfuscation; no hardcoded secrets.
- **GDPR compliance:** If serving EU users, you must:
  - Obtain explicit consent for location tracking.
  - Provide a way to delete personal data (endpoint `/api/v1/user/delete` – you can add it).
  - Keep audit logs for no longer than 30 days.

---

## 7. Monitoring & Maintenance

### 7.1 Health Checks
- Backend exposes `/health` – monitor with **UptimeRobot** (free) or **Better Stack**.
- Set up alerts for downtime.

### 7.2 Logs
- Backend logs: `sudo journalctl -u silent-guardian -f` (systemd).
- MongoDB logs: `/var/log/mongodb/mongod.log`.
- Redis logs: `journalctl -u redis`.

### 7.3 Regular Tasks
- **Daily** – backup MongoDB (see section 8).
- **Weekly** – check disk space and log rotation.
- **Monthly** – review audit logs for suspicious activity; update dependencies (backend, frontend, Android).

### 7.4 Scaling Tips
- If the number of devices exceeds 1,000, consider:
  - Moving MongoDB to a separate server or use MongoDB Atlas.
  - Adding a second backend instance behind a load balancer.
  - Using a dedicated Redis instance for caching.

---

## 8. Backup & Disaster Recovery

### 8.1 Automated MongoDB Backup
Create a cron job on the VPS (e.g., daily at 2 AM):

```bash
0 2 * * * mongodump --uri="mongodb://localhost:27017/silentguardian" --out=/backups/$(date +\%Y-\%m-\%d) && tar -czf /backups/backup-$(date +\%Y-\%m-\%d).tar.gz /backups/$(date +\%Y-\%m-\%d) && rm -rf /backups/$(date +\%Y-\%m-\%d)
Create a cron job on the VPS (e.g., daily at 2 AM):

```bash
0 2 * * * mongodump --uri="mongodb://localhost:27017/silentguardian" --out=/backups/$(date +\%Y-\%m-\%d) && tar -czf /backups/backup-$(date +\%Y-\%m-\%d).tar.gz /backups/$(date +\%Y-\%m-\%d) && rm -rf /backups/$(date +\%Y-\%m-\%d)
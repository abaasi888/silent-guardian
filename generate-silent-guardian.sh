#!/bin/bash

# =============================================================================
# Silent Guardian - Complete Multi-Platform Project Generator
# Includes: Backend (Python/FastAPI), Frontend (React), 
#           Tracking App (Android/Kotlin), Employee App (Android/Kotlin)
# 
# Run: chmod +x generate-silent-guardian-complete.sh && ./generate-silent-guardian-complete.sh
# =============================================================================

set -e

PROJECT_ROOT="silent-guardian-complete"
echo "🚀 Generating Complete Silent Guardian Project in: $PROJECT_ROOT"
mkdir -p "$PROJECT_ROOT"
cd "$PROJECT_ROOT"

# -----------------------------------------------------------------------------
# 1. Create directory structure
# -----------------------------------------------------------------------------
mkdir -p {backend-python,frontend,android/tracking_app,android-employee/employee_app,infrastructure/docker,docs,scripts}

# -----------------------------------------------------------------------------
# 2. BACKEND (Python/FastAPI) - Based on your existing backend-python
# -----------------------------------------------------------------------------
echo "🐍 Creating Python Backend with FastAPI..."

mkdir -p backend-python/app/{routers,services,utils,models}
mkdir -p backend-python/app/routers/__pycache__

# Requirements
cat > backend-python/requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-dotenv==1.0.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
websockets==12.0
motor==3.3.2
pymongo==4.5.0
redis==5.0.1
celery==5.3.4
httpx==0.25.1
pydantic==2.5.0
pydantic-settings==2.1.0
email-validator==2.1.0
aiofiles==23.2.1
pyjwt==2.8.0
bcrypt==4.1.2
EOF

# Main application
cat > backend-python/main.py << 'EOF'
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import auth, devices, employees, admin, imei, payments, subscriptions, alerts, reports, chat, commands, users, upload
from app.websocket import websocket_endpoint

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up...")
    await connect_to_mongo()
    yield
    # Shutdown
    logger.info("Shutting down...")
    await close_mongo_connection()

app = FastAPI(
    title="Silent Guardian API",
    description="Complete Tracking & Employee Management System",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://10.0.2.2:3000",
        "http://10.0.2.2:5173",
        "http://192.168.*.*:3000",
        "http://192.168.*.*:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]
)

# WebSocket
app.add_api_websocket_route("/ws", websocket_endpoint)

# API Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(devices.router, prefix="/api/devices", tags=["Devices"])
app.include_router(employees.router, prefix="/api/employees", tags=["Employees"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(imei.router, prefix="/api/imei", tags=["IMEI Management"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["Subscriptions"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(commands.router, prefix="/api/commands", tags=["Commands"])
app.include_router(upload.router, prefix="/api/upload", tags=["File Upload"])

@app.get("/")
async def root():
    return {"message": "Silent Guardian API", "version": "2.0.0", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
EOF

# Configuration
cat > backend-python/app/config.py << 'EOF'
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "Silent Guardian API"
    DEBUG: bool = True
    API_VERSION: str = "2.0.0"
    
    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "silent_guardian"
    REDIS_URL: str = "redis://localhost:6379"
    
    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://10.0.2.2:3000",
        "http://10.0.2.2:5173",
    ]
    
    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    
    # Admin
    ADMIN_EMAIL: str = "admin@silentguardian.com"
    ADMIN_PASSWORD_HASH: str = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtXKJNQpE5VLS"  # admin123
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
EOF

# Database connection
cat > backend-python/app/database.py << 'EOF'
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, ASCENDING, DESCENDING
import logging
from app.config import settings

logger = logging.getLogger(__name__)
client = None
database = None

async def connect_to_mongo():
    global client, database
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        database = client[settings.MONGODB_DB_NAME]
        
        # Create indexes
        await create_indexes()
        
        logger.info(f"Connected to MongoDB: {settings.MONGODB_DB_NAME}")
        return database
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    global client
    if client:
        client.close()
        logger.info("Closed MongoDB connection")

async def create_indexes():
    # Users collection indexes
    await database.users.create_indexes([
        IndexModel([("email", ASCENDING)], unique=True),
        IndexModel([("deviceId", ASCENDING)]),
        IndexModel([("accountType", ASCENDING)]),
    ])
    
    # Devices collection indexes
    await database.devices.create_indexes([
        IndexModel([("deviceId", ASCENDING)], unique=True),
        IndexModel([("userId", ASCENDING)]),
        IndexModel([("status", ASCENDING)]),
    ])
    
    # Locations collection indexes
    await database.locations.create_indexes([
        IndexModel([("deviceId", ASCENDING), ("timestamp", DESCENDING)]),
        IndexModel([("timestamp", DESCENDING)], expireAfterSeconds=2592000),  # 30 days TTL
    ])
    
    # Employees collection indexes
    await database.employees.create_indexes([
        IndexModel([("inviteCode", ASCENDING)], unique=True),
        IndexModel([("email", ASCENDING)], unique=True),
    ])

def get_database():
    return database
EOF

# Models
cat > backend-python/app/models.py << 'EOF'
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class AccountType(str, Enum):
    ORDINARY = "ordinary"
    CORPORATE = "corporate"
    ADMIN = "admin"
    EMPLOYEE = "employee"

class DeviceStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    STOLEN = "stolen"
    LOST = "lost"

class User(BaseModel):
    id: Optional[str] = None
    fullName: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    accountType: AccountType = AccountType.ORDINARY
    kycStatus: str = "pending"
    isActive: bool = True
    deviceId: Optional[str] = None
    lastLogin: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class Device(BaseModel):
    id: Optional[str] = None
    userId: str
    deviceName: str
    deviceId: str
    deviceType: str = "android"
    status: DeviceStatus = DeviceStatus.INACTIVE
    lastLocation: Optional[dict] = None
    batteryLevel: Optional[int] = None
    lastSeen: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Location(BaseModel):
    id: Optional[str] = None
    deviceId: str
    userId: str
    lat: float
    lng: float
    accuracy: Optional[float] = None
    speed: Optional[float] = None
    batteryLevel: Optional[int] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Employee(BaseModel):
    id: Optional[str] = None
    fullName: str
    email: EmailStr
    phone: str
    inviteCode: str
    role: str = "Sales Agent"
    commissionRate: float = 30.0
    status: str = "pending"  # pending, active, terminated
    joinDate: datetime = Field(default_factory=datetime.utcnow)
    totalSignups: int = 0
    totalCommission: float = 0.0
    approvedBy: Optional[str] = None

class IMEIBlacklist(BaseModel):
    id: Optional[str] = None
    imei: str
    reason: str
    reportedBy: str
    reportedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = True

class Command(BaseModel):
    id: Optional[str] = None
    deviceId: str
    commandType: str  # lock, wipe, locate, alert
    payload: Optional[dict] = None
    status: str = "pending"  # pending, sent, executed, failed
    executedAt: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

# Auth models
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    fullName: str
    email: EmailStr
    phone: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
EOF

# Authentication module
cat > backend-python/app/auth.py << 'EOF'
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = data.copy()
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
EOF

# Routers - Auth
cat > backend-python/app/routers/auth.py << 'EOF'
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from app.auth import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.database import get_database
from app.models import LoginRequest, RegisterRequest, TokenResponse

router = APIRouter()

@router.post("/register", response_model=dict)
async def register(user_data: RegisterRequest):
    db = get_database()
    
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user = {
        "fullName": user_data.fullName,
        "email": user_data.email,
        "phone": user_data.phone,
        "password": hashed_password,
        "accountType": "ordinary",
        "kycStatus": "pending",
        "isActive": True,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user)
    
    return {"message": "User registered successfully", "userId": str(result.inserted_id)}

@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    db = get_database()
    
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update last login
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"lastLogin": datetime.utcnow()}}
    )
    
    # Create tokens
    access_token = create_access_token(
        data={"sub": str(user["_id"]), "email": user["email"], "type": user["accountType"]}
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user["_id"]), "email": user["email"]}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "fullName": user["fullName"],
            "email": user["email"],
            "accountType": user["accountType"]
        }
    }
EOF

# Router - Devices
cat > backend-python/app/routers/devices.py << 'EOF'
from fastapi import APIRouter, HTTPException, Depends, Header
from datetime import datetime
from bson import ObjectId
from app.database import get_database
from app.models import Device, Location
from app.auth import decode_token

router = APIRouter()

@router.post("/register")
async def register_device(device: Device, authorization: str = Header(None)):
    db = get_database()
    
    # Verify token
    token = authorization.replace("Bearer ", "") if authorization else None
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Check if device exists
    existing = await db.devices.find_one({"deviceId": device.deviceId})
    if existing:
        return {"message": "Device already registered", "deviceId": device.deviceId}
    
    # Register device
    device_data = device.dict()
    device_data["userId"] = payload["sub"]
    device_data["createdAt"] = datetime.utcnow()
    
    result = await db.devices.insert_one(device_data)
    
    # Update user with deviceId
    await db.users.update_one(
        {"_id": ObjectId(payload["sub"])},
        {"$set": {"deviceId": device.deviceId}}
    )
    
    return {"message": "Device registered", "deviceId": device.deviceId}

@router.post("/location")
async def update_location(location: Location, authorization: str = Header(None)):
    db = get_database()
    
    token = authorization.replace("Bearer ", "") if authorization else None
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    location_data = location.dict()
    location_data["userId"] = payload["sub"]
    location_data["timestamp"] = datetime.utcnow()
    
    await db.locations.insert_one(location_data)
    
    # Update device last location
    await db.devices.update_one(
        {"deviceId": location.deviceId},
        {"$set": {
            "lastLocation": {"lat": location.lat, "lng": location.lng},
            "lastSeen": datetime.utcnow(),
            "batteryLevel": location.batteryLevel
        }}
    )
    
    return {"message": "Location updated"}

@router.get("/{deviceId}/history")
async def get_location_history(deviceId: str, limit: int = 100):
    db = get_database()
    
    locations = await db.locations.find(
        {"deviceId": deviceId}
    ).sort("timestamp", -1).limit(limit).to_list(length=limit)
    
    return {"locations": locations}
EOF

# Router - Employees
cat > backend-python/app/routers/employees.py << 'EOF'
from fastapi import APIRouter, HTTPException, Depends, Header
from datetime import datetime
import random
import string
from app.database import get_database
from app.auth import decode_token, get_password_hash
from app.models import Employee

router = APIRouter()

def generate_invite_code():
    return "EMP_" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

@router.post("/invite")
async def invite_employee(employee_data: dict, authorization: str = Header(None)):
    db = get_database()
    
    token = authorization.replace("Bearer ", "") if authorization else None
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    payload = decode_token(token)
    if not payload or payload.get("type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    invite_code = generate_invite_code()
    
    employee = {
        "fullName": employee_data.get("fullName", ""),
        "email": employee_data["email"],
        "phone": employee_data["phone"],
        "inviteCode": invite_code,
        "status": "pending",
        "joinDate": datetime.utcnow(),
        "approvedBy": payload["sub"]
    }
    
    await db.employees.insert_one(employee)
    
    return {"inviteCode": invite_code, "message": "Invite generated"}

@router.post("/verify")
async def verify_invite(data: dict):
    db = get_database()
    
    employee = await db.employees.find_one({"inviteCode": data["inviteCode"]})
    if not employee:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    
    if employee["status"] != "pending":
        raise HTTPException(status_code=400, detail="Invite already used")
    
    # Create user account
    hashed_password = get_password_hash(data["password"])
    user = {
        "fullName": data["fullName"],
        "email": employee["email"],
        "phone": employee["phone"],
        "password": hashed_password,
        "accountType": "employee",
        "isActive": True,
        "createdAt": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user)
    
    # Update employee status
    await db.employees.update_one(
        {"_id": employee["_id"]},
        {"$set": {"status": "active", "fullName": data["fullName"]}}
    )
    
    return {"message": "Account created", "userId": str(result.inserted_id)}
EOF

# Router - IMEI Blacklist
cat > backend-python/app/routers/imei.py << 'EOF'
from fastapi import APIRouter, HTTPException, Header
from datetime import datetime
from app.database import get_database
from app.auth import decode_token

router = APIRouter()

@router.post("/blacklist")
async def blacklist_imei(data: dict, authorization: str = Header(None)):
    db = get_database()
    
    token = authorization.replace("Bearer ", "") if authorization else None
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    payload = decode_token(token)
    if not payload or payload.get("type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    imei_entry = {
        "imei": data["imei"],
        "reason": data.get("reason", ""),
        "reportedBy": payload["sub"],
        "reportedAt": datetime.utcnow(),
        "isActive": True
    }
    
    await db.imei_blacklist.insert_one(imei_entry)
    
    return {"message": "IMEI blacklisted"}

@router.get("/blacklist")
async def get_blacklist():
    db = get_database()
    
    blacklist = await db.imei_blacklist.find({"isActive": True}).to_list(length=1000)
    
    return {"blacklist": blacklist}

@router.post("/check/{imei}")
async def check_imei(imei: str):
    db = get_database()
    
    entry = await db.imei_blacklist.find_one({"imei": imei, "isActive": True})
    
    return {"isBlacklisted": entry is not None, "imei": imei}
EOF

# Placeholder routers for other modules
for router_name in admin alerts chat commands payments reports subscriptions upload users:
    cat > backend-python/app/routers/${router_name}.py << EOF
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_${router_name}():
    return {"message": "${router_name} endpoint"}
EOF

# WebSocket
cat > backend-python/app/websocket.py << 'EOF'
from fastapi import WebSocket, WebSocketDisconnect
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.user_connections: dict = {}
    
    async def connect(self, websocket: WebSocket, user_id: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if user_id:
            self.user_connections[user_id] = websocket
        logger.info(f"Client connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket, user_id: str = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id and user_id in self.user_connections:
            del self.user_connections[user_id]
    
    async def send_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            logger.info(f"Received: {message}")
            
            # Echo back
            await manager.send_message({"echo": message}, websocket)
            
            # Broadcast location updates
            if message.get("type") == "location":
                await manager.broadcast({
                    "type": "location_update",
                    "data": message.get("data")
                })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Client disconnected")
EOF

# Create __init__.py files
touch backend-python/app/__init__.py
touch backend-python/app/routers/__init__.py
touch backend-python/app/services/__init__.py
touch backend-python/app/utils/__init__.py

# -----------------------------------------------------------------------------
# 3. FRONTEND (React) - Updated with all features
# -----------------------------------------------------------------------------
echo "🌐 Creating React Frontend..."

mkdir -p frontend/{src/{components,pages,services,admin/{pages,components,styles},utils,context},public}

cat > frontend/package.json << 'EOF'
{
  "name": "silent-guardian-frontend",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.2",
    "socket.io-client": "^4.5.4",
    "recharts": "^2.10.3",
    "date-fns": "^2.30.0",
    "react-hot-toast": "^2.4.1",
    "react-icons": "^4.12.0",
    "@tanstack/react-query": "^5.12.2",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6"
  }
}
EOF

cat > frontend/vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      }
    }
  }
})
EOF

cat > frontend/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#9C27B0",
        secondary: "#FF9800",
        dark: "#1a1a2e",
      }
    },
  },
  plugins: [],
}
EOF

cat > frontend/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gradient-to-br from-gray-50 to-gray-100 text-dark font-sans;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-all duration-200 font-semibold;
  }
  
  .btn-secondary {
    @apply bg-secondary text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-all duration-200 font-semibold;
  }
  
  .card {
    @apply bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200;
  }
}
EOF

cat > frontend/src/App.jsx << 'EOF'
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Layouts
import Layout from './components/Layout'

// Public Pages
import Login from './pages/Login'
import Register from './pages/Register'

// User Pages
import Dashboard from './pages/Dashboard'
import DeviceManagement from './pages/DeviceManagement'
import LocationHistory from './pages/LocationHistory'
import Profile from './pages/Profile'
import Subscriptions from './pages/Subscriptions'
import KycUpload from './pages/KycUpload'

// Admin Pages
import AdminLogin from './admin/pages/AdminLogin'
import AdminLayout from './admin/components/AdminLayout'
import AdminDashboard from './admin/pages/AdminDashboard'
import UserManagement from './admin/pages/UserManagement'
import DeviceManagementAdmin from './admin/pages/DeviceManagement'
import EmployeeManagement from './admin/pages/EmployeeManagement'
import ImeiBlacklist from './admin/pages/ImeiBlacklist'
import Reports from './admin/pages/Reports'
import Settings from './admin/pages/Settings'

// Protected Route
import ProtectedRoute from './components/ProtectedRoute'

const queryClient = new QueryClient()

function App() {
  const isAdmin = !!localStorage.getItem('adminToken')
  const isUser = !!localStorage.getItem('accessToken')

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* User Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="devices" element={<DeviceManagement />} />
            <Route path="location-history" element={<LocationHistory />} />
            <Route path="profile" element={<Profile />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="kyc" element={<KycUpload />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="devices" element={<DeviceManagementAdmin />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="imei-blacklist" element={<ImeiBlacklist />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
EOF

# Create main frontend components
cat > frontend/src/components/Layout.jsx << 'EOF'
import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
EOF

cat > frontend/src/components/Navbar.jsx << 'EOF'
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiHome, FiMap, FiPhone, FiUser, FiLogOut } from 'react-icons/fi'

export default function Navbar() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
  
  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }
  
  return (
    <nav className="bg-dark text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold text-primary">
            Silent Guardian
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link to="/dashboard" className="hover:text-primary transition">
              <FiHome className="inline mr-1" /> Dashboard
            </Link>
            <Link to="/devices" className="hover:text-primary transition">
              <FiMap className="inline mr-1" /> Devices
            </Link>
            <Link to="/location-history" className="hover:text-primary transition">
              <FiPhone className="inline mr-1" /> Locations
            </Link>
            <Link to="/profile" className="hover:text-primary transition">
              <FiUser className="inline mr-1" /> {user.fullName || 'Profile'}
            </Link>
            <button onClick={handleLogout} className="hover:text-red-400 transition">
              <FiLogOut className="inline mr-1" /> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
EOF

cat > frontend/src/components/ProtectedRoute.jsx << 'EOF'
import React from 'react'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('adminToken')
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
  
  if (!token) {
    return <Navigate to={adminOnly ? "/admin/login" : "/login"} />
  }
  
  if (adminOnly && user.accountType !== 'admin') {
    return <Navigate to="/dashboard" />
  }
  
  return children
}
EOF

# Frontend pages
for page in Login Register Dashboard Profile KycUpload DeviceManagement LocationHistory Subscriptions; do
  cat > frontend/src/pages/${page}.jsx << EOF
import React from 'react'

export default function ${page}() {
  return (
    <div className="card">
      <h1 className="text-3xl font-bold mb-4">${page}</h1>
      <p className="text-gray-600">This is the ${page} page. Content coming soon!</p>
    </div>
  )
}
EOF
done

# Admin Pages
mkdir -p frontend/src/admin/pages

for page in AdminLogin AdminDashboard UserManagement DeviceManagement EmployeeManagement ImeiBlacklist Reports Settings; do
  cat > frontend/src/admin/pages/${page}.jsx << EOF
import React from 'react'

export default function ${page}() {
  return (
    <div className="card">
      <h1 className="text-3xl font-bold mb-4">${page}</h1>
      <p className="text-gray-600">Admin ${page} page. Content coming soon!</p>
    </div>
  )
}
EOF
done

cat > frontend/src/admin/components/AdminLayout.jsx << 'EOF'
import React from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { FiUsers, FiSmartphone, FiUserCheck, FiShield, FiBarChart2, FiSettings, FiLogOut } from 'react-icons/fi'

export default function AdminLayout() {
  const navigate = useNavigate()
  
  const handleLogout = () => {
    localStorage.clear()
    navigate('/admin/login')
  }
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-dark text-white">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-primary">Admin Panel</h2>
        </div>
        <nav className="mt-6">
          <Link to="/admin/dashboard" className="flex items-center px-6 py-3 hover:bg-purple-900 transition">
            <FiBarChart2 className="mr-3" /> Dashboard
          </Link>
          <Link to="/admin/users" className="flex items-center px-6 py-3 hover:bg-purple-900 transition">
            <FiUsers className="mr-3" /> Users
          </Link>
          <Link to="/admin/devices" className="flex items-center px-6 py-3 hover:bg-purple-900 transition">
            <FiSmartphone className="mr-3" /> Devices
          </Link>
          <Link to="/admin/employees" className="flex items-center px-6 py-3 hover:bg-purple-900 transition">
            <FiUserCheck className="mr-3" /> Employees
          </Link>
          <Link to="/admin/imei-blacklist" className="flex items-center px-6 py-3 hover:bg-purple-900 transition">
            <FiShield className="mr-3" /> IMEI Blacklist
          </Link>
          <Link to="/admin/reports" className="flex items-center px-6 py-3 hover:bg-purple-900 transition">
            <FiBarChart2 className="mr-3" /> Reports
          </Link>
          <Link to="/admin/settings" className="flex items-center px-6 py-3 hover:bg-purple-900 transition">
            <FiSettings className="mr-3" /> Settings
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center px-6 py-3 hover:bg-red-600 transition mt-8">
            <FiLogOut className="mr-3" /> Logout
          </button>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}
EOF

# -----------------------------------------------------------------------------
# 4. ANDROID TRACKING APP (Based on your existing tracking_app)
# -----------------------------------------------------------------------------
echo "📱 Creating Android Tracking App..."

mkdir -p android/tracking_app/{app/src/main/{java/com/silentguardian/tracking/{activities,services,receivers,utils,models},res/{layout,drawable,values,mipmap}},gradle}

# Gradle files
cat > android/tracking_app/settings.gradle.kts << 'EOF'
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "SilentGuardianTracking"
include(":app")
EOF

cat > android/tracking_app/build.gradle.kts << 'EOF'
// Top-level build file
plugins {
    id("com.android.application") version "8.1.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.0" apply false
    id("com.google.dagger.hilt.android") version "2.48" apply false
}
EOF

cat > android/tracking_app/app/build.gradle.kts << 'EOF'
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
    id("dagger.hilt.android.plugin")
}

android {
    namespace = "com.silentguardian.tracking"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.silentguardian.tracking"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    
    buildFeatures {
        viewBinding = true
    }
    
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.10.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.7.0")
    
    // Navigation
    implementation("androidx.navigation:navigation-fragment-ktx:2.7.5")
    implementation("androidx.navigation:navigation-ui-ktx:2.7.5")
    
    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    
    // Dependency Injection
    implementation("com.google.dagger:hilt-android:2.48")
    kapt("com.google.dagger:hilt-compiler:2.48")
    
    // Location & Maps
    implementation("com.google.android.gms:play-services-location:21.0.1")
    implementation("com.google.android.gms:play-services-maps:18.2.0")
    
    // Device Admin
    implementation("androidx.work:work-runtime-ktx:2.9.0")
    
    // Socket.IO
    implementation("io.socket:socket.io-client:2.0.1")
    
    // Permissions
    implementation("com.karumi:dexter:6.2.3")
    
    // Room Database
    implementation("androidx.room:room-runtime:2.6.0")
    implementation("androidx.room:room-ktx:2.6.0")
    kapt("androidx.room:room-compiler:2.6.0")
}
EOF

# AndroidManifest.xml
cat > android/tracking_app/app/src/main/AndroidManifest.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.CAMERA" />

    <application
        android:name=".SilentGuardianApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Silent Guardian"
        android:theme="@style/Theme.SilentGuardian"
        android:usesCleartextTraffic="true"
        tools:targetApi="31">
        
        <!-- Activities -->
        <activity
            android:name=".activities.SplashActivity"
            android:exported="true"
            android:theme="@style/Theme.Splash">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
        <activity android:name=".activities.LoginActivity" />
        <activity android:name=".activities.RegisterActivity" />
        <activity android:name=".activities.MainActivity" />
        <activity android:name=".activities.DashboardActivity" />
        <activity android:name=".activities.SettingActivity" />
        
        <!-- Services -->
        <service
            android:name=".services.LocationTrackingService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="location" />
        
        <service
            android:name=".services.CommandExecutorService"
            android:enabled="true"
            android:exported="false" />
        
        <!-- Receivers -->
        <receiver
            android:name=".receivers.BootReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
            </intent-filter>
        </receiver>
        
        <receiver
            android:name=".receivers.FactoryResetReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MASTER_CLEAR" />
                <action android:name="android.intent.action.FACTORY_RESET" />
            </intent-filter>
        </receiver>
        
        <receiver
            android:name=".receivers.SmsReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter android:priority="1000">
                <action android:name="android.provider.Telephony.SMS_RECEIVED" />
            </intent-filter>
        </receiver>
        
        <!-- Device Admin -->
        <receiver
            android:name=".DeviceAdminReceiver"
            android:permission="android.permission.BIND_DEVICE_ADMIN">
            <meta-data
                android:name="android.app.device_admin"
                android:resource="@xml/device_admin" />
            <intent-filter>
                <action android:name="android.app.action.DEVICE_ADMIN_ENABLED" />
            </intent-filter>
        </receiver>
        
        <meta-data
            android:name="com.google.android.geo.API_KEY"
            android:value="YOUR_GOOGLE_MAPS_API_KEY" />
    </application>
</manifest>
EOF

# Main Tracking Activity
cat > android/tracking_app/app/src/main/java/com/silentguardian/tracking/activities/MainActivity.kt << 'EOF'
package com.silentguardian.tracking.activities

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.findNavController
import androidx.navigation.ui.AppBarConfiguration
import androidx.navigation.ui.setupActionBarWithNavController
import androidx.navigation.ui.setupWithNavController
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.silentguardian.tracking.R
import com.silentguardian.tracking.databinding.ActivityMainBinding
import com.silentguardian.tracking.services.LocationTrackingService
import com.silentguardian.tracking.utils.PreferenceManager

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var preferenceManager: PreferenceManager
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        preferenceManager = PreferenceManager(this)
        
        val navView: BottomNavigationView = binding.navView
        val navController = findNavController(R.id.nav_host_fragment_activity_main)
        val appBarConfiguration = AppBarConfiguration(
            setOf(
                R.id.navigation_dashboard, R.id.navigation_devices, R.id.navigation_settings
            )
        )
        setupActionBarWithNavController(navController, appBarConfiguration)
        navView.setupWithNavController(navController)
        
        // Start location tracking service
        startLocationService()
    }
    
    private fun startLocationService() {
        val serviceIntent = Intent(this, LocationTrackingService::class.java)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }
    
    companion object {
        fun newIntent(packageContext: android.content.Context): Intent {
            return Intent(packageContext, MainActivity::class.java)
        }
    }
}
EOF

# -----------------------------------------------------------------------------
# 5. ANDROID EMPLOYEE APP (Based on your existing employee_app)
# -----------------------------------------------------------------------------
echo "👔 Creating Android Employee App..."

mkdir -p android-employee/employee_app/{app/src/main/{java/com/silentguardian/employee/{activities,services,adapters,utils,models},res/{layout,drawable,values}},gradle}

# Copy similar structure with employee-specific features
cat > android-employee/employee_app/settings.gradle.kts << 'EOF'
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "SilentGuardianEmployee"
include(":app")
EOF

cat > android-employee/employee_app/build.gradle.kts << 'EOF'
plugins {
    id("com.android.application") version "8.1.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.0" apply false
}
EOF

cat > android-employee/employee_app/app/build.gradle.kts << 'EOF'
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
}

android {
    namespace = "com.silentguardian.employee"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.silentguardian.employee"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    
    buildFeatures {
        viewBinding = true
    }
    
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.10.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    
    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    
    // Location
    implementation("com.google.android.gms:play-services-location:21.0.1")
    
    // Charts
    implementation("com.github.PhilJay:MPAndroidChart:v3.1.0")
    
    // Socket.IO
    implementation("io.socket:socket.io-client:2.0.1")
    
    // Permissions
    implementation("com.karumi:dexter:6.2.3")
}
EOF

# -----------------------------------------------------------------------------
# 6. Docker & Development Environment
# -----------------------------------------------------------------------------
cat > infrastructure/docker/docker-compose.yml << 'EOF'
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: silent-guardian-mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: silent_guardian
    volumes:
      - mongodb_data:/data/db
    networks:
      - sg-network

  redis:
    image: redis:7-alpine
    container_name: silent-guardian-redis
    ports:
      - "6379:6379"
    networks:
      - sg-network

  backend:
    build:
      context: ../../backend-python
      dockerfile: ../infrastructure/docker/Dockerfile.backend
    container_name: silent-guardian-backend
    ports:
      - "8000:8000"
    environment:
      MONGODB_URL: mongodb://admin:password@mongodb:27017
      REDIS_URL: redis://redis:6379
      SECRET_KEY: ${SECRET_KEY:-dev-secret-key-change-in-production}
    depends_on:
      - mongodb
      - redis
    networks:
      - sg-network
    volumes:
      - ../../backend-python:/app

  frontend:
    build:
      context: ../../frontend
      dockerfile: ../infrastructure/docker/Dockerfile.frontend
    container_name: silent-guardian-frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
    networks:
      - sg-network
    volumes:
      - ../../frontend:/app
      - /app/node_modules

volumes:
  mongodb_data:

networks:
  sg-network:
    driver: bridge
EOF

cat > infrastructure/docker/Dockerfile.backend << 'EOF'
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
EOF

cat > infrastructure/docker/Dockerfile.frontend << 'EOF'
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
EOF

# -----------------------------------------------------------------------------
# 7. Documentation & Scripts
# -----------------------------------------------------------------------------
cat > docs/README.md << 'EOF'
# Silent Guardian Complete Platform

## 🚀 Complete Security & Employee Tracking Solution

### Architecture
- **Backend**: Python/FastAPI with MongoDB, Redis, WebSockets
- **Frontend**: React 18 with Tailwind CSS, Vite
- **Android Apps**: Native Kotlin apps for tracking and employee management

## 📦 Components

### 1. Backend API (Port 8000)
- RESTful API with JWT authentication
- WebSocket for real-time location updates
- MongoDB for data persistence
- Redis for caching and session management

### 2. Frontend Web (Port 5173)
- User dashboard for tracking devices
- Admin panel for complete system management
- Employee management with invite system
- IMEI blacklist management
- Real-time location viewing

### 3. Tracking App (Android)
- Location tracking foreground service
- Device admin features
- Command execution (lock, wipe, locate)
- SMS command receiver
- Factory reset protection

### 4. Employee App (Android)
- Work location tracking
- Commission tracking
- Performance dashboard
- Signup tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB 7+
- Redis 7+
- Android Studio (for Android apps)

### Development Setup

#### 1. Start Backend
```bash
cd backend-python
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
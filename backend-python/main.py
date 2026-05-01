from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import uvicorn
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.websocket import websocket_endpoint
from app.routers import (
    auth, users, devices, employees, subscriptions, payments,
    commands, tickets, chat, imei, alerts, reports, admin
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Silent Guardian API...")
    await connect_to_mongo()
    print("MongoDB connected")
    yield
    # Shutdown
    await close_mongo_connection()
    print("MongoDB disconnected")

app = FastAPI(
    title="Silent Guardian API",
    description="Complete Backend for Silent Guardian Tracking System",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket
app.websocket("/ws/{client_id}")(websocket_endpoint)

# API Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(devices.router, prefix="/api/v1/devices", tags=["Devices"])
app.include_router(employees.router, prefix="/api/v1/employees", tags=["Employees"])
app.include_router(subscriptions.router, prefix="/api/v1/subscriptions", tags=["Subscriptions"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["Payments"])
app.include_router(commands.router, prefix="/api/v1/commands", tags=["Commands"])
app.include_router(tickets.router, prefix="/api/v1/tickets", tags=["Tickets"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(imei.router, prefix="/api/v1/imei", tags=["IMEI Blacklist"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["Community Alerts"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])

@app.get("/")
async def root():
    return {
        "name": "Silent Guardian API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel
from bson import ObjectId
from app.database import get_db
from app.auth import get_current_admin
from app.services.email_service import send_email
from app.services.sms_service import send_sms

router = APIRouter()

# ========== Models ==========
class AdminStatsResponse(BaseModel):
    totalUsers: int
    totalDevices: int
    activeDevices: int
    stolenDevices: int
    pendingKyc: int
    totalEmployees: int
    activeEmployees: int
    totalRevenue: float
    monthlyRevenue: float
    totalCommissions: float

class SystemSettings(BaseModel):
    maintenanceMode: bool = False
    allowNewRegistrations: bool = True
    pushNotificationsEnabled: bool = True

# ========== Dashboard Stats ==========
@router.get("/dashboard/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_admin)):
    db = get_db()
    
    # User stats
    total_users = await db.users.count_documents({})
    pending_kyc = await db.users.count_documents({"kycStatus": "pending", "accountType": {"$ne": "admin"}})
    
    # Device stats
    total_devices = await db.devices.count_documents({})
    active_devices = await db.devices.count_documents({"status": "active"})
    stolen_devices = await db.devices.count_documents({"status": "stolen"})
    
    # Employee stats
    total_employees = await db.employees.count_documents({})
    active_employees = await db.employees.count_documents({"status": "active"})
    
    # Revenue stats (from subscriptions)
    pipeline = [
        {"$match": {"status": "active"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    revenue_result = await db.subscriptions.aggregate(pipeline).to_list(None)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Monthly revenue
    start_of_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_pipeline = [
        {"$match": {"status": "active", "createdAt": {"$gte": start_of_month}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    monthly_result = await db.subscriptions.aggregate(monthly_pipeline).to_list(None)
    monthly_revenue = monthly_result[0]["total"] if monthly_result else 0
    
    # Total commissions
    commission_pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$totalCommission"}}}
    ]
    commission_result = await db.employees.aggregate(commission_pipeline).to_list(None)
    total_commissions = commission_result[0]["total"] if commission_result else 0
    
    return {
        "totalUsers": total_users,
        "totalDevices": total_devices,
        "activeDevices": active_devices,
        "stolenDevices": stolen_devices,
        "pendingKyc": pending_kyc,
        "totalEmployees": total_employees,
        "activeEmployees": active_employees,
        "totalRevenue": total_revenue,
        "monthlyRevenue": monthly_revenue,
        "totalCommissions": total_commissions
    }

# ========== Recent Activity ==========
@router.get("/dashboard/recent")
async def get_recent_activity(limit: int = 10, current_user: dict = Depends(get_current_admin)):
    db = get_db()
    
    # Recent users
    recent_users = await db.users.find().sort("createdAt", -1).limit(limit).to_list(limit)
    
    # Recent devices
    recent_devices = await db.devices.find().sort("createdAt", -1).limit(limit).to_list(limit)
    
    # Recent commands
    recent_commands = await db.commands.find().sort("createdAt", -1).limit(limit).to_list(limit)
    
    return {
        "recentUsers": [{
            "id": str(u["_id"]),
            "name": u["fullName"],
            "email": u["email"],
            "createdAt": u["createdAt"].isoformat() if u["createdAt"] else None
        } for u in recent_users],
        "recentDevices": [{
            "id": str(d["_id"]),
            "name": d["deviceName"],
            "deviceId": d["deviceId"],
            "status": d["status"],
            "createdAt": d["createdAt"].isoformat() if d["createdAt"] else None
        } for d in recent_devices],
        "recentCommands": [{
            "id": str(c["_id"]),
            "type": c["type"],
            "status": c["status"],
            "createdAt": c["createdAt"].isoformat() if c["createdAt"] else None
        } for c in recent_commands]
    }

# ========== System Settings ==========
@router.get("/settings")
async def get_system_settings(current_user: dict = Depends(get_current_admin)):
    db = get_db()
    
    settings = await db.system_settings.find_one({"_id": "global"})
    if not settings:
        settings = {
            "maintenanceMode": False,
            "allowNewRegistrations": True,
            "pushNotificationsEnabled": True
        }
    
    return settings

@router.put("/settings")
async def update_system_settings(
    settings_data: SystemSettings,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    await db.system_settings.update_one(
        {"_id": "global"},
        {"$set": settings_data.dict()},
        upsert=True
    )
    
    return {"success": True, "message": "Settings updated"}

# ========== Send Notification to All Users ==========
@router.post("/notify/all")
async def send_notification_to_all(
    title: str,
    message: str,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    # Get all users
    users = await db.users.find({}).to_list(None)
    
    # In production, send push notifications
    # For now, store in notifications collection
    notification = {
        "title": title,
        "message": message,
        "type": "admin",
        "sentBy": current_user["email"],
        "sentAt": datetime.now(timezone.utc),
        "readBy": []
    }
    
    await db.global_notifications.insert_one(notification)
    
    return {"success": True, "message": f"Notification sent to {len(users)} users"}

# ========== Get Admin Notifications ==========
@router.get("/notifications")
async def get_admin_notifications(current_user: dict = Depends(get_current_admin)):
    db = get_db()
    
    notifications = await db.admin_notifications.find().sort("createdAt", -1).limit(50).to_list(50)
    
    return [{
        "id": str(n["_id"]),
        "type": n["type"],
        "message": n.get("message", ""),
        "data": n.get("data", {}),
        "status": n.get("status", "pending"),
        "createdAt": n["createdAt"].isoformat() if n["createdAt"] else None
    } for n in notifications]

# ========== Mark Notification Read ==========
@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    await db.admin_notifications.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"status": "read"}}
    )
    
    return {"success": True}

# ========== System Health Check ==========
@router.get("/health")
async def system_health(current_user: dict = Depends(get_current_admin)):
    db = get_db()
    
    # Check database connection
    try:
        await db.command("ping")
        db_status = "healthy"
    except:
        db_status = "unhealthy"
    
    # Count recent errors
    recent_errors = await db.error_logs.count_documents({
        "createdAt": {"$gt": datetime.now(timezone.utc) - timedelta(hours=24)}
    })
    
    return {
        "status": "operational",
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "errorsLast24h": recent_errors,
        "uptime": "unknown"  # Would need to track this
    }
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
from bson import ObjectId
import uuid
from app.database import get_db
from app.auth import get_current_user, get_current_admin
from app.services.sms_service import send_sms
from app.services.email_service import send_email

router = APIRouter()

class DeviceRegister(BaseModel):
    hardwareId: str
    deviceName: str
    manufacturer: str = ""
    model: str = ""
    androidVersion: str = ""
    imei: Optional[str] = None

class LocationUpdate(BaseModel):
    hardwareId: str
    lat: float
    lng: float
    accuracy: float
    speed: float = 0
    bearing: float = 0
    altitude: float = 0
    timestamp: int
    battery: int = 100
    isMoving: bool = False

class CommandSend(BaseModel):
    deviceId: str
    type: str
    params: dict = {}

@router.post("/register")
async def register_device(device_data: DeviceRegister):
    db = get_db()
    
    # Check if device already exists
    existing = await db.devices.find_one({"hardwareId": device_data.hardwareId})
    if existing:
        return {
            "success": True,
            "deviceId": str(existing["_id"]),
            "message": "Device already registered"
        }
    
    # Check IMEI blacklist
    if device_data.imei:
        blacklisted = await db.imei_blacklist.find_one({"imei": device_data.imei, "status": "active"})
        if blacklisted:
            return {
                "success": False,
                "blacklisted": True,
                "message": "This device has been reported as stolen",
                "reason": blacklisted.get("reason")
            }
    
    device = {
        "deviceId": str(uuid.uuid4()),
        "hardwareId": device_data.hardwareId,
        "deviceName": device_data.deviceName,
        "manufacturer": device_data.manufacturer,
        "model": device_data.model,
        "androidVersion": device_data.androidVersion,
        "imei": device_data.imei,
        "status": "inactive",
        "isOnline": False,
        "battery": 100,
        "locationHistory": [],
        "createdAt": datetime.now(timezone.utc)
    }
    
    result = await db.devices.insert_one(device)
    
    return {
        "success": True,
        "deviceId": str(result.inserted_id),
        "message": "Device registered successfully"
    }

@router.post("/location")
async def update_location(location: LocationUpdate):
    db = get_db()
    
    device = await db.devices.find_one({"hardwareId": location.hardwareId})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    location_data = {
        "lat": location.lat,
        "lng": location.lng,
        "accuracy": location.accuracy,
        "timestamp": datetime.fromtimestamp(location.timestamp / 1000, timezone.utc)
    }
    
    # Check if device is stolen/blacklisted
    if device.get("status") == "stolen":
        # Send alert to owner
        owner = await db.users.find_one({"_id": device["owner"]}) if device.get("owner") else None
        if owner and owner.get("phone"):
            await send_sms(
                owner["phone"],
                f"ALERT: Your stolen device {device['deviceName']} has been located at {location.lat}, {location.lng}"
            )
    
    # Update device
    await db.devices.update_one(
        {"_id": device["_id"]},
        {
            "$set": {
                "lastLocation": location_data,
                "lastSeen": datetime.now(timezone.utc),
                "battery": location.battery,
                "isOnline": True
            },
            "$push": {
                "locationHistory": {
                    "$each": [location_data],
                    "$slice": -1000
                }
            }
        }
    )
    
    return {"success": True}

@router.get("/info")
async def get_device_info(hardwareId: str):
    db = get_db()
    
    device = await db.devices.find_one({"hardwareId": hardwareId})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return {
        "deviceId": device["deviceId"],
        "deviceName": device["deviceName"],
        "status": device["status"],
        "lastSeen": device.get("lastSeen"),
        "lastLocation": device.get("lastLocation"),
        "battery": device.get("battery", 100)
    }

@router.get("/status")
async def get_device_status(hardwareId: str):
    db = get_db()
    
    device = await db.devices.find_one({"hardwareId": hardwareId})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return {
        "status": device["status"],
        "isOnline": device.get("isOnline", False),
        "lastHeartbeat": device.get("lastSeen"),
        "servicesRunning": True,
        "battery": device.get("battery", 100)
    }

@router.post("/heartbeat")
async def send_heartbeat(hardwareId: str, battery: int, isCharging: bool = False):
    db = get_db()
    
    device = await db.devices.find_one({"hardwareId": hardwareId})
    if device:
        await db.devices.update_one(
            {"_id": device["_id"]},
            {"$set": {"lastSeen": datetime.now(timezone.utc), "battery": battery}}
        )
        
        # Check if subscription is expired
        subscription = await db.subscriptions.find_one({
            "deviceId": device["_id"],
            "status": "active",
            "endDate": {"$gt": datetime.now(timezone.utc)}
        })
        
        has_active_subscription = subscription is not None
        
        # Check for pending commands
        pending_commands = await db.commands.find({
            "deviceId": device["_id"],
            "status": "pending"
        }).to_list(10)
        
        return {
            "success": True,
            "hasCommands": len(pending_commands) > 0,
            "hasActiveSubscription": has_active_subscription,
            "commands": [{
                "id": str(cmd["_id"]),
                "type": cmd["type"],
                "params": cmd.get("params", {})
            } for cmd in pending_commands]
        }
    
    return {"success": False, "message": "Device not found"}

@router.get("/user/devices")
async def get_user_devices(current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    devices = await db.devices.find({"owner": ObjectId(current_user["id"])}).to_list(100)
    
    return [{
        "id": str(d["_id"]),
        "deviceId": d["deviceId"],
        "deviceName": d["deviceName"],
        "status": d["status"],
        "lastSeen": d.get("lastSeen"),
        "lastLocation": d.get("lastLocation"),
        "battery": d.get("battery", 100)
    } for d in devices]

@router.post("/link")
async def link_device_to_user(deviceId: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    device = await db.devices.find_one({"deviceId": deviceId})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    if device.get("owner"):
        raise HTTPException(status_code=400, detail="Device already linked to another user")
    
    await db.devices.update_one(
        {"_id": device["_id"]},
        {"$set": {"owner": ObjectId(current_user["id"])}}
    )
    
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$push": {"devices": str(device["_id"])}}
    )
    
    return {"success": True, "message": "Device linked successfully"}

@router.post("/command")
async def send_command(
    command: CommandSend,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    device = await db.devices.find_one({"deviceId": command.deviceId})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Verify ownership
    if str(device.get("owner")) != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    cmd = {
        "deviceId": device["_id"],
        "type": command.type,
        "params": command.params,
        "status": "pending",
        "issuedBy": ObjectId(current_user["id"]),
        "createdAt": datetime.now(timezone.utc)
    }
    
    result = await db.commands.insert_one(cmd)
    
    return {
        "success": True,
        "commandId": str(result.inserted_id),
        "message": f"Command {command.type} queued for delivery"
    }

@router.get("/history/{deviceId}")
async def get_location_history(
    deviceId: str,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    device = await db.devices.find_one({"deviceId": deviceId})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Verify ownership
    if str(device.get("owner")) != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    history = device.get("locationHistory", [])[-limit:]
    
    return {"history": history, "count": len(history)}
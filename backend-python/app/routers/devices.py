from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId
import uuid
from app.database import get_db
from app.auth import get_current_user, get_current_admin
from app.services.sms_service import send_sms
from app.services.email_service import send_email

router = APIRouter()

# ========== Models ==========
class DeviceRegister(BaseModel):
    hardwareId: str = Field(..., min_length=8)
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

class DeviceUpdate(BaseModel):
    deviceName: Optional[str] = None
    status: Optional[str] = None

# ========== Device Registration ==========
@router.post("/register")
async def register_device(device_data: DeviceRegister):
    db = get_db()
    
    # Check if device already exists
    existing = await db.devices.find_one({"hardwareId": device_data.hardwareId})
    if existing:
        return {
            "success": True,
            "deviceId": str(existing["_id"]),
            "deviceUuid": existing["deviceId"],
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
    
    # Generate unique device ID
    device_uuid = str(uuid.uuid4())
    
    device = {
        "deviceId": device_uuid,
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
        "deviceUuid": device_uuid,
        "message": "Device registered successfully"
    }

# ========== Update Location ==========
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
    
    # Check if device is stolen
    if device.get("status") == "stolen":
        # Send alert to owner
        owner = await db.users.find_one({"_id": device.get("owner")}) if device.get("owner") else None
        if owner and owner.get("phone"):
            await send_sms(
                owner["phone"],
                f"ALERT: Your stolen device {device['deviceName']} has been located at {location.lat}, {location.lng}"
            )
        
        # Also send email
        if owner and owner.get("email"):
            await send_email(
                owner["email"],
                "Stolen Device Location Update",
                f"Your device {device['deviceName']} has been located.\n\nLocation: {location.lat}, {location.lng}\nTime: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}\n\nPlease contact authorities."
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

# ========== Get Device Info ==========
@router.get("/info")
async main() -> None: raise NotImplementedError()```
@router.get("/info")
async def get_device_info(hardwareId: str):
    db = get_db()
    
    device = await db.devices.find_one({"hardwareId": hardwareId})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Check if subscription is active
    subscription = None
    if device.get("owner"):
        sub = await db.subscriptions.find_one({
            "deviceId": device["_id"],
            "status": "active",
            "endDate": {"$gt": datetime.now(timezone.utc)}
        })
        if sub:
            subscription = {
                "plan": sub["plan"],
                "active": True,
                "expiresAt": sub["endDate"]
            }
    
    return {
        "deviceId": device["deviceId"],
        "deviceName": device["deviceName"],
        "status": device["status"],
        "isOnline": device.get("isOnline", False),
        "lastSeen": device.get("lastSeen"),
        "lastLocation": device.get("lastLocation"),
        "battery": device.get("battery", 100),
        "firmware": device.get("firmware", "1.0.0"),
        "subscription": subscription
    }

# ========== Get Device Status ==========
@router.get("/status")
async def get_device_status(hardwareId: str):
    db = get_db()
    
    device = await db.devices.find_one({"hardwareId": hardwareId})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Check for pending commands
    pending_commands = await db.commands.count_documents({
        "deviceId": device["_id"],
        "status": "pending"
    })
    
    return {
        "status": device["status"],
        "isOnline": device.get("isOnline", False),
        "lastHeartbeat": device.get("lastSeen"),
        "servicesRunning": True,
        "battery": device.get("battery", 100),
        "hasPendingCommands": pending_commands > 0
    }

# ========== Heartbeat ==========
@router.post("/heartbeat")
async def send_heartbeat(hardwareId: str, battery: int, isCharging: bool = False):
    db = get_db()
    
    device = await db.devices.find_one({"hardwareId": hardwareId})
    if not device:
        return {"success": False, "message": "Device not found"}
    
    await db.devices.update_one(
        {"_id": device["_id"]},
        {"$set": {
            "lastSeen": datetime.now(timezone.utc),
            "battery": battery,
            "isOnline": True
        }}
    )
    
    # Check if subscription is active
    subscription = await db.subscriptions.find_one({
        "deviceId": device["_id"],
        "status": "active",
        "endDate": {"$gt": datetime.now(timezone.utc)}
    })
    
    has_active_subscription = subscription is not None
    
    # Get pending commands
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

# ========== Get User's Devices ==========
@router.get("/user/devices")
async def get_user_devices(current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    devices = await db.devices.find({"owner": ObjectId(current_user["id"])}).to_list(100)
    
    return [{
        "id": str(d["_id"]),
        "deviceId": d["deviceId"],
        "deviceName": d["deviceName"],
        "status": d["status"],
        "isOnline": d.get("isOnline", False),
        "lastSeen": d.get("lastSeen"),
        "lastLocation": d.get("lastLocation"),
        "battery": d.get("battery", 100)
    } for d in devices]

# ========== Link Device to User ==========
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

# ========== Unlink Device ==========
@router.post("/unlink/{device_id}")
async def unlink_device(device_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    device = await db.devices.find_one({"_id": ObjectId(device_id)})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    if str(device.get("owner")) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.devices.update_one(
        {"_id": ObjectId(device_id)},
        {"$set": {"owner": None}}
    )
    
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$pull": {"devices": device_id}}
    )
    
    return {"success": True, "message": "Device unlinked successfully"}

# ========== Send Command to Device ==========
@router.post("/command")
async def send_command(
    command: CommandSend,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    device = await db.devices.find_one({"deviceId": command.deviceId})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Verify ownership (admin can send to any device)
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

# ========== Get Device Location History ==========
@router.get("/history/{device_id}")
async def get_location_history(
    device_id: str,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    device = await db.devices.find_one({"_id": ObjectId(device_id)})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Verify ownership
    if str(device.get("owner")) != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    history = device.get("locationHistory", [])[-limit:]
    
    return {
        "deviceId": device["deviceId"],
        "deviceName": device["deviceName"],
        "history": history,
        "count": len(history)
    }

# ========== Update Device Status (Admin) ==========
@router.put("/{device_id}/status")
async def update_device_status(
    device_id: str,
    status: str,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    valid_statuses = ["active", "inactive", "stolen", "maintenance"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    device = await db.devices.find_one({"_id": ObjectId(device_id)})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    await db.devices.update_one(
        {"_id": ObjectId(device_id)},
        {"$set": {"status": status, "updatedAt": datetime.now(timezone.utc)}}
    )
    
    # If marked as stolen, add IMEI to blacklist if available
    if status == "stolen" and device.get("imei"):
        existing = await db.imei_blacklist.find_one({"imei": device["imei"]})
        if not existing:
            await db.imei_blacklist.insert_one({
                "imei": device["imei"],
                "reason": "Device reported stolen",
                "reportedBy": ObjectId(current_user["id"]),
                "reportedByEmail": current_user["email"],
                "status": "active",
                "deviceInfo": {
                    "deviceName": device["deviceName"],
                    "manufacturer": device.get("manufacturer"),
                    "model": device.get("model")
                },
                "createdAt": datetime.now(timezone.utc)
            })
    
    return {"success": True, "message": f"Device status updated to {status}"}

# ========== Delete Device (Admin) ==========
@router.delete("/{device_id}")
async def delete_device(
    device_id: str,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    device = await db.devices.find_one({"_id": ObjectId(device_id)})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Remove from user's device list
    if device.get("owner"):
        await db.users.update_one(
            {"_id": device["owner"]},
            {"$pull": {"devices": device_id}}
        )
    
    # Delete device
    await db.devices.delete_one({"_id": ObjectId(device_id)})
    
    # Delete associated commands
    await db.commands.delete_many({"deviceId": ObjectId(device_id)})
    
    # Delete subscriptions
    await db.subscriptions.delete_many({"deviceId": ObjectId(device_id)})
    
    return {"success": True, "message": "Device deleted successfully"}

# ========== Get All Devices (Admin) ==========
@router.get("/admin/all")
async def get_all_devices(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    query = {}
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"deviceName": {"$regex": search, "$options": "i"}},
            {"deviceId": {"$regex": search, "$options": "i"}},
            {"hardwareId": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    
    devices = await db.devices.find(query).skip(skip).limit(limit).to_list(limit)
    total = await db.devices.count_documents(query)
    
    # Get owner info for each device
    result = []
    for device in devices:
        owner = None
        if device.get("owner"):
            user = await db.users.find_one({"_id": device["owner"]})
            if user:
                owner = {
                    "id": str(user["_id"]),
                    "name": user["fullName"],
                    "email": user["email"]
                }
        
        result.append({
            "id": str(device["_id"]),
            "deviceId": device["deviceId"],
            "deviceName": device["deviceName"],
            "hardwareId": device["hardwareId"],
            "status": device["status"],
            "isOnline": device.get("isOnline", False),
            "lastSeen": device.get("lastSeen"),
            "lastLocation": device.get("lastLocation"),
            "battery": device.get("battery", 100),
            "owner": owner,
            "createdAt": device["createdAt"].isoformat() if device["createdAt"] else None
        })
    
    return {
        "devices": result,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }
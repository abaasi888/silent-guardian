from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
from bson import ObjectId
from app.database import get_db
from app.auth import get_current_user, get_current_admin

router = APIRouter()

# ========== Models ==========
class CommandSend(BaseModel):
    deviceId: str
    type: str
    params: dict = {}

class CommandResponse(BaseModel):
    id: str
    type: str
    status: str
    createdAt: str

# ========== Get Pending Commands (Device Polling) ==========
@router.get("/pending")
async def get_pending_commands(hardwareId: str):
    db = get_db()
    
    device = await db.devices.find_one({"hardwareId": hardwareId})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    pending = await db.commands.find({
        "deviceId": device["_id"],
        "status": "pending"
    }).sort("createdAt", 1).to_list(50)
    
    return [{
        "id": str(cmd["_id"]),
        "type": cmd["type"],
        "params": cmd.get("params", {}),
        "issuedAt": cmd["createdAt"].isoformat() if cmd["createdAt"] else None
    } for cmd in pending]

# ========== Mark Command Executed ==========
@router.post("/{command_id}/execute")
async def mark_command_executed(
    command_id: str,
    success: bool,
    result: Optional[str] = None
):
    db = get_db()
    
    command = await db.commands.find_one({"_id": ObjectId(command_id)})
    if not command:
        raise HTTPException(status_code=404, detail="Command not found")
    
    await db.commands.update_one(
        {"_id": ObjectId(command_id)},
        {"$set": {
            "status": "executed" if success else "failed",
            "executedAt": datetime.now(timezone.utc),
            "result": result
        }}
    )
    
    return {"success": True}

# ========== Send Command to Device (User/Admin) ==========
@router.post("/send")
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

# ========== Get Command History (Device) ==========
@router.get("/history/{hardwareId}")
async def get_command_history(
    hardwareId: str,
    limit: int = 50
):
    db = get_db()
    
    device = await db.devices.find_one({"hardwareId": hardwareId})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    commands = await db.commands.find({
        "deviceId": device["_id"]
    }).sort("createdAt", -1).limit(limit).to_list(limit)
    
    return [{
        "id": str(cmd["_id"]),
        "type": cmd["type"],
        "status": cmd["status"],
        "executedAt": cmd.get("executedAt"),
        "result": cmd.get("result"),
        "createdAt": cmd["createdAt"].isoformat() if cmd["createdAt"] else None
    } for cmd in commands]

# ========== Get All Commands (Admin) ==========
@router.get("/admin/all")
async def get_all_commands(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    query = {}
    if status:
        query["status"] = status
    
    skip = (page - 1) * limit
    
    commands = await db.commands.find(query).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.commands.count_documents(query)
    
    result = []
    for cmd in commands:
        device = await db.devices.find_one({"_id": cmd["deviceId"]})
        result.append({
            "id": str(cmd["_id"]),
            "deviceId": device["deviceId"] if device else "Unknown",
            "deviceName": device["deviceName"] if device else "Unknown",
            "type": cmd["type"],
            "status": cmd["status"],
            "createdAt": cmd["createdAt"].isoformat() if cmd["createdAt"] else None,
            "executedAt": cmd.get("executedAt").isoformat() if cmd.get("executedAt") else None,
            "result": cmd.get("result")
        })
    
    return {
        "commands": result,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }
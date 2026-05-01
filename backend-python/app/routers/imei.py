from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from bson import ObjectId
from app.database import get_db
from app.auth import get_current_admin

router = APIRouter()

# ========== Models ==========
class ImeiBlacklistCreate(BaseModel):
    imei: str
    reason: str
    deviceModel: Optional[str] = None
    manufacturer: Optional[str] = None

# ========== Check IMEI (Public - No Auth Required) ==========
@router.get("/check")
async def check_imei(imei: str):
    db = get_db()
    
    blacklisted = await db.imei_blacklist.find_one({"imei": imei, "status": "active"})
    
    return {
        "isBlacklisted": blacklisted is not None,
        "reason": blacklisted.get("reason") if blacklisted else None,
        "reportedAt": blacklisted.get("createdAt").isoformat() if blacklisted and blacklisted.get("createdAt") else None
    }

# ========== Add IMEI to Blacklist (Admin Only) ==========
@router.post("/add")
async def add_to_blacklist(
    data: ImeiBlacklistCreate,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    existing = await db.imei_blacklist.find_one({"imei": data.imei})
    if existing:
        raise HTTPException(status_code=400, detail="IMEI already in blacklist")
    
    blacklist_entry = {
        "imei": data.imei,
        "reason": data.reason,
        "reportedBy": ObjectId(current_user["id"]),
        "reportedByEmail": current_user["email"],
        "status": "active",
        "deviceInfo": {
            "model": data.deviceModel,
            "manufacturer": data.manufacturer
        },
        "createdAt": datetime.now(timezone.utc)
    }
    
    result = await db.imei_blacklist.insert_one(blacklist_entry)
    
    # Also mark devices with this IMEI as stolen
    await db.devices.update_many(
        {"imei": data.imei},
        {"$set": {"status": "stolen"}}
    )
    
    return {"success": True, "message": "IMEI added to blacklist", "id": str(result.inserted_id)}

# ========== Remove IMEI from Blacklist (Admin Only) ==========
@router.delete("/{entry_id}")
async def remove_from_blacklist(
    entry_id: str,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    result = await db.imei_blacklist.update_one(
        {"_id": ObjectId(entry_id)},
        {"$set": {"status": "resolved", "resolvedAt": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    return {"success": True, "message": "IMEI removed from blacklist"}

# ========== Get All Blacklisted IMEIs (Admin Only) ==========
@router.get("/list")
async def get_blacklist(
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    skip = (page - 1) * limit
    
    blacklist = await db.imei_blacklist.find().sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.imei_blacklist.count_documents({})
    
    return {
        "blacklist": [{
            "id": str(item["_id"]),
            "imei": item["imei"],
            "reason": item["reason"],
            "reportedBy": item.get("reportedByEmail"),
            "status": item["status"],
            "createdAt": item["createdAt"].isoformat() if item["createdAt"] else None,
            "resolvedAt": item.get("resolvedAt").isoformat() if item.get("resolvedAt") else None
        } for item in blacklist],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }
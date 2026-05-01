from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId
from app.database import get_db
from app.auth import get_current_user, get_current_admin
from app.services.sms_service import send_sms

router = APIRouter()

# ========== Models ==========
class AlertCreate(BaseModel):
    type: str = Field(..., description="stolen_device, suspicious, found_device, police_presence, general")
    title: str
    description: str
    lat: float
    lng: float
    radius: int = 1000
    reward: Optional[float] = None
    contactInfo: Optional[str] = None

# ========== Get Nearby Alerts (Public) ==========
@router.get("/nearby")
async def get_nearby_alerts(
    lat: float,
    lng: float,
    radius: int = 5000,
    limit: int = 50
):
    db = get_db()
    
    # Find active alerts within radius
    # Using geospatial query (requires 2dsphere index)
    alerts = await db.community_alerts.find({
        "status": "active",
        "location.lat": {"$exists": True},
        "location.lng": {"$exists": True}
    }).to_list(limit)
    
    # Filter by distance (simple Euclidean for now)
    # In production, use proper geospatial query with $near
    nearby = []
    for alert in alerts:
        alert_lat = alert["location"]["lat"]
        alert_lng = alert["location"]["lng"]
        distance = ((lat - alert_lat) ** 2 + (lng - alert_lng) ** 2) ** 0.5 * 111000  # approx meters
        
        if distance <= radius:
            nearby.append({
                "id": str(alert["_id"]),
                "type": alert["type"],
                "title": alert["title"],
                "description": alert["description"],
                "location": alert["location"],
                "distance": round(distance),
                "reward": alert.get("reward"),
                "createdAt": alert["createdAt"].isoformat() if alert["createdAt"] else None
            })
    
    return {"alerts": nearby[:limit]}

# ========== Create Alert (Authenticated User) ==========
@router.post("/create")
async def create_alert(
    alert_data: AlertCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    alert = {
        "type": alert_data.type,
        "title": alert_data.title,
        "description": alert_data.description,
        "location": {
            "lat": alert_data.lat,
            "lng": alert_data.lng
        },
        "radius": alert_data.radius,
        "reportedBy": ObjectId(current_user["id"]),
        "status": "active",
        "reward": alert_data.reward,
        "contactInfo": alert_data.contactInfo,
        "createdAt": datetime.now(timezone.utc)
    }
    
    result = await db.community_alerts.insert_one(alert)
    
    return {"success": True, "alertId": str(result.inserted_id)}

# ========== Get All Alerts (Admin) ==========
@router.get("/admin/all")
async def get_all_alerts(
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
    
    alerts = await db.community_alerts.find(query).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.community_alerts.count_documents(query)
    
    result = []
    for alert in alerts:
        reported_by = None
        if alert.get("reportedBy"):
            user = await db.users.find_one({"_id": alert["reportedBy"]})
            if user:
                reported_by = user["fullName"]
        
        result.append({
            "id": str(alert["_id"]),
            "type": alert["type"],
            "title": alert["title"],
            "description": alert["description"],
            "location": alert["location"],
            "status": alert["status"],
            "reward": alert.get("reward"),
            "reportedBy": reported_by,
            "createdAt": alert["createdAt"].isoformat() if alert["createdAt"] else None
        })
    
    return {
        "alerts": result,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

# ========== Resolve Alert (Admin) ==========
@router.put("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    result = await db.community_alerts.update_one(
        {"_id": ObjectId(alert_id)},
        {"$set": {"status": "resolved", "resolvedAt": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"success": True, "message": "Alert resolved"}

# ========== Delete Alert (Admin) ==========
@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    result = await db.community_alerts.delete_one({"_id": ObjectId(alert_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"success": True, "message": "Alert deleted"}
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId
from app.database import get_db
from app.auth import get_current_user, get_current_admin
from app.services.email_service import send_email

router = APIRouter()

# ========== Models ==========
class SubscriptionCreate(BaseModel):
    deviceId: str
    plan: str  # basic, premium
    paymentMethod: str  # crypto, mtn, airtel, card

class SubscriptionRenew(BaseModel):
    subscriptionId: str
    paymentMethod: str

# ========== Plans Configuration ==========
PLANS = {
    "basic": {
        "name": "Basic",
        "price": 4.99,
        "priceUSD": 4.99,
        "priceUSDT": 4.99,
        "tier": "BASIC",
        "features": [
            "Real-time GPS tracking",
            "30-day location history",
            "24 hour response"
        ]
    },
    "premium": {
        "name": "Premium",
        "price": 9.99,
        "priceUSD": 9.99,
        "priceUSDT": 9.99,
        "tier": "PREMIUM",
        "features": [
            "Real-time GPS tracking",
            "30-day location history",
            "SMS tracking",
            "24/7 Live chat support",
            "1 hour response"
        ]
    }
}

# ========== Get Available Plans ==========
@router.get("/plans")
async def get_plans():
    return {"plans": PLANS}

# ========== Get User's Subscriptions ==========
@router.get("/my")
async def get_my_subscriptions(current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    subscriptions = await db.subscriptions.find({
        "userId": ObjectId(current_user["id"]),
        "status": "active"
    }).to_list(100)
    
    result = []
    for sub in subscriptions:
        device = await db.devices.find_one({"_id": sub["deviceId"]})
        result.append({
            "id": str(sub["_id"]),
            "deviceId": str(sub["deviceId"]),
            "deviceName": device["deviceName"] if device else "Unknown",
            "plan": sub["plan"],
            "amount": sub["amount"],
            "status": sub["status"],
            "startDate": sub["startDate"],
            "endDate": sub["endDate"],
            "autoRenew": sub.get("autoRenew", True),
            "paymentMethod": sub["paymentMethod"]
        })
    
    return {"subscriptions": result}

# ========== Get Device Subscription ==========
@router.get("/device/{device_id}")
async def get_device_subscription(
    device_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    device = await db.devices.find_one({"_id": ObjectId(device_id)})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Verify ownership
    if str(device.get("owner")) != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    subscription = await db.subscriptions.find_one({
        "deviceId": ObjectId(device_id),
        "status": "active"
    })
    
    if not subscription:
        return {"hasSubscription": False, "subscription": None}
    
    return {
        "hasSubscription": True,
        "subscription": {
            "id": str(subscription["_id"]),
            "plan": subscription["plan"],
            "amount": subscription["amount"],
            "status": subscription["status"],
            "startDate": subscription["startDate"],
            "endDate": subscription["endDate"],
            "autoRenew": subscription.get("autoRenew", True)
        }
    }

# ========== Create Subscription (After Payment) ==========
async def create_subscription(
    device_id: str,
    user_id: str,
    plan: str,
    amount: float,
    payment_method: str,
    transaction_id: str = None
):
    db = get_db()
    
    # Deactivate old subscriptions for this device
    await db.subscriptions.update_many(
        {"deviceId": ObjectId(device_id), "status": "active"},
        {"$set": {"status": "expired"}}
    )
    
    # Calculate expiry date (30 days from now)
    expiry_date = datetime.now(timezone.utc) + timedelta(days=30)
    
    subscription = {
        "deviceId": ObjectId(device_id),
        "userId": ObjectId(user_id),
        "plan": plan,
        "amount": amount,
        "status": "active",
        "paymentMethod": payment_method,
        "type": "new",
        "startDate": datetime.now(timezone.utc),
        "endDate": expiry_date,
        "lastPaymentDate": datetime.now(timezone.utc),
        "autoRenew": True,
        "createdAt": datetime.now(timezone.utc)
    }
    
    if transaction_id:
        subscription["transactionId"] = transaction_id
    
    result = await db.subscriptions.insert_one(subscription)
    
    # Update device
    await db.devices.update_one(
        {"_id": ObjectId(device_id)},
        {"$set": {
            "status": "active",
            "subscription": {
                "plan": plan,
                "active": True,
                "expiresAt": expiry_date
            }
        }}
    )
    
    return str(result.inserted_id)

# ========== Cancel Subscription ==========
@router.post("/cancel/{subscription_id}")
async def cancel_subscription(
    subscription_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    subscription = await db.subscriptions.find_one({"_id": ObjectId(subscription_id)})
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Verify ownership
    if str(subscription["userId"]) != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.subscriptions.update_one(
        {"_id": ObjectId(subscription_id)},
        {"$set": {"autoRenew": False, "status": "cancelled"}}
    )
    
    return {"success": True, "message": "Subscription cancelled. Service will continue until expiry date."}

# ========== Reactivate Subscription ==========
@router.post("/reactivate/{subscription_id}")
async def reactivate_subscription(
    subscription_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    subscription = await db.subscriptions.find_one({"_id": ObjectId(subscription_id)})
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if str(subscription["userId"]) != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if subscription["endDate"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Subscription has expired. Please purchase a new one.")
    
    await db.subscriptions.update_one(
        {"_id": ObjectId(subscription_id)},
        {"$set": {"autoRenew": True, "status": "active"}}
    )
    
    return {"success": True, "message": "Auto-renewal reactivated"}

# ========== Check and Process Renewals (Background Job) ==========
async def process_expiring_subscriptions():
    db = get_db()
    
    # Find subscriptions expiring in less than 3 days
    expiry_threshold = datetime.now(timezone.utc) + timedelta(days=3)
    
    expiring = await db.subscriptions.find({
        "status": "active",
        "autoRenew": True,
        "endDate": {"$lt": expiry_threshold}
    }).to_list(100)
    
    for sub in expiring:
        # Send renewal reminder
        device = await db.devices.find_one({"_id": sub["deviceId"]})
        user = await db.users.find_one({"_id": sub["userId"]})
        
        if user and user.get("email"):
            await send_email(
                user["email"],
                "Subscription Renewal Reminder",
                f"Your Silent Guardian subscription for {device['deviceName'] if device else 'your device'} will expire on {sub['endDate'].strftime('%Y-%m-%d')}. Please renew to continue tracking."
            )

# ========== Admin: Get All Subscriptions ==========
@router.get("/admin/all")
async def get_all_subscriptions(
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
    
    subscriptions = await db.subscriptions.find(query).skip(skip).limit(limit).to_list(limit)
    total = await db.subscriptions.count_documents(query)
    
    result = []
    for sub in subscriptions:
        device = await db.devices.find_one({"_id": sub["deviceId"]})
        user = await db.users.find_one({"_id": sub["userId"]})
        
        result.append({
            "id": str(sub["_id"]),
            "deviceName": device["deviceName"] if device else "Unknown",
            "userName": user["fullName"] if user else "Unknown",
            "userEmail": user["email"] if user else "Unknown",
            "plan": sub["plan"],
            "amount": sub["amount"],
            "status": sub["status"],
            "startDate": sub["startDate"],
            "endDate": sub["endDate"],
            "paymentMethod": sub["paymentMethod"],
            "autoRenew": sub.get("autoRenew", True),
            "createdAt": sub["createdAt"]
        })
    
    return {
        "subscriptions": result,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

# ========== Admin: Get Subscription Stats ==========
@router.get("/admin/stats")
async def get_subscription_stats(current_user: dict = Depends(get_current_admin)):
    db = get_db()
    
    total_active = await db.subscriptions.count_documents({"status": "active"})
    total_expired = await db.subscriptions.count_documents({"status": "expired"})
    total_cancelled = await db.subscriptions.count_documents({"status": "cancelled"})
    
    # Revenue by plan
    pipeline = [
        {"$match": {"status": "active"}},
        {"$group": {
            "_id": "$plan",
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    revenue_by_plan = await db.subscriptions.aggregate(pipeline).to_list(None)
    
    # Expiring soon (next 7 days)
    expiring_soon = await db.subscriptions.count_documents({
        "status": "active",
        "endDate": {"$lt": datetime.now(timezone.utc) + timedelta(days=7)}
    })
    
    return {
        "totalActive": total_active,
        "totalExpired": total_expired,
        "totalCancelled": total_cancelled,
        "expiringSoon": expiring_soon,
        "revenueByPlan": {item["_id"]: {"total": item["total"], "count": item["count"]} for item in revenue_by_plan}
    }
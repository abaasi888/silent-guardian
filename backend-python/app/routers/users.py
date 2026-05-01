from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId
from app.database import get_db
from app.auth import get_current_user, get_current_admin
from app.services.email_service import send_email

router = APIRouter()

# ========== Models ==========
class UserUpdate(BaseModel):
    fullName: Optional[str] = None
    phone: Optional[str] = None

class KycSubmit(BaseModel):
    idDocument: str
    selfie: str
    businessDocs: Optional[str] = None

class UserApproval(BaseModel):
    userId: str
    approved: bool

# ========== Get Current User Profile ==========
@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": str(user["_id"]),
        "fullName": user["fullName"],
        "email": user["email"],
        "phone": user.get("phone", ""),
        "accountType": user["accountType"],
        "kycStatus": user.get("kycStatus", "pending"),
        "isApproved": user.get("isApproved", False),
        "devices": user.get("devices", []),
        "createdAt": user["createdAt"].isoformat() if user["createdAt"] else None
    }

# ========== Update User Profile ==========
@router.put("/me")
async def update_me(
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    update_fields = {}
    if update_data.fullName:
        update_fields["fullName"] = update_data.fullName
    if update_data.phone:
        update_fields["phone"] = update_data.phone
    
    update_fields["updatedAt"] = datetime.now(timezone.utc)
    
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": update_fields}
    )
    
    return {"success": True, "message": "Profile updated successfully"}

# ========== Submit KYC ==========
@router.post("/kyc")
async def submit_kyc(
    kyc_data: KycSubmit,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {
            "kycStatus": "pending",
            "kycDocuments": {
                "idDocument": kyc_data.idDocument,
                "selfie": kyc_data.selfie,
                "businessDocs": kyc_data.businessDocs,
                "submittedAt": datetime.now(timezone.utc)
            },
            "updatedAt": datetime.now(timezone.utc)
        }}
    )
    
    # Notify admin (in production, send email)
    await db.admin_notifications.insert_one({
        "type": "kyc_submission",
        "userId": ObjectId(current_user["id"]),
        "userName": current_user["data"]["fullName"],
        "userEmail": current_user["data"]["email"],
        "status": "pending",
        "createdAt": datetime.now(timezone.utc)
    })
    
    return {"success": True, "message": "KYC documents submitted for review"}

# ========== Get KYC Status ==========
@router.get("/kyc/status")
async def get_kyc_status(current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    
    return {
        "status": user.get("kycStatus", "pending"),
        "submittedAt": user.get("kycDocuments", {}).get("submittedAt"),
        "message": "KYC pending approval" if user.get("kycStatus") == "pending" else "KYC approved"
    }

# ========== Get User by ID (Admin) ==========
@router.get("/{user_id}")
async def get_user(
    user_id: str,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get devices
    devices = await db.devices.find({"owner": ObjectId(user_id)}).to_list(100)
    
    # Get subscriptions
    subscriptions = await db.subscriptions.find({"userId": ObjectId(user_id)}).to_list(100)
    
    return {
        "id": str(user["_id"]),
        "fullName": user["fullName"],
        "email": user["email"],
        "phone": user.get("phone", ""),
        "accountType": user["accountType"],
        "kycStatus": user.get("kycStatus", "pending"),
        "isApproved": user.get("isApproved", False),
        "devices": [{
            "id": str(d["_id"]),
            "deviceName": d["deviceName"],
            "status": d["status"],
            "lastSeen": d.get("lastSeen")
        } for d in devices],
        "subscriptions": [{
            "id": str(s["_id"]),
            "plan": s["plan"],
            "status": s["status"],
            "expiresAt": s["endDate"]
        } for s in subscriptions],
        "createdAt": user["createdAt"].isoformat() if user["createdAt"] else None
    }

# ========== Get All Users (Admin) ==========
@router.get("/")
async def get_all_users(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    accountType: Optional[str] = None,
    kycStatus: Optional[str] = None,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    query = {}
    if search:
        query["$or"] = [
            {"fullName": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    if accountType:
        query["accountType"] = accountType
    if kycStatus:
        query["kycStatus"] = kycStatus
    
    skip = (page - 1) * limit
    
    users = await db.users.find(query).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    return {
        "users": [{
            "id": str(u["_id"]),
            "fullName": u["fullName"],
            "email": u["email"],
            "phone": u.get("phone", ""),
            "accountType": u["accountType"],
            "kycStatus": u.get("kycStatus", "pending"),
            "isApproved": u.get("isApproved", False),
            "deviceCount": len(u.get("devices", [])),
            "createdAt": u["createdAt"].isoformat() if u["createdAt"] else None
        } for u in users],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

# ========== Approve User (Admin) ==========
@router.post("/approve")
async def approve_user(
    approval: UserApproval,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    user = await db.users.find_one({"_id": ObjectId(approval.userId)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"_id": ObjectId(approval.userId)},
        {"$set": {
            "isApproved": approval.approved,
            "updatedAt": datetime.now(timezone.utc)
        }}
    )
    
    # Send email notification
    if approval.approved:
        subject = "Your Silent Guardian account has been approved"
        body = f"Dear {user['fullName']},\n\nYour account has been approved. You can now log in and start using Silent Guardian.\n\nBest regards,\nSilent Guardian Team"
        await send_email(user["email"], subject, body)
    
    return {"success": True, "message": f"User {'approved' if approval.approved else 'rejected'}"}

# ========== Approve KYC (Admin) ==========
@router.post("/{user_id}/kyc/approve")
async def approve_kyc(
    user_id: str,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "kycStatus": "approved",
            "updatedAt": datetime.now(timezone.utc)
        }}
    )
    
    return {"success": True, "message": "KYC approved successfully"}

# ========== Delete User (Admin) ==========
@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete user's devices
    await db.devices.delete_many({"owner": ObjectId(user_id)})
    
    # Delete user's subscriptions
    await db.subscriptions.delete_many({"userId": ObjectId(user_id)})
    
    # Delete refresh tokens
    await db.refresh_tokens.delete_many({"userId": ObjectId(user_id), "userType": "user"})
    
    return {"success": True, "message": "User deleted successfully"}
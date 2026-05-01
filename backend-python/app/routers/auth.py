from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.database import get_db
from app.auth import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.config import settings
from bson import ObjectId
import uuid

router = APIRouter()

# ========== Request/Response Models ==========
class UserRegister(BaseModel):
    fullName: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: str = ""
    accountType: str = "ordinary"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class EmployeeLogin(BaseModel):
    email: EmailStr
    password: str

class RefreshToken(BaseModel):
    refresh_token: str

class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

# ========== User Registration ==========
@router.post("/register")
async def register(user_data: UserRegister):
    db = get_db()
    
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    hashed_password = get_password_hash(user_data.password)
    
    user = {
        "fullName": user_data.fullName,
        "email": user_data.email,
        "password": hashed_password,
        "phone": user_data.phone,
        "accountType": user_data.accountType,
        "kycStatus": "pending",
        "isApproved": user_data.accountType == "admin",
        "devices": [],
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }
    
    result = await db.users.insert_one(user)
    
    # If corporate, create pending approval notification
    if user_data.accountType == "corporate":
        await db.admin_notifications.insert_one({
            "type": "corporate_registration",
            "userId": result.inserted_id,
            "userName": user_data.fullName,
            "userEmail": user_data.email,
            "status": "pending",
            "createdAt": datetime.now(timezone.utc)
        })
    
    return {
        "success": True,
        "message": "Registration successful. Please wait for approval.",
        "userId": str(result.inserted_id)
    }

# ========== User Login ==========
@router.post("/login")
async def login(login_data: UserLogin):
    db = get_db()
    
    user = await db.users.find_one({"email": login_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.get("isApproved", False) and user["accountType"] != "admin":
        raise HTTPException(status_code=401, detail="Account pending approval")
    
    # Create tokens
    access_token = create_access_token(
        data={
            "sub": str(user["_id"]),
            "type": "user",
            "email": user["email"],
            "role": user["accountType"]
        },
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    refresh_token = create_refresh_token(
        data={"sub": str(user["_id"]), "type": "user"}
    )
    
    # Store refresh token
    await db.refresh_tokens.insert_one({
        "token": refresh_token,
        "userId": user["_id"],
        "userType": "user",
        "expiresAt": datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "createdAt": datetime.now(timezone.utc)
    })
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "fullName": user["fullName"],
            "accountType": user["accountType"],
            "kycStatus": user.get("kycStatus", "pending"),
            "isApproved": user.get("isApproved", False),
            "phone": user.get("phone", "")
        }
    }

# ========== Employee Login ==========
@router.post("/employee/login")
async def employee_login(login_data: EmployeeLogin):
    db = get_db()
    
    employee = await db.employees.find_one({"email": login_data.email})
    if not employee:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(login_data.password, employee["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if employee.get("status") != "active":
        raise HTTPException(status_code=401, detail="Account not active")
    
    access_token = create_access_token(
        data={
            "sub": str(employee["_id"]),
            "type": "employee",
            "email": employee["email"],
            "role": "employee"
        },
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    refresh_token = create_refresh_token(
        data={"sub": str(employee["_id"]), "type": "employee"}
    )
    
    await db.refresh_tokens.insert_one({
        "token": refresh_token,
        "userId": employee["_id"],
        "userType": "employee",
        "expiresAt": datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "createdAt": datetime.now(timezone.utc)
    })
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "employee": {
            "id": str(employee["_id"]),
            "email": employee["email"],
            "fullName": employee["fullName"],
            "role": employee.get("role", "Sales Agent"),
            "employmentType": employee.get("employmentType", "contractor"),
            "commissionRate": employee.get("commissionRate", 30),
            "totalSignups": employee.get("totalSignups", 0),
            "totalCommission": employee.get("totalCommission", 0)
        }
    }

# ========== Refresh Token ==========
@router.post("/refresh")
async def refresh_token(refresh_data: RefreshToken):
    db = get_db()
    
    stored = await db.refresh_tokens.find_one({"token": refresh_data.refresh_token})
    if not stored or stored.get("expiresAt") < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    user_id = stored["userId"]
    user_type = stored.get("userType", "user")
    
    if user_type == "user":
        user = await db.users.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        new_access_token = create_access_token(
            data={"sub": str(user["_id"]), "type": "user", "email": user["email"], "role": user["accountType"]},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
    else:
        employee = await db.employees.find_one({"_id": user_id})
        if not employee:
            raise HTTPException(status_code=401, detail="Employee not found")
        
        new_access_token = create_access_token(
            data={"sub": str(employee["_id"]), "type": "employee", "email": employee["email"], "role": "employee"},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
    
    # Delete old refresh token (one-time use)
    await db.refresh_tokens.delete_one({"token": refresh_data.refresh_token})
    
    # Create new refresh token
    new_refresh_token = create_refresh_token(data={"sub": user_id, "type": user_type})
    await db.refresh_tokens.insert_one({
        "token": new_refresh_token,
        "userId": user_id,
        "userType": user_type,
        "expiresAt": datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "createdAt": datetime.now(timezone.utc)
    })
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

# ========== Logout ==========
@router.post("/logout")
async def logout(refresh_data: RefreshToken):
    db = get_db()
    await db.refresh_tokens.delete_one({"token": refresh_data.refresh_token})
    return {"success": True, "message": "Logged out successfully"}

# ========== Change Password ==========
@router.post("/change-password")
async def change_password(
    password_data: ChangePassword,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    collection = db.users if current_user["type"] == "user" else db.employees
    user = await collection.find_one({"_id": ObjectId(current_user["id"])})
    
    if not verify_password(password_data.current_password, user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    hashed_password = get_password_hash(password_data.new_password)
    
    await collection.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"password": hashed_password, "updatedAt": datetime.now(timezone.utc)}}
    )
    
    # Delete all refresh tokens for this user
    await db.refresh_tokens.delete_many({"userId": ObjectId(current_user["id"])})
    
    return {"success": True, "message": "Password changed successfully"}

# ========== Forgot Password ==========
@router.post("/forgot-password")
async def forgot_password(forgot_data: ForgotPassword):
    db = get_db()
    
    user = await db.users.find_one({"email": forgot_data.email})
    if not user:
        # Don't reveal if user exists for security
        return {"success": True, "message": "If your email is registered, you will receive a reset link"}
    
    # Create password reset token
    reset_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    await db.password_resets.insert_one({
        "token": reset_token,
        "userId": user["_id"],
        "email": user["email"],
        "expiresAt": expires_at,
        "createdAt": datetime.now(timezone.utc)
    })
    
    # Send email with reset link (implement email service)
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    
    # In production, send actual email
    print(f"Password reset link for {user['email']}: {reset_link}")
    
    return {"success": True, "message": "Password reset link sent to your email"}

# ========== Reset Password ==========
@router.post("/reset-password")
async def reset_password(reset_data: ResetPassword):
    db = get_db()
    
    reset_entry = await db.password_resets.find_one({"token": reset_data.token})
    if not reset_entry or reset_entry["expiresAt"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    hashed_password = get_password_hash(reset_data.new_password)
    
    await db.users.update_one(
        {"_id": reset_entry["userId"]},
        {"$set": {"password": hashed_password, "updatedAt": datetime.now(timezone.utc)}}
    )
    
    # Delete used reset token
    await db.password_resets.delete_many({"userId": reset_entry["userId"]})
    
    # Delete all refresh tokens
    await db.refresh_tokens.delete_many({"userId": reset_entry["userId"], "userType": "user"})
    
    return {"success": True, "message": "Password reset successfully"}
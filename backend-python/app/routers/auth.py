from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.auth import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.config import settings
from bson import ObjectId

router = APIRouter()

class UserRegister(BaseModel):
    fullName: str
    email: EmailStr
    password: str
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

@router.post("/register")
async def register(user_data: UserRegister):
    db = get_db()
    
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
    
    # If corporate, create pending approval notification for admin
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
        "message": "Registration successful. Please wait for approval.",
        "userId": str(result.inserted_id)
    }

@router.post("/login")
async def login(login_data: UserLogin):
    db = get_db()
    
    user = await db.users.find_one({"email": login_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("isApproved", False) and user["accountType"] != "admin":
        raise HTTPException(status_code=401, detail="Account pending approval")
    
    access_token = create_access_token(
        data={"sub": str(user["_id"]), "type": "user", "email": user["email"], "role": user["accountType"]},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    refresh_token = create_refresh_token(
        data={"sub": str(user["_id"]), "type": "user"}
    )
    
    # Store refresh token
    await db.refresh_tokens.insert_one({
        "token": refresh_token,
        "userId": user["_id"],
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
            "isApproved": user.get("isApproved", False)
        }
    }

@router.post("/employee/login")
async def employee_login(login_data: EmployeeLogin):
    db = get_db()
    
    employee = await db.employees.find_one({"email": login_data.email})
    if not employee:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(login_data.password, employee["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if employee.get("status") != "active":
        raise HTTPException(status_code=401, detail="Account not active")
    
    access_token = create_access_token(
        data={"sub": str(employee["_id"]), "type": "employee", "email": employee["email"], "role": "employee"},
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

@router.post("/refresh")
async def refresh_token(refresh_data: RefreshToken):
    db = get_db()
    
    stored = await db.refresh_tokens.find_one({"token": refresh_data.refresh_token})
    if not stored or stored.get("expiresAt") < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    # Get user info
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
    
    return {"access_token": new_access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(refresh_data: RefreshToken):
    db = get_db()
    await db.refresh_tokens.delete_one({"token": refresh_data.refresh_token})
    return {"message": "Logged out successfully"}
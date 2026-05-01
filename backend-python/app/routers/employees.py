from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId
from app.database import get_db
from app.auth import get_current_user, get_current_admin, get_current_employee, get_password_hash
from app.services.email_service import send_email

router = APIRouter()

# ========== Models ==========
class EmployeeRegister(BaseModel):
    fullName: str
    email: EmailStr
    phone: str
    password: str = Field(..., min_length=6)
    inviteCode: Optional[str] = None
    idDocument: str
    selfie: str
    cv: Optional[str] = None
    nssf: Optional[str] = None
    bankAccount: Optional[str] = None
    academics: Optional[str] = None

class EmployeeUpdate(BaseModel):
    fullName: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    commissionRate: Optional[int] = None
    baseSalary: Optional[float] = None

class EmployeeInvite(BaseModel):
    email: EmailStr
    fullName: str
    phone: str
    temporaryPassword: str = Field(..., min_length=6)

class PromoteToPermanent(BaseModel):
    employeeId: str
    baseSalary: float
    commissionRate: int = 10

# ========== Constants ==========
SIGNUPS_FOR_PERMANENT = 4000
MONTHS_FOR_PERMANENT = 12

# ========== Employee Registration ==========
@router.post("/register")
async def register_employee(employee_data: EmployeeRegister):
    db = get_db()
    
    # Check if email exists
    existing = await db.employees.find_one({"email": employee_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    hashed_password = get_password_hash(employee_data.password)
    
    employee = {
        "fullName": employee_data.fullName,
        "email": employee_data.email,
        "password": hashed_password,
        "phone": employee_data.phone,
        "role": "Sales Agent",
        "status": "pending",
        "commissionRate": 30,
        "baseSalary": 0,
        "employmentType": "contractor",
        "joinDate": datetime.now(timezone.utc),
        "totalSignups": 0,
        "totalCommission": 0,
        "lastPayout": None,
        "permanentEligible": False,
        "careerStage": "contractor",
        "kycStatus": "pending",
        "kycDocuments": {
            "idDocument": employee_data.idDocument,
            "selfie": employee_data.selfie,
            "cv": employee_data.cv,
            "nssf": employee_data.nssf,
            "bankAccount": employee_data.bankAccount,
            "academics": employee_data.academics
        },
        "signups": [],
        "createdAt": datetime.now(timezone.utc)
    }
    
    result = await db.employees.insert_one(employee)
    
    # Notify admin
    await db.admin_notifications.insert_one({
        "type": "employee_registration",
        "employeeId": result.inserted_id,
        "employeeName": employee_data.fullName,
        "employeeEmail": employee_data.email,
        "status": "pending",
        "createdAt": datetime.now(timezone.utc)
    })
    
    return {"success": True, "message": "Registration submitted for approval"}

# ========== Get Employee Profile ==========
@router.get("/profile")
async def get_employee_profile(current_user: dict = Depends(get_current_employee)):
    db = get_db()
    
    employee = await db.employees.find_one({"_id": ObjectId(current_user["id"])})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Calculate months employed
    months_employed = calculate_months_employed(employee["joinDate"])
    
    return {
        "id": str(employee["_id"]),
        "fullName": employee["fullName"],
        "email": employee["email"],
        "phone": employee.get("phone", ""),
        "role": employee.get("role", "Sales Agent"),
        "status": employee["status"],
        "commissionRate": employee.get("commissionRate", 30),
        "baseSalary": employee.get("baseSalary", 0),
        "employmentType": employee.get("employmentType", "contractor"),
        "joinDate": employee["joinDate"].isoformat() if employee["joinDate"] else None,
        "monthsEmployed": months_employed,
        "totalSignups": employee.get("totalSignups", 0),
        "totalCommission": employee.get("totalCommission", 0),
        "lastPayout": employee.get("lastPayout"),
        "permanentEligible": employee.get("permanentEligible", False),
        "careerStage": employee.get("careerStage", "contractor"),
        "kycStatus": employee.get("kycStatus", "pending")
    }

# ========== Update Employee Profile ==========
@router.put("/profile")
async def update_employee_profile(
    update_data: EmployeeUpdate,
    current_user: dict = Depends(get_current_employee)
):
    db = get_db()
    
    update_fields = {}
    if update_data.fullName:
        update_fields["fullName"] = update_data.fullName
    if update_data.phone:
        update_fields["phone"] = update_data.phone
    if update_data.role:
        update_fields["role"] = update_data.role
    if update_data.commissionRate:
        update_fields["commissionRate"] = update_data.commissionRate
    if update_data.baseSalary:
        update_fields["baseSalary"] = update_data.baseSalary
    
    if update_fields:
        update_fields["updatedAt"] = datetime.now(timezone.utc)
        await db.employees.update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$set": update_fields}
        )
    
    return {"success": True, "message": "Profile updated successfully"}

# ========== Get Employee Signups ==========
@router.get("/signups")
async def get_employee_signups(current_user: dict = Depends(get_current_employee)):
    db = get_db()
    
    employee = await db.employees.find_one({"_id": ObjectId(current_user["id"])})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Get full signup details with user info
    signups = []
    for signup in employee.get("signups", []):
        user = await db.users.find_one({"_id": signup.get("userId")})
        signups.append({
            "userId": str(signup.get("userId")) if signup.get("userId") else signup.get("userEmail", "Unknown"),
            "plan": signup.get("plan", "Basic"),
            "amount": signup.get("amount", 0),
            "date": signup.get("date"),
            "status": signup.get("status", "active"),
            "userName": user["fullName"] if user else None,
            "userEmail": user["email"] if user else signup.get("userEmail")
        })
    
    return signups

# ========== Get Employee Commission ==========
@router.get("/commission")
async def get_employee_commission(current_user: dict = Depends(get_current_employee)):
    db = get_db()
    
    employee = await db.employees.find_one({"_id": ObjectId(current_user["id"])})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Calculate monthly commission
    now = datetime.now(timezone.utc)
    start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    
    monthly_commission = 0
    monthly_signups = 0
    
    for signup in employee.get("signups", []):
        if signup.get("date"):
            signup_date = signup["date"]
            if isinstance(signup_date, str):
                signup_date = datetime.fromisoformat(signup_date.replace('Z', '+00:00'))
            if signup_date >= start_of_month:
                monthly_commission += signup.get("amount", 0) * (employee.get("commissionRate", 30) / 100)
                monthly_signups += 1
    
    return {
        "totalCommission": employee.get("totalCommission", 0),
        "monthlyCommission": monthly_commission,
        "totalSignups": employee.get("totalSignups", 0),
        "monthlySignups": monthly_signups,
        "commissionRate": employee.get("commissionRate", 30),
        "employmentType": employee.get("employmentType", "contractor")
    }

# ========== Generate Invite Link ==========
@router.get("/invite/generate")
async def generate_invite_link(current_user: dict = Depends(get_current_employee)):
    import uuid
    
    invite_code = f"EMP_{current_user['id']}_{uuid.uuid4().hex[:8].upper()}"
    invite_link = f"{settings.FRONTEND_URL}/register?ref={invite_code}"
    
    # Store invite
    db = get_db()
    await db.employee_invites.insert_one({
        "employeeId": ObjectId(current_user["id"]),
        "inviteCode": invite_code,
        "inviteLink": invite_link,
        "used": False,
        "createdAt": datetime.now(timezone.utc)
    })
    
    return {"inviteCode": invite_code, "inviteLink": invite_link}

# ========== Send Invite ==========
@router.post("/invite/send")
async def send_invite(
    email: str,
    inviteLink: str,
    current_user: dict = Depends(get_current_employee)
):
    # Send email invitation
    subject = "Invitation to join Silent Guardian"
    body = f"""
    Hello,
    
    You have been invited to join Silent Guardian as a user.
    
    Click the link below to register:
    {inviteLink}
    
    Regards,
    Silent Guardian Team
    """
    
    await send_email(email, subject, body)
    
    return {"success": True, "message": f"Invitation sent to {email}"}

# ========== Helper Functions ==========
def calculate_months_employed(join_date):
    now = datetime.now(timezone.utc)
    months = (now.year - join_date.year) * 12 + (now.month - join_date.month)
    return months

def check_permanent_eligibility(employee):
    months_employed = calculate_months_employed(employee["joinDate"])
    has_enough_signups = employee.get("totalSignups", 0) >= SIGNUPS_FOR_PERMANENT
    has_enough_tenure = months_employed >= MONTHS_FOR_PERMANENT
    
    return has_enough_signups and has_enough_tenure

# ========== Admin: Get All Employees ==========
@router.get("/admin/all")
async def get_all_employees(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    employmentType: Optional[str] = None,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    query = {}
    if status:
        query["status"] = status
    if employmentType:
        query["employmentType"] = employmentType
    
    skip = (page - 1) * limit
    
    employees = await db.employees.find(query).skip(skip).limit(limit).to_list(limit)
    total = await db.employees.count_documents(query)
    
    result = []
    for emp in employees:
        # Update permanent eligibility
        eligible = check_permanent_eligibility(emp)
        if eligible and emp.get("employmentType") == "contractor" and not emp.get("permanentEligible"):
            await db.employees.update_one(
                {"_id": emp["_id"]},
                {"$set": {"permanentEligible": True}}
            )
            emp["permanentEligible"] = True
        
        result.append({
            "id": str(emp["_id"]),
            "fullName": emp["fullName"],
            "email": emp["email"],
            "phone": emp.get("phone", ""),
            "role": emp.get("role", "Sales Agent"),
            "status": emp["status"],
            "commissionRate": emp.get("commissionRate", 30),
            "baseSalary": emp.get("baseSalary", 0),
            "employmentType": emp.get("employmentType", "contractor"),
            "totalSignups": emp.get("totalSignups", 0),
            "totalCommission": emp.get("totalCommission", 0),
            "permanentEligible": emp.get("permanentEligible", False),
            "joinDate": emp["joinDate"].isoformat() if emp["joinDate"] else None,
            "lastPayout": emp.get("lastPayout")
        })
    
    return {
        "employees": result,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

# ========== Admin: Approve Employee KYC ==========
@router.post("/admin/{employee_id}/approve-kyc")
async def approve_employee_kyc(
    employee_id: str,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    employee = await db.employees.find_one({"_id": ObjectId(employee_id)})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    await db.employees.update_one(
        {"_id": ObjectId(employee_id)},
        {"$set": {"kycStatus": "approved", "status": "active"}}
    )
    
    # Send email notification
    await send_email(
        employee["email"],
        "Your Silent Guardian Employee Account is Approved",
        f"Dear {employee['fullName']},\n\nYour account has been approved. You can now log in and start working.\n\nRegards,\nSilent Guardian Team"
    )
    
    return {"success": True, "message": "Employee KYC approved"}

# ========== Admin: Promote to Permanent ==========
@router.post("/admin/promote")
async def promote_to_permanent(
    promotion: PromoteToPermanent,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    employee = await db.employees.find_one({"_id": ObjectId(promotion.employeeId)})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check eligibility
    eligible = check_permanent_eligibility(employee)
    if not eligible:
        raise HTTPException(status_code=400, detail="Employee does not meet permanent eligibility requirements")
    
    await db.employees.update_one(
        {"_id": ObjectId(promotion.employeeId)},
        {"$set": {
            "employmentType": "permanent",
            "baseSalary": promotion.baseSalary,
            "commissionRate": promotion.commissionRate,
            "careerStage": "permanent",
            "permanentEligible": False,
            "promotionDate": datetime.now(timezone.utc)
        }}
    )
    
    # Send notification
    await send_email(
        employee["email"],
        "Congratulations! You are now a Permanent Employee",
        f"Dear {employee['fullName']},\n\nCongratulations! You have been promoted to Permanent Employee with a base salary of ${promotion.baseSalary}/month.\n\nRegards,\nSilent Guardian Team"
    )
    
    return {"success": True, "message": "Employee promoted to permanent"}

# ========== Admin: Delete Employee ==========
@router.delete("/admin/{employee_id}")
async def delete_employee(
    employee_id: str,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    result = await db.employees.delete_one({"_id": ObjectId(employee_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return {"success": True, "message": "Employee deleted successfully"}
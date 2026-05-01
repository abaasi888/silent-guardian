from fastapi import Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from app.database import get_db
from app.auth import verify_token
from app.config import settings

security = HTTPBearer()

# ========== Authentication Dependencies ==========

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Get current authenticated user from JWT token
    Returns user dict with id, email, type, and data
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    db = get_db()
    user_id = payload.get("sub")
    user_type = payload.get("type")
    
    if not user_id or not user_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user_type == "user":
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "type": "user",
            "data": user,
            "role": user.get("accountType", "ordinary")
        }
    
    elif user_type == "employee":
        employee = await db.employees.find_one({"_id": ObjectId(user_id)})
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        return {
            "id": str(employee["_id"]),
            "email": employee["email"],
            "type": "employee",
            "data": employee,
            "role": "employee"
        }
    
    elif user_type == "admin":
        admin = await db.users.find_one({"_id": ObjectId(user_id), "accountType": "admin"})
        if not admin:
            raise HTTPException(status_code=404, detail="Admin not found")
        
        return {
            "id": str(admin["_id"]),
            "email": admin["email"],
            "type": "admin",
            "data": admin,
            "role": "admin"
        }
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid user type",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_active_user(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get current active user (checks if account is active)
    """
    if current_user["data"].get("status") == "inactive":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    if current_user["type"] == "user" and not current_user["data"].get("isApproved"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account pending approval"
        )
    
    return current_user


async def get_current_admin(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get current user only if they have admin privileges
    """
    if current_user["role"] != "admin" and current_user["type"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user


async def get_current_employee(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get current user only if they are an employee
    """
    if current_user["type"] != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee access required"
        )
    
    if current_user["data"].get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee account not active"
        )
    
    return current_user


async def get_current_user_or_none(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """
    Get current user if authenticated, otherwise return None
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


# ========== Pagination Dependencies ==========

async def get_pagination_params(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("createdAt", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order")
) -> Dict[str, Any]:
    """
    Get pagination parameters for database queries
    """
    skip = (page - 1) * limit
    sort_direction = -1 if sort_order == "desc" else 1
    
    return {
        "skip": skip,
        "limit": limit,
        "sort": [(sort_by, sort_direction)],
        "page": page,
        "per_page": limit
    }


# ========== Date Range Dependencies ==========

async def get_date_range(
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    days: Optional[int] = Query(None, ge=1, le=365, description="Number of days back")
) -> Dict[str, datetime]:
    """
    Get date range for queries
    """
    now = datetime.now(timezone.utc)
    
    if days:
        start = now - timedelta(days=days)
        end = now
    elif start_date and end_date:
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    elif start_date:
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end = now
    elif end_date:
        start = datetime.fromisoformat("2020-01-01T00:00:00+00:00")
        end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    else:
        start = datetime.fromisoformat("2020-01-01T00:00:00+00:00")
        end = now
    
    return {"start": start, "end": end}


# ========== Query Filter Dependencies ==========

async def get_user_filters(
    search: Optional[str] = Query(None, description="Search by name or email"),
    account_type: Optional[str] = Query(None, description="Filter by account type"),
    kyc_status: Optional[str] = Query(None, description="Filter by KYC status"),
    is_approved: Optional[bool] = Query(None, description="Filter by approval status")
) -> Dict[str, Any]:
    """
    Build user filter query
    """
    query = {}
    
    if search:
        query["$or"] = [
            {"fullName": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    if account_type:
        query["accountType"] = account_type
    
    if kyc_status:
        query["kycStatus"] = kyc_status
    
    if is_approved is not None:
        query["isApproved"] = is_approved
    
    return query


async def get_device_filters(
    search: Optional[str] = Query(None, description="Search by device name or ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    manufacturer: Optional[str] = Query(None, description="Filter by manufacturer"),
    is_online: Optional[bool] = Query(None, description="Filter by online status")
) -> Dict[str, Any]:
    """
    Build device filter query
    """
    query = {}
    
    if search:
        query["$or"] = [
            {"deviceName": {"$regex": search, "$options": "i"}},
            {"deviceId": {"$regex": search, "$options": "i"}},
            {"hardwareId": {"$regex": search, "$options": "i"}}
        ]
    
    if status:
        query["status"] = status
    
    if manufacturer:
        query["manufacturer"] = manufacturer
    
    if is_online is not None:
        query["isOnline"] = is_online
    
    return query


async def get_employee_filters(
    search: Optional[str] = Query(None, description="Search by name or email"),
    status: Optional[str] = Query(None, description="Filter by status"),
    employment_type: Optional[str] = Query(None, description="Filter by employment type"),
    role: Optional[str] = Query(None, description="Filter by role")
) -> Dict[str, Any]:
    """
    Build employee filter query
    """
    query = {}
    
    if search:
        query["$or"] = [
            {"fullName": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    if status:
        query["status"] = status
    
    if employment_type:
        query["employmentType"] = employment_type
    
    if role:
        query["role"] = role
    
    return query


async def get_ticket_filters(
    status_filter: Optional[str] = Query(None, description="Filter by status", alias="status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    assigned_to: Optional[str] = Query(None, description="Filter by assigned employee")
) -> Dict[str, Any]:
    """
    Build ticket filter query
    """
    query = {}
    
    if status_filter:
        query["status"] = status_filter
    
    if priority:
        query["priority"] = priority
    
    if assigned_to:
        query["assignedTo"] = ObjectId(assigned_to)
    
    return query


# ========== Validation Dependencies ==========

async def validate_device_id(device_id: str) -> str:
    """
    Validate device ID format
    """
    import re
    pattern = r'^[A-Za-z0-9\-_]{8,50}$'
    if not re.match(pattern, device_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid device ID format"
        )
    return device_id


async def validate_imei(imei: str) -> str:
    """
    Validate IMEI number format
    """
    import re
    pattern = r'^\d{15}$'
    if not re.match(pattern, imei):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid IMEI number (must be 15 digits)"
        )
    return imei


async def validate_phone(phone: str) -> str:
    """
    Validate phone number format
    """
    import re
    pattern = r'^\+?[1-9]\d{1,14}$'
    if not re.match(pattern, phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format"
        )
    return phone


async def validate_email(email: str) -> str:
    """
    Validate email format
    """
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
    return email.lower()


# ========== Rate Limiting Dependencies ==========

class RateLimiter:
    """
    Simple in-memory rate limiter
    """
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, list] = {}
    
    async def check_rate_limit(self, client_id: str) -> bool:
        """
        Check if client has exceeded rate limit
        """
        now = datetime.now(timezone.utc).timestamp()
        cutoff = now - 60  # Last 60 seconds
        
        if client_id not in self.requests:
            self.requests[client_id] = []
        
        # Clean old requests
        self.requests[client_id] = [t for t in self.requests[client_id] if t > cutoff]
        
        if len(self.requests[client_id]) >= self.requests_per_minute:
            return False
        
        self.requests[client_id].append(now)
        return True


rate_limiter = RateLimiter(requests_per_minute=60)


async def check_rate_limit(
    request: Request,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_or_none)
) -> None:
    """
    Check rate limit for request
    """
    client_id = current_user["id"] if current_user else request.client.host
    
    if not await rate_limiter.check_rate_limit(client_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later."
        )


# ========== Database Transaction Dependencies ==========

async def get_transaction():
    """
    Get database session for transactions
    """
    from app.database import get_db
    db = get_db()
    
    # Start session for transaction
    async with await db.client.start_session() as session:
        async with session.start_transaction():
            yield session


# ========== Background Task Dependencies ==========

from fastapi import BackgroundTasks


async def add_background_task(
    background_tasks: BackgroundTasks,
    task_func,
    *args,
    **kwargs
) -> None:
    """
    Add a background task to be executed after response
    """
    background_tasks.add_task(task_func, *args, **kwargs)


# ========== Common Response Models ==========

from pydantic import BaseModel
from typing import Generic, TypeVar, List, Optional

T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Generic paginated response model
    """
    items: List[T]
    total: int
    page: int
    per_page: int
    pages: int
    has_next: bool
    has_prev: bool


class ApiResponse(BaseModel, Generic[T]):
    """
    Generic API response model
    """
    success: bool = True
    message: Optional[str] = None
    data: Optional[T] = None
    error: Optional[str] = None


class ErrorResponse(BaseModel):
    """
    Error response model
    """
    success: bool = False
    error: str
    code: Optional[str] = None
    details: Optional[Dict] = None


# ========== Helper Functions ==========

def create_paginated_response(
    items: List,
    total: int,
    page: int,
    per_page: int
) -> Dict[str, Any]:
    """
    Create paginated response dictionary
    """
    pages = (total + per_page - 1) // per_page if total > 0 else 1
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
        "has_next": page < pages,
        "has_prev": page > 1
    }


def create_success_response(
    data: Any = None,
    message: str = None
) -> Dict[str, Any]:
    """
    Create success response dictionary
    """
    response = {"success": True}
    if data is not None:
        response["data"] = data
    if message:
        response["message"] = message
    return response


def create_error_response(
    error: str,
    code: str = None,
    details: Dict = None
) -> Dict[str, Any]:
    """
    Create error response dictionary
    """
    response = {"success": False, "error": error}
    if code:
        response["code"] = code
    if details:
        response["details"] = details
    return response


from datetime import timedelta
from fastapi import Request
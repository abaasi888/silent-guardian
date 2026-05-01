from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, WebSocket
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import get_db
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = data.copy()
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        user_type: str = payload.get("type")
        if user_id is None or user_type is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    db = get_db()
    
    if user_type == "user":
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    elif user_type == "employee":
        user = await db.employees.find_one({"_id": ObjectId(user_id)})
    elif user_type == "admin":
        user = await db.users.find_one({"_id": ObjectId(user_id), "accountType": "admin"})
    else:
        raise credentials_exception
    
    if user is None:
        raise credentials_exception
    
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "type": user_type,
        "data": user,
        "role": "admin" if user.get("accountType") == "admin" else user_type
    }

async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    if current_user["data"].get("status") == "inactive":
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_admin(current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "user" or current_user["data"].get("accountType") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def get_current_employee(current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "employee":
        raise HTTPException(status_code=403, detail="Employee access required")
    return current_user

async def websocket_auth(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        user_type = payload.get("type")
        if user_id is None:
            return None
        return {"id": user_id, "type": user_type}
    except JWTError:
        return None
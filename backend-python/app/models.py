from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

# ========== User Model ==========
class User(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    fullName: str
    email: str
    password: str
    phone: Optional[str] = ""
    accountType: str = "ordinary"
    kycStatus: str = "pending"
    kycDocuments: Optional[dict] = None
    isApproved: bool = False
    devices: List[str] = []
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ========== Device Model ==========
class Device(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    deviceId: str
    hardwareId: str
    deviceName: str
    owner: PyObjectId
    status: str = "inactive"
    isOnline: bool = False
    lastLocation: Optional[dict] = None
    locationHistory: List[dict] = []
    battery: int = 100
    firmware: str = "1.0.0"
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    androidVersion: Optional[str] = None
    imei: Optional[str] = None
    subscription: Optional[dict] = None
    lastSeen: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ========== Employee Model ==========
class Employee(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    fullName: str
    email: str
    password: str
    phone: str
    role: str = "Sales Agent"
    status: str = "pending"
    commissionRate: int = 30
    baseSalary: float = 0
    employmentType: str = "contractor"
    joinDate: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    totalSignups: int = 0
    totalCommission: float = 0
    lastPayout: Optional[datetime] = None
    permanentEligible: bool = False
    careerStage: str = "contractor"
    promotionDate: Optional[datetime] = None
    kycStatus: str = "pending"
    kycDocuments: Optional[dict] = None
    signups: List[dict] = []
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ========== Subscription Model ==========
class Subscription(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    deviceId: PyObjectId
    userId: PyObjectId
    plan: str  # basic, premium
    amount: float
    status: str = "active"  # active, expired, cancelled
    paymentMethod: str  # crypto, mtn, airtel, card
    type: str = "new"  # new, renewal
    startDate: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    endDate: datetime
    lastPaymentDate: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    autoRenew: bool = True
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ========== Transaction Model ==========
class Transaction(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    transactionId: str
    userId: Optional[PyObjectId] = None
    deviceId: Optional[PyObjectId] = None
    employeeId: Optional[PyObjectId] = None
    amount: float
    currency: str = "USD"
    paymentMethod: str  # crypto, mtn, airtel, card
    status: str = "pending"  # pending, completed, failed, refunded
    type: str  # subscription, commission, payout
    metadata: Optional[dict] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completedAt: Optional[datetime] = None
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ========== Command Model ==========
class Command(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    deviceId: PyObjectId
    type: str
    params: Optional[dict] = {}
    status: str = "pending"
    issuedBy: Optional[PyObjectId] = None
    executedAt: Optional[datetime] = None
    result: Optional[str] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ========== Ticket Model ==========
class Ticket(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    userId: PyObjectId
    subject: str
    description: str
    priority: str = "medium"
    status: str = "open"
    messages: List[dict] = []
    assignedTo: Optional[PyObjectId] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ========== IMEI Blacklist ==========
class ImeiBlacklist(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    imei: str
    reason: str
    reportedBy: Optional[PyObjectId] = None
    reportedByEmail: Optional[str] = None
    status: str = "active"
    deviceInfo: Optional[dict] = None
    resolvedAt: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ========== Community Alert ==========
class CommunityAlert(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    type: str
    title: str
    description: str
    location: dict
    radius: int = 1000
    deviceId: Optional[PyObjectId] = None
    reportedBy: Optional[PyObjectId] = None
    status: str = "active"
    reward: Optional[float] = None
    contactInfo: Optional[str] = None
    expiresAt: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ========== Chat Message ==========
class ChatMessage(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    sender: str
    senderId: PyObjectId
    recipient: str
    recipientId: PyObjectId
    message: str
    read: bool = False
    attachments: List[str] = []
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
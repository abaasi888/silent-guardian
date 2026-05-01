from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient = None
database = None

async def connect_to_mongo():
    global client, database
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.DATABASE_NAME]
    
    # Create indexes
    await create_indexes()

async def close_mongo_connection():
    global client
    if client:
        client.close()

def get_db():
    return database

async def create_indexes():
    db = get_db()
    
    # Users collection
    await db.users.create_index("email", unique=True)
    await db.users.create_index("createdAt")
    
    # Devices collection
    await db.devices.create_index("hardwareId", unique=True)
    await db.devices.create_index("deviceId", unique=True)
    await db.devices.create_index("owner")
    await db.devices.create_index([("lastLocation", "2dsphere")])
    
    # Employees collection
    await db.employees.create_index("email", unique=True)
    
    # Commands collection
    await db.commands.create_index([("deviceId", 1), ("status", 1)])
    await db.commands.create_index("createdAt")
    
    # Transactions collection
    await db.transactions.create_index("userId")
    await db.transactions.create_index("status")
    await db.transactions.create_index("createdAt")
    
    # IMEI Blacklist
    await db.imei_blacklist.create_index("imei", unique=True)
    
    # Community Alerts
    await db.community_alerts.create_index([("location", "2dsphere")])
    await db.community_alerts.create_index("status")
    
    # Subscriptions
    await db.subscriptions.create_index([("deviceId", 1), ("status", 1)])
    await db.subscriptions.create_index("expiresAt")
    
    print("Database indexes created")
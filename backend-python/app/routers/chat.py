from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from datetime import datetime, timezone
from typing import Optional, List, Dict, Set
from pydantic import BaseModel
from bson import ObjectId
from app.database import get_db
from app.auth import get_current_user, get_current_admin, get_current_employee
import json

router = APIRouter()

# ========== Models ==========
class ChatMessageSend(BaseModel):
    recipientId: str
    recipientType: str  # admin, employee, user
    message: str
    attachment: Optional[str] = None

class ChatMessageResponse(BaseModel):
    id: str
    sender: str
    senderId: str
    senderName: str
    recipient: str
    recipientId: str
    message: str
    read: bool
    createdAt: str
    attachments: List[str] = []

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str, user_type: str):
        await websocket.accept()
        key = f"{user_type}_{user_id}"
        if key not in self.active_connections:
            self.active_connections[key] = set()
        self.active_connections[key].add(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: str, user_type: str):
        key = f"{user_type}_{user_id}"
        if key in self.active_connections:
            self.active_connections[key].discard(websocket)
            if not self.active_connections[key]:
                del self.active_connections[key]
    
    async def send_personal_message(self, message: dict, user_id: str, user_type: str):
        key = f"{user_type}_{user_id}"
        if key in self.active_connections:
            for connection in self.active_connections[key]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

# ========== WebSocket Endpoint ==========
@router.websocket("/ws/{token}")
async def websocket_chat(websocket: WebSocket, token: str):
    from app.auth import verify_token
    payload = verify_token(token)
    if not payload:
        await websocket.close(code=1008)
        return
    
    user_id = payload.get("sub")
    user_type = payload.get("type")
    
    await manager.connect(websocket, user_id, user_type)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})
            
            elif message.get("type") == "typing":
                recipient_id = message.get("recipientId")
                recipient_type = message.get("recipientType")
                if recipient_id and recipient_type:
                    await manager.send_personal_message({
                        "type": "typing",
                        "senderId": user_id,
                        "senderType": user_type,
                        "isTyping": message.get("isTyping", True)
                    }, recipient_id, recipient_type)
            
            elif message.get("type") == "mark_read":
                await mark_messages_read(message.get("chatId"))
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id, user_type)

# ========== Helper Functions ==========
async def mark_messages_read(chat_id: str):
    db = get_db()
    await db.chat_messages.update_many(
        {"_id": {"$in": [ObjectId(chat_id)]}, "read": False},
        {"$set": {"read": True}}
    )

async def get_user_name(user_id: str, user_type: str):
    db = get_db()
    if user_type == "user":
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        return user["fullName"] if user else "Unknown User"
    elif user_type == "employee":
        employee = await db.employees.find_one({"_id": ObjectId(user_id)})
        return employee["fullName"] if employee else "Unknown Employee"
    else:
        return "Admin"

# ========== Send Chat Message ==========
@router.post("/send")
async def send_chat_message(
    message_data: ChatMessageSend,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    chat_message = {
        "sender": current_user["type"],
        "senderId": ObjectId(current_user["id"]),
        "recipient": message_data.recipientType,
        "recipientId": ObjectId(message_data.recipientId),
        "message": message_data.message,
        "read": False,
        "attachments": [message_data.attachment] if message_data.attachment else [],
        "createdAt": datetime.now(timezone.utc)
    }
    
    result = await db.chat_messages.insert_one(chat_message)
    
    # Send real-time notification via WebSocket
    await manager.send_personal_message({
        "type": "new_message",
        "message": {
            "id": str(result.inserted_id),
            "sender": current_user["type"],
            "senderId": current_user["id"],
            "message": message_data.message,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
    }, message_data.recipientId, message_data.recipientType)
    
    return {
        "success": True,
        "messageId": str(result.inserted_id),
        "message": "Message sent"
    }

# ========== Get Chat Conversations ==========
@router.get("/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    user_id = current_user["id"]
    user_type = current_user["type"]
    
    # Get all unique conversation partners
    pipeline = [
        {"$match": {
            "$or": [
                {"sender": user_type, "senderId": ObjectId(user_id)},
                {"recipient": user_type, "recipientId": ObjectId(user_id)}
            ]
        }},
        {"$sort": {"createdAt": -1}},
        {"$group": {
            "_id": {
                "$cond": [
                    {"$eq": ["$sender", user_type]},
                    {"type": "$recipient", "id": "$recipientId"},
                    {"type": "$sender", "id": "$senderId"}
                ]
            },
            "lastMessage": {"$first": "$$ROOT"},
            "unreadCount": {
                "$sum": {
                    "$cond": [
                        {"$and": [
                            {"$eq": ["$recipient", user_type]},
                            {"$eq": ["$recipientId", ObjectId(user_id)]},
                            {"$eq": ["$read", False]}
                        ]},
                        1, 0
                    ]
                }
            }
        }}
    ]
    
    conversations = await db.chat_messages.aggregate(pipeline).to_list(None)
    
    result = []
    for conv in conversations:
        partner = conv["_id"]
        partner_type = partner["type"]
        partner_id = str(partner["id"])
        
        # Get partner name
        partner_name = await get_user_name(partner_id, partner_type)
        
        result.append({
            "id": partner_id,
            "name": partner_name,
            "type": partner_type,
            "lastMessage": conv["lastMessage"]["message"],
            "lastMessageTime": conv["lastMessage"]["createdAt"].isoformat(),
            "unreadCount": conv["unreadCount"]
        })
    
    return {"conversations": result}

# ========== Get Chat Messages ==========
@router.get("/messages/{partner_id}")
async def get_chat_messages(
    partner_id: str,
    partner_type: str,
    limit: int = 50,
    before: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    user_id = current_user["id"]
    user_type = current_user["type"]
    
    query = {
        "$or": [
            {"sender": user_type, "senderId": ObjectId(user_id), "recipient": partner_type, "recipientId": ObjectId(partner_id)},
            {"sender": partner_type, "senderId": ObjectId(partner_id), "recipient": user_type, "recipientId": ObjectId(user_id)}
        ]
    }
    
    if before:
        query["createdAt"] = {"$lt": datetime.fromisoformat(before.replace('Z', '+00:00'))}
    
    messages = await db.chat_messages.find(query).sort("createdAt", -1).limit(limit).to_list(limit)
    messages.reverse()
    
    # Mark messages as read
    await db.chat_messages.update_many(
        {
            "sender": partner_type,
            "senderId": ObjectId(partner_id),
            "recipient": user_type,
            "recipientId": ObjectId(user_id),
            "read": False
        },
        {"$set": {"read": True}}
    )
    
    result = []
    for msg in messages:
        sender_name = await get_user_name(str(msg["senderId"]), msg["sender"])
        result.append({
            "id": str(msg["_id"]),
            "sender": msg["sender"],
            "senderId": str(msg["senderId"]),
            "senderName": sender_name,
            "recipient": msg["recipient"],
            "recipientId": str(msg["recipientId"]),
            "message": msg["message"],
            "read": msg["read"],
            "createdAt": msg["createdAt"].isoformat(),
            "attachments": msg.get("attachments", [])
        })
    
    return {"messages": result}

# ========== Mark Messages as Read ==========
@router.post("/mark-read/{partner_id}")
async def mark_messages_read_endpoint(
    partner_id: str,
    partner_type: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    user_id = current_user["id"]
    user_type = current_user["type"]
    
    result = await db.chat_messages.update_many(
        {
            "sender": partner_type,
            "senderId": ObjectId(partner_id),
            "recipient": user_type,
            "recipientId": ObjectId(user_id),
            "read": False
        },
        {"$set": {"read": True}}
    )
    
    return {"success": True, "markedCount": result.modified_count}

# ========== Get Unread Count ==========
@router.get("/unread/count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    user_id = current_user["id"]
    user_type = current_user["type"]
    
    count = await db.chat_messages.count_documents({
        "recipient": user_type,
        "recipientId": ObjectId(user_id),
        "read": False
    })
    
    return {"unreadCount": count}

# ========== Admin: Get All Chats ==========
@router.get("/admin/chats")
async def get_all_chats(
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    # Get all unique chat participants
    pipeline = [
        {"$group": {
            "_id": {
                "userId": "$senderId",
                "userType": "$sender"
            },
            "lastMessage": {"$last": "$$ROOT"},
            "messageCount": {"$sum": 1}
        }},
        {"$sort": {"lastMessage.createdAt": -1}},
        {"$skip": (page - 1) * limit},
        {"$limit": limit}
    ]
    
    chats = await db.chat_messages.aggregate(pipeline).to_list(limit)
    total = await db.chat_messages.distinct("senderId")
    
    result = []
    for chat in chats:
        user_id = str(chat["_id"]["userId"])
        user_type = chat["_id"]["userType"]
        user_name = await get_user_name(user_id, user_type)
        
        result.append({
            "userId": user_id,
            "userName": user_name,
            "userType": user_type,
            "lastMessage": chat["lastMessage"]["message"],
            "lastMessageTime": chat["lastMessage"]["createdAt"].isoformat(),
            "messageCount": chat["messageCount"]
        })
    
    return {
        "chats": result,
        "total": len(total),
        "page": page,
        "limit": limit
    }
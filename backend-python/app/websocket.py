from fastapi import WebSocket, WebSocketDisconnect
from app.auth import websocket_auth
from app.database import get_db
from bson import ObjectId
import json
from datetime import datetime, timezone

active_connections: dict = {}

async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    
    # Authenticate
    token = websocket.query_params.get("token")
    user = await websocket_auth(token) if token else None
    
    if not user:
        await websocket.close(code=1008, reason="Unauthorized")
        return
    
    connection_id = f"{user['type']}_{user['id']}"
    active_connections[connection_id] = websocket
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})
            
            elif message.get("type") == "location":
                # Forward location to device owner
                await handle_location_update(message, user)
            
            elif message.get("type") == "command_response":
                await handle_command_response(message, user)
            
            elif message.get("type") == "chat":
                await handle_chat_message(message, user)
            
    except WebSocketDisconnect:
        if connection_id in active_connections:
            del active_connections[connection_id]

async def handle_location_update(message: dict, user: dict):
    # Store in database and notify connected clients
    db = get_db()
    device_id = message.get("deviceId")
    location = message.get("location")
    
    await db.devices.update_one(
        {"_id": ObjectId(device_id)},
        {
            "$set": {"lastLocation": location, "lastSeen": datetime.now(timezone.utc)},
            "$push": {"locationHistory": {"$each": [location], "$slice": -1000}}
        }
    )

async def handle_command_response(message: dict, user: dict):
    db = get_db()
    command_id = message.get("commandId")
    result = message.get("result")
    
    await db.commands.update_one(
        {"_id": ObjectId(command_id)},
        {"$set": {"status": "executed", "executedAt": datetime.now(timezone.utc), "result": result}}
    )

async def handle_chat_message(message: dict, user: dict):
    db = get_db()
    recipient_id = message.get("recipientId")
    recipient_type = message.get("recipientType")
    text = message.get("message")
    
    chat_message = {
        "sender": user["type"],
        "senderId": ObjectId(user["id"]),
        "recipient": recipient_type,
        "recipientId": ObjectId(recipient_id),
        "message": text,
        "read": False,
        "createdAt": datetime.now(timezone.utc)
    }
    
    result = await db.chat_messages.insert_one(chat_message)
    
    # Send to recipient if online
    connection_id = f"{recipient_type}_{recipient_id}"
    if connection_id in active_connections:
        await active_connections[connection_id].send_json({
            "type": "chat",
            "message": text,
            "sender": user["type"],
            "senderId": user["id"],
            "timestamp": chat_message["createdAt"].isoformat()
        })
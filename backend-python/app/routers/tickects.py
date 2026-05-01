from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId
from app.database import get_db
from app.auth import get_current_user, get_current_admin, get_current_employee

router = APIRouter()

# ========== Models ==========
class TicketCreate(BaseModel):
    subject: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    priority: str = "medium"  # low, medium, high

class TicketReply(BaseModel):
    message: str = Field(..., min_length=1)
    attachments: Optional[List[str]] = []

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assignedTo: Optional[str] = None

# ========== Create Support Ticket ==========
@router.post("/create")
async def create_ticket(
    ticket_data: TicketCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    ticket = {
        "userId": ObjectId(current_user["id"]),
        "userEmail": current_user["email"],
        "userName": current_user["data"].get("fullName", "User"),
        "subject": ticket_data.subject,
        "description": ticket_data.description,
        "priority": ticket_data.priority,
        "status": "open",
        "messages": [{
            "from": "user",
            "message": ticket_data.description,
            "attachments": [],
            "createdAt": datetime.now(timezone.utc)
        }],
        "assignedTo": None,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }
    
    result = await db.tickets.insert_one(ticket)
    
    # Notify admin
    await db.admin_notifications.insert_one({
        "type": "new_ticket",
        "ticketId": result.inserted_id,
        "ticketSubject": ticket_data.subject,
        "userId": ObjectId(current_user["id"]),
        "userName": current_user["data"].get("fullName", "User"),
        "status": "pending",
        "createdAt": datetime.now(timezone.utc)
    })
    
    return {
        "success": True,
        "ticketId": str(result.inserted_id),
        "message": "Ticket created successfully"
    }

# ========== Get My Tickets ==========
@router.get("/my")
async def get_my_tickets(
    page: int = 1,
    limit: int = 20,
    status_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    query = {"userId": ObjectId(current_user["id"])}
    if status_filter:
        query["status"] = status_filter
    
    skip = (page - 1) * limit
    
    tickets = await db.tickets.find(query).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.tickets.count_documents(query)
    
    return {
        "tickets": [{
            "id": str(t["_id"]),
            "subject": t["subject"],
            "priority": t["priority"],
            "status": t["status"],
            "lastUpdate": t["updatedAt"].isoformat() if t.get("updatedAt") else t["createdAt"].isoformat(),
            "messageCount": len(t.get("messages", [])),
            "createdAt": t["createdAt"].isoformat()
        } for t in tickets],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

# ========== Get Ticket Details ==========
@router.get("/{ticket_id}")
async def get_ticket_details(
    ticket_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    ticket = await db.tickets.find_one({"_id": ObjectId(ticket_id)})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check authorization
    if str(ticket["userId"]) != current_user["id"] and current_user["role"] != "admin" and current_user["type"] != "employee":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return {
        "id": str(ticket["_id"]),
        "subject": ticket["subject"],
        "description": ticket["description"],
        "priority": ticket["priority"],
        "status": ticket["status"],
        "messages": [{
            "from": msg["from"],
            "message": msg["message"],
            "attachments": msg.get("attachments", []),
            "createdAt": msg["createdAt"].isoformat() if msg["createdAt"] else None
        } for msg in ticket.get("messages", [])],
        "assignedTo": str(ticket["assignedTo"]) if ticket.get("assignedTo") else None,
        "createdAt": ticket["createdAt"].isoformat(),
        "updatedAt": ticket["updatedAt"].isoformat()
    }

# ========== Reply to Ticket ==========
@router.post("/{ticket_id}/reply")
async def reply_to_ticket(
    ticket_id: str,
    reply_data: TicketReply,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    ticket = await db.tickets.find_one({"_id": ObjectId(ticket_id)})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Determine sender type
    if current_user["role"] == "admin":
        sender = "admin"
    elif current_user["type"] == "employee":
        sender = "employee"
    else:
        sender = "user"
    
    # Check authorization
    if sender == "user" and str(ticket["userId"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    message = {
        "from": sender,
        "message": reply_data.message,
        "attachments": reply_data.attachments or [],
        "createdAt": datetime.now(timezone.utc)
    }
    
    await db.tickets.update_one(
        {"_id": ObjectId(ticket_id)},
        {
            "$push": {"messages": message},
            "$set": {"updatedAt": datetime.now(timezone.utc)}
        }
    )
    
    # Update status if user replied to closed ticket
    if sender == "user" and ticket["status"] == "closed":
        await db.tickets.update_one(
            {"_id": ObjectId(ticket_id)},
            {"$set": {"status": "open"}}
        )
    
    # Notify admin if user replied
    if sender == "user":
        await db.admin_notifications.insert_one({
            "type": "ticket_reply",
            "ticketId": ticket["_id"],
            "ticketSubject": ticket["subject"],
            "userId": ticket["userId"],
            "userName": ticket.get("userName", "User"),
            "message": reply_data.message[:100],
            "createdAt": datetime.now(timezone.utc)
        })
    
    return {"success": True, "message": "Reply sent successfully"}

# ========== Admin: Get All Tickets ==========
@router.get("/admin/all")
async def get_all_tickets(
    page: int = 1,
    limit: int = 20,
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    assigned_to: Optional[str] = None,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    query = {}
    if status_filter:
        query["status"] = status_filter
    if priority_filter:
        query["priority"] = priority_filter
    if assigned_to:
        query["assignedTo"] = ObjectId(assigned_to)
    
    skip = (page - 1) * limit
    
    tickets = await db.tickets.find(query).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.tickets.count_documents(query)
    
    result = []
    for ticket in tickets:
        result.append({
            "id": str(ticket["_id"]),
            "subject": ticket["subject"],
            "userName": ticket.get("userName", "Unknown"),
            "userEmail": ticket.get("userEmail", "Unknown"),
            "priority": ticket["priority"],
            "status": ticket["status"],
            "messageCount": len(ticket.get("messages", [])),
            "createdAt": ticket["createdAt"].isoformat(),
            "updatedAt": ticket["updatedAt"].isoformat()
        })
    
    return {
        "tickets": result,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

# ========== Admin: Update Ticket ==========
@router.put("/admin/{ticket_id}")
async def update_ticket(
    ticket_id: str,
    update_data: TicketUpdate,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    ticket = await db.tickets.find_one({"_id": ObjectId(ticket_id)})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    update_fields = {}
    if update_data.status:
        update_fields["status"] = update_data.status
    if update_data.priority:
        update_fields["priority"] = update_data.priority
    if update_data.assignedTo:
        update_fields["assignedTo"] = ObjectId(update_data.assignedTo)
    
    update_fields["updatedAt"] = datetime.now(timezone.utc)
    
    await db.tickets.update_one(
        {"_id": ObjectId(ticket_id)},
        {"$set": update_fields}
    )
    
    return {"success": True, "message": "Ticket updated"}

# ========== Admin: Assign Ticket ==========
@router.post("/admin/{ticket_id}/assign")
async def assign_ticket(
    ticket_id: str,
    employee_id: str,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    ticket = await db.tickets.find_one({"_id": ObjectId(ticket_id)})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    employee = await db.employees.find_one({"_id": ObjectId(employee_id)})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    await db.tickets.update_one(
        {"_id": ObjectId(ticket_id)},
        {
            "$set": {
                "assignedTo": ObjectId(employee_id),
                "assignedToName": employee["fullName"],
                "updatedAt": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"success": True, "message": f"Ticket assigned to {employee['fullName']}"}

# ========== Admin: Close Ticket ==========
@router.post("/admin/{ticket_id}/close")
async def close_ticket(
    ticket_id: str,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    ticket = await db.tickets.find_one({"_id": ObjectId(ticket_id)})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    await db.tickets.update_one(
        {"_id": ObjectId(ticket_id)},
        {
            "$set": {
                "status": "closed",
                "closedAt": datetime.now(timezone.utc),
                "closedBy": current_user["id"],
                "updatedAt": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"success": True, "message": "Ticket closed"}

# ========== Get Ticket Stats ==========
@router.get("/admin/stats")
async def get_ticket_stats(current_user: dict = Depends(get_current_admin)):
    db = get_db()
    
    open_count = await db.tickets.count_documents({"status": "open"})
    in_progress_count = await db.tickets.count_documents({"status": "in-progress"})
    closed_count = await db.tickets.count_documents({"status": "closed"})
    
    # Average response time (in hours)
    pipeline = [
        {"$unwind": "$messages"},
        {"$match": {"messages.from": {"$ne": "user"}}},
        {"$group": {
            "_id": "$_id",
            "firstResponse": {"$min": "$messages.createdAt"}
        }}
    ]
    
    # Priority distribution
    high_priority = await db.tickets.count_documents({"priority": "high", "status": {"$ne": "closed"}})
    medium_priority = await db.tickets.count_documents({"priority": "medium", "status": {"$ne": "closed"}})
    low_priority = await db.tickets.count_documents({"priority": "low", "status": {"$ne": "closed"}})
    
    return {
        "open": open_count,
        "inProgress": in_progress_count,
        "closed": closed_count,
        "total": open_count + in_progress_count + closed_count,
        "priorityBreakdown": {
            "high": high_priority,
            "medium": medium_priority,
            "low": low_priority
        }
    }
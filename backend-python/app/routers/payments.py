from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from datetime import datetime, timezone, timedelta
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId
import uuid
import hashlib
import hmac
import qrcode
import io
import base64
import requests
from app.database import get_db
from app.auth import get_current_user, get_current_admin
from app.config import settings
from app.services.email_service import send_email
from app.services.sms_service import send_sms

router = APIRouter()

# ========== Models ==========
class CryptoPaymentRequest(BaseModel):
    deviceId: str
    plan: str  # basic, premium
    network: str  # TRC20, ERC20, BEP20

class MobileMoneyPaymentRequest(BaseModel):
    deviceId: str
    plan: str
    provider: str  # mtn, airtel
    phoneNumber: str

class CardPaymentRequest(BaseModel):
    deviceId: str
    plan: str
    paymentMethodId: str

class PaymentResponse(BaseModel):
    success: bool
    transactionId: str
    paymentUrl: Optional[str] = None
    walletAddress: Optional[str] = None
    qrCode: Optional[str] = None
    message: str

# ========== Plan Configuration ==========
PLANS = {
    "basic": {"name": "Basic", "amount": 4.99, "amountUSDT": 4.99},
    "premium": {"name": "Premium", "amount": 9.99, "amountUSDT": 9.99}
}

# Crypto wallets
CRYPTO_WALLETS = {
    "TRC20": settings.CRYPTO_WALLET_TRC20,
    "ERC20": settings.CRYPTO_WALLET_ERC20,
    "BEP20": settings.CRYPTO_WALLET_BEP20
}

# ========== Helper Functions ==========
async def create_transaction(user_id: str, device_id: str, amount: float, payment_method: str, metadata: dict = None):
    db = get_db()
    transaction_id = f"TXN_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8].upper()}"
    
    transaction = {
        "transactionId": transaction_id,
        "userId": ObjectId(user_id),
        "deviceId": ObjectId(device_id),
        "amount": amount,
        "currency": "USD",
        "paymentMethod": payment_method,
        "status": "pending",
        "type": "subscription",
        "metadata": metadata or {},
        "createdAt": datetime.now(timezone.utc)
    }
    
    await db.transactions.insert_one(transaction)
    return transaction_id

async def activate_subscription(device_id: str, user_id: str, plan: str, amount: float, payment_method: str, transaction_id: str):
    db = get_db()
    
    # Deactivate old subscriptions
    await db.subscriptions.update_many(
        {"deviceId": ObjectId(device_id), "status": "active"},
        {"$set": {"status": "expired"}}
    )
    
    expiry_date = datetime.now(timezone.utc) + timedelta(days=30)
    
    subscription = {
        "deviceId": ObjectId(device_id),
        "userId": ObjectId(user_id),
        "plan": plan,
        "amount": amount,
        "status": "active",
        "paymentMethod": payment_method,
        "type": "new",
        "startDate": datetime.now(timezone.utc),
        "endDate": expiry_date,
        "lastPaymentDate": datetime.now(timezone.utc),
        "autoRenew": True,
        "transactionId": transaction_id,
        "createdAt": datetime.now(timezone.utc)
    }
    
    await db.subscriptions.insert_one(subscription)
    
    # Update device
    await db.devices.update_one(
        {"_id": ObjectId(device_id)},
        {"$set": {
            "status": "active",
            "subscription": {
                "plan": plan,
                "active": True,
                "expiresAt": expiry_date
            }
        }}
    )
    
    return subscription

# ========== Crypto Payment (USDT) ==========
@router.post("/crypto/initiate")
async def initiate_crypto_payment(
    payment: CryptoPaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    # Get device
    device = await db.devices.find_one({"deviceId": payment.deviceId})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    if str(device.get("owner")) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    plan = PLANS.get(payment.plan)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    amount = plan["amountUSDT"]
    wallet_address = CRYPTO_WALLETS.get(payment.network)
    if not wallet_address:
        raise HTTPException(status_code=400, detail="Invalid network")
    
    # Create transaction
    transaction_id = await create_transaction(
        user_id=current_user["id"],
        device_id=str(device["_id"]),
        amount=amount,
        payment_method=f"crypto_{payment.network}",
        metadata={
            "network": payment.network,
            "walletAddress": wallet_address,
            "plan": payment.plan
        }
    )
    
    # Generate QR Code
    qr_data = f"usdt:{wallet_address}?amount={amount}&network={payment.network}"
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert QR to base64
    buffered = io.BytesIO()
    qr_img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode()
    
    return PaymentResponse(
        success=True,
        transactionId=transaction_id,
        walletAddress=wallet_address,
        qrCode=qr_base64,
        message=f"Please send {amount} USDT to the address above using {payment.network} network"
    )

@router.post("/crypto/confirm")
async def confirm_crypto_payment(
    transaction_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    transaction = await db.transactions.find_one({
        "transactionId": transaction_id,
        "userId": ObjectId(current_user["id"])
    })
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction["status"] == "completed":
        return {"success": True, "message": "Payment already confirmed"}
    
    # In production, verify on blockchain here
    # For demo, auto-confirm
    await db.transactions.update_one(
        {"_id": transaction["_id"]},
        {"$set": {"status": "completed", "completedAt": datetime.now(timezone.utc)}}
    )
    
    # Activate subscription
    device_id = str(transaction["deviceId"])
    plan = transaction["metadata"]["plan"]
    amount = transaction["amount"]
    
    await activate_subscription(
        device_id=device_id,
        user_id=current_user["id"],
        plan=plan,
        amount=amount,
        payment_method=transaction["paymentMethod"],
        transaction_id=transaction_id
    )
    
    # Send confirmation email
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    device = await db.devices.find_one({"_id": ObjectId(device_id)})
    
    await send_email(
        user["email"],
        "Silent Guardian Subscription Activated",
        f"Dear {user['fullName']},\n\nYour {plan.upper()} subscription for device {device['deviceName']} has been activated.\n\nThank you for choosing Silent Guardian!"
    )
    
    return {
        "success": True,
        "message": "Payment confirmed! Your subscription is now active.",
        "deviceName": device["deviceName"],
        "plan": plan,
        "expiresAt": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    }

# ========== Mobile Money Payment ==========
@router.post("/mobile/initiate")
async def initiate_mobile_payment(
    payment: MobileMoneyPaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    device = await db.devices.find_one({"deviceId": payment.deviceId})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    if str(device.get("owner")) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    plan = PLANS.get(payment.plan)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    amount = plan["amount"]
    
    # Create transaction
    transaction_id = await create_transaction(
        user_id=current_user["id"],
        device_id=str(device["_id"]),
        amount=amount,
        payment_method=f"mobile_{payment.provider}",
        metadata={
            "provider": payment.provider,
            "phoneNumber": payment.phoneNumber,
            "plan": payment.plan
        }
    )
    
    # In production, call mobile money API here
    # For demo, simulate
    await db.transactions.update_one(
        {"transactionId": transaction_id},
        {"$set": {"status": "pending_verification"}}
    )
    
    # Send payment request via SMS
    await send_sms(
        payment.phoneNumber,
        f"Payment request: Please approve ${amount} for Silent Guardian subscription. Reference: {transaction_id}"
    )
    
    return PaymentResponse(
        success=True,
        transactionId=transaction_id,
        message=f"Payment request sent to {payment.phoneNumber}. Please check your phone to complete payment."
    )

@router.post("/mobile/confirm")
async def confirm_mobile_payment(
    transaction_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    transaction = await db.transactions.find_one({
        "transactionId": transaction_id,
        "userId": ObjectId(current_user["id"])
    })
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction["status"] == "completed":
        return {"success": True, "message": "Payment already confirmed"}
    
    # In production, verify with mobile money API
    await db.transactions.update_one(
        {"_id": transaction["_id"]},
        {"$set": {"status": "completed", "completedAt": datetime.now(timezone.utc)}}
    )
    
    device_id = str(transaction["deviceId"])
    plan = transaction["metadata"]["plan"]
    amount = transaction["amount"]
    
    await activate_subscription(
        device_id=device_id,
        user_id=current_user["id"],
        plan=plan,
        amount=amount,
        payment_method=transaction["paymentMethod"],
        transaction_id=transaction_id
    )
    
    return {
        "success": True,
        "message": "Payment confirmed! Your subscription is now active.",
        "expiresAt": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    }

# ========== Card Payment (Stripe) ==========
@router.post("/card/create-intent")
async def create_card_payment_intent(
    payment: CardPaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    
    device = await db.devices.find_one({"deviceId": payment.deviceId})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    if str(device.get("owner")) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    plan = PLANS.get(payment.plan)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    amount = int(plan["amount"] * 100)  # Convert to cents
    
    try:
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency="usd",
            metadata={
                "deviceId": payment.deviceId,
                "userId": current_user["id"],
                "plan": payment.plan
            }
        )
        
        # Create transaction record
        transaction_id = await create_transaction(
            user_id=current_user["id"],
            device_id=str(device["_id"]),
            amount=plan["amount"],
            payment_method="card",
            metadata={
                "paymentIntentId": intent.id,
                "plan": payment.plan
            }
        )
        
        return {
            "success": True,
            "clientSecret": intent.client_secret,
            "transactionId": transaction_id,
            "amount": plan["amount"]
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/card/confirm")
async def confirm_card_payment(
    payment_intent_id: str,
    transaction_id: str,
    current_user: dict = Depends(get_current_user)
):
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    
    db = get_db()
    
    transaction = await db.transactions.find_one({
        "transactionId": transaction_id,
        "userId": ObjectId(current_user["id"])
    })
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        if intent.status != "succeeded":
            return {"success": False, "message": "Payment not completed"}
        
        await db.transactions.update_one(
            {"_id": transaction["_id"]},
            {"$set": {"status": "completed", "completedAt": datetime.now(timezone.utc)}}
        )
        
        device_id = str(transaction["deviceId"])
        plan = transaction["metadata"]["plan"]
        amount = transaction["amount"]
        
        await activate_subscription(
            device_id=device_id,
            user_id=current_user["id"],
            plan=plan,
            amount=amount,
            payment_method="card",
            transaction_id=transaction_id
        )
        
        return {
            "success": True,
            "message": "Payment confirmed! Your subscription is now active."
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ========== Stripe Webhook ==========
@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        # Handle successful payment
        # Find transaction by paymentIntentId and confirm
        pass
    
    return {"received": True}

# ========== Get Transaction History ==========
@router.get("/history")
async def get_transaction_history(
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    skip = (page - 1) * limit
    
    transactions = await db.transactions.find({
        "userId": ObjectId(current_user["id"])
    }).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.transactions.count_documents({"userId": ObjectId(current_user["id"])})
    
    result = []
    for txn in transactions:
        device = None
        if txn.get("deviceId"):
            device_obj = await db.devices.find_one({"_id": txn["deviceId"]})
            if device_obj:
                device = device_obj["deviceName"]
        
        result.append({
            "id": txn["transactionId"],
            "amount": txn["amount"],
            "currency": txn["currency"],
            "paymentMethod": txn["paymentMethod"],
            "status": txn["status"],
            "type": txn["type"],
            "deviceName": device,
            "createdAt": txn["createdAt"].isoformat() if txn["createdAt"] else None
        })
    
    return {
        "transactions": result,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }
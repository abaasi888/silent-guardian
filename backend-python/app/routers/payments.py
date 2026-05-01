from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from typing import Optional
import uuid
import hashlib
import hmac
import requests
import stripe
from app.database import get_db
from app.auth import get_current_user, get_current_admin
from app.config import settings
from bson import ObjectId

router = APIRouter()

stripe.api_key = settings.STRIPE_SECRET_KEY

# ========== Request/Response Models ==========
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
    cardNumber: str
    expiryMonth: int
    expiryYear: int
    cvc: str

class PaymentResponse(BaseModel):
    success: bool
    transactionId: str
    paymentUrl: Optional[str] = None
    walletAddress: Optional[str] = None
    message: str

# ========== Crypto Payment (USDT) ==========
@router.post("/crypto/initiate")
async def initiate_crypto_payment(
    payment: CryptoPaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    # Get device
    device = await db.devices.find_one({"deviceId": payment.deviceId, "owner": ObjectId(current_user["id"])})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Calculate amount based on plan
    plan_amounts = {"basic": 4.99, "premium": 9.99}
    amount = plan_amounts.get(payment.plan, 4.99)
    
    # Select wallet based on network
    wallet_addresses = {
        "TRC20": settings.CRYPTO_WALLET_TRC20,
        "ERC20": settings.CRYPTO_WALLET_ERC20,
        "BEP20": settings.CRYPTO_WALLET_BEP20
    }
    wallet_address = wallet_addresses.get(payment.network, settings.CRYPTO_WALLET_TRC20)
    
    # Create transaction record
    transaction_id = f"CRYPTO_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}"
    
    transaction = {
        "transactionId": transaction_id,
        "userId": ObjectId(current_user["id"]),
        "deviceId": device["_id"],
        "amount": amount,
        "currency": "USDT",
        "paymentMethod": f"crypto_{payment.network}",
        "status": "pending",
        "type": "subscription",
        "metadata": {
            "network": payment.network,
            "walletAddress": wallet_address,
            "plan": payment.plan
        },
        "createdAt": datetime.now(timezone.utc)
    }
    
    await db.transactions.insert_one(transaction)
    
    # Generate QR code for payment
    qr_data = f"{settings.QR_CODE_BASE_URL}?address={wallet_address}&amount={amount}&currency=USDT&network={payment.network}"
    
    return PaymentResponse(
        success=True,
        transactionId=transaction_id,
        walletAddress=wallet_address,
        paymentUrl=qr_data,
        message=f"Please send {amount} USDT to the wallet address using {payment.network} network"
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
    
    if transaction["status"] != "pending":
        return {"success": True, "message": "Payment already confirmed"}
    
    # In production, verify on blockchain
    # For demo, auto-confirm after 5 minutes simulation
    
    # Update transaction
    await db.transactions.update_one(
        {"_id": transaction["_id"]},
        {"$set": {"status": "completed", "completedAt": datetime.now(timezone.utc)}}
    )
    
    # Activate subscription
    device_id = transaction["deviceId"]
    plan = transaction["metadata"]["plan"]
    amount = transaction["amount"]
    
    # Calculate expiry date (30 days from now)
    expiry_date = datetime.now(timezone.utc) + timedelta(days=30)
    
    # Create subscription
    subscription = {
        "deviceId": device_id,
        "userId": transaction["userId"],
        "plan": plan,
        "amount": amount,
        "status": "active",
        "paymentMethod": transaction["paymentMethod"],
        "type": "new",
        "startDate": datetime.now(timezone.utc),
        "endDate": expiry_date,
        "lastPaymentDate": datetime.now(timezone.utc),
        "autoRenew": True,
        "createdAt": datetime.now(timezone.utc)
    }
    
    await db.subscriptions.insert_one(subscription)
    
    # Update device
    await db.devices.update_one(
        {"_id": device_id},
        {"$set": {
            "status": "active",
            "subscription": {
                "plan": plan,
                "active": True,
                "expiresAt": expiry_date
            }
        }}
    )
    
    return {
        "success": True,
        "message": "Payment confirmed! Your subscription is now active.",
        "expiresAt": expiry_date.isoformat()
    }

# ========== Mobile Money Payments ==========
@router.post("/mobile/initiate")
async def initiate_mobile_payment(
    payment: MobileMoneyPaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    device = await db.devices.find_one({"deviceId": payment.deviceId, "owner": ObjectId(current_user["id"])})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    plan_amounts = {"basic": 4.99, "premium": 9.99}
    amount = plan_amounts.get(payment.plan, 4.99)
    
    transaction_id = f"MOBILE_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}"
    
    transaction = {
        "transactionId": transaction_id,
        "userId": ObjectId(current_user["id"]),
        "deviceId": device["_id"],
        "amount": amount,
        "currency": "UGX" if payment.provider in ["mtn", "airtel"] else "USD",
        "paymentMethod": f"mobile_{payment.provider}",
        "status": "pending",
        "type": "subscription",
        "metadata": {
            "provider": payment.provider,
            "phoneNumber": payment.phoneNumber,
            "plan": payment.plan
        },
        "createdAt": datetime.now(timezone.utc)
    }
    
    await db.transactions.insert_one(transaction)
    
    # Simulate payment request to mobile money API
    # In production, integrate with MTN/Airtel API
    # For demo, just return success
    
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
    
    if transaction["status"] != "pending":
        return {"success": True, "message": "Payment already confirmed"}
    
    # In production, verify with mobile money API
    await db.transactions.update_one(
        {"_id": transaction["_id"]},
        {"$set": {"status": "completed", "completedAt": datetime.now(timezone.utc)}}
    )
    
    # Activate subscription
    device_id = transaction["deviceId"]
    plan = transaction["metadata"]["plan"]
    amount = transaction["amount"]
    expiry_date = datetime.now(timezone.utc) + timedelta(days=30)
    
    subscription = {
        "deviceId": device_id,
        "userId": transaction["userId"],
        "plan": plan,
        "amount": amount,
        "status": "active",
        "paymentMethod": transaction["paymentMethod"],
        "type": "new",
        "startDate": datetime.now(timezone.utc),
        "endDate": expiry_date,
        "lastPaymentDate": datetime.now(timezone.utc),
        "autoRenew": True,
        "createdAt": datetime.now(timezone.utc)
    }
    
    await db.subscriptions.insert_one(subscription)
    
    await db.devices.update_one(
        {"_id": device_id},
        {"$set": {
            "status": "active",
            "subscription": {"plan": plan, "active": True, "expiresAt": expiry_date}
        }}
    )
    
    return {
        "success": True,
        "message": "Payment confirmed! Your subscription is now active.",
        "expiresAt": expiry_date.isoformat()
    }

# ========== Card Payments (Stripe) ==========
@router.post("/card/create-payment-intent")
async def create_card_payment_intent(
    payment: CardPaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    device = await db.devices.find_one({"deviceId": payment.deviceId, "owner": ObjectId(current_user["id"])})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    plan_amounts = {"basic": 499, "premium": 999}  # in cents
    amount = plan_amounts.get(payment.plan, 499)
    
    try:
        # Create Stripe Payment Intent
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency="usd",
            metadata={
                "deviceId": payment.deviceId,
                "userId": str(current_user["id"]),
                "plan": payment.plan
            }
        )
        
        # Store transaction
        transaction_id = f"CARD_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}"
        
        transaction = {
            "transactionId": transaction_id,
            "userId": ObjectId(current_user["id"]),
            "deviceId": device["_id"],
            "amount": amount / 100,
            "currency": "USD",
            "paymentMethod": "card",
            "status": "pending",
            "type": "subscription",
            "metadata": {
                "stripePaymentIntentId": intent.id,
                "plan": payment.plan
            },
            "createdAt": datetime.now(timezone.utc)
        }
        
        await db.transactions.insert_one(transaction)
        
        return {
            "success": True,
            "clientSecret": intent.client_secret,
            "transactionId": transaction_id,
            "amount": amount / 100,
            "currency": "usd"
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/card/confirm")
async def confirm_card_payment(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    data = await request.json()
    payment_intent_id = data.get("payment_intent_id")
    transaction_id = data.get("transaction_id")
    
    db = get_db()
    
    transaction = await db.transactions.find_one({"transactionId": transaction_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Verify payment with Stripe
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        if intent.status != "succeeded":
            return {"success": False, "message": "Payment not completed"}
        
        await db.transactions.update_one(
            {"_id": transaction["_id"]},
            {"$set": {"status": "completed", "completedAt": datetime.now(timezone.utc)}}
        )
        
        # Activate subscription
        device_id = transaction["deviceId"]
        plan = transaction["metadata"]["plan"]
        amount = transaction["amount"]
        expiry_date = datetime.now(timezone.utc) + timedelta(days=30)
        
        subscription = {
            "deviceId": device_id,
            "userId": transaction["userId"],
            "plan": plan,
            "amount": amount,
            "status": "active",
            "paymentMethod": "card",
            "type": "new",
            "startDate": datetime.now(timezone.utc),
            "endDate": expiry_date,
            "lastPaymentDate": datetime.now(timezone.utc),
            "autoRenew": True,
            "createdAt": datetime.now(timezone.utc)
        }
        
        await db.subscriptions.insert_one(subscription)
        
        await db.devices.update_one(
            {"_id": device_id},
            {"$set": {
                "status": "active",
                "subscription": {"plan": plan, "active": True, "expiresAt": expiry_date}
            }}
        )
        
        return {
            "success": True,
            "message": "Payment confirmed! Your subscription is now active.",
            "expiresAt": expiry_date.isoformat()
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ========== Stripe Webhook ==========
@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
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
        # This will be processed by the confirm endpoint as well
        
    return {"received": True}
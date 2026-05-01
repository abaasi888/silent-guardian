import stripe
import requests
import hashlib
import hmac
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.config import settings
from app.services.crypto_service import verify_crypto_payment

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

async def process_payment(
    payment_method: str,
    amount: float,
    currency: str,
    payment_details: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Process payment through various providers
    Returns: {"success": bool, "transaction_id": str, "error": str}
    """
    
    if payment_method == "card":
        return await process_card_payment(amount, currency, payment_details)
    elif payment_method == "crypto":
        return await process_crypto_payment(amount, currency, payment_details)
    elif payment_method == "mtn":
        return await process_mtn_payment(amount, currency, payment_details)
    elif payment_method == "airtel":
        return await process_airtel_payment(amount, currency, payment_details)
    else:
        return {"success": False, "error": f"Unsupported payment method: {payment_method}"}

async def process_card_payment(amount: float, currency: str, payment_details: Dict) -> Dict[str, Any]:
    """Process credit/debit card payment via Stripe"""
    try:
        # Create payment intent
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Convert to cents
            currency=currency.lower(),
            payment_method=payment_details.get("payment_method_id"),
            confirmation_method="manual",
            confirm=True,
            metadata={
                "user_id": payment_details.get("user_id"),
                "device_id": payment_details.get("device_id")
            }
        )
        
        if intent.status == "succeeded":
            return {
                "success": True,
                "transaction_id": intent.id,
                "status": "completed"
            }
        elif intent.status == "requires_action":
            return {
                "success": True,
                "requires_action": True,
                "client_secret": intent.client_secret,
                "transaction_id": intent.id,
                "status": "pending"
            }
        else:
            return {
                "success": False,
                "error": f"Payment failed: {intent.status}",
                "transaction_id": intent.id
            }
            
    except stripe.error.CardError as e:
        return {"success": False, "error": e.error.message}
    except stripe.error.StripeError as e:
        return {"success": False, "error": str(e)}

async def process_crypto_payment(amount: float, currency: str, payment_details: Dict) -> Dict[str, Any]:
    """Process cryptocurrency payment"""
    network = payment_details.get("network", "TRC20")
    wallet_address = payment_details.get("wallet_address")
    transaction_hash = payment_details.get("transaction_hash")
    
    if transaction_hash:
        # Verify existing transaction
        verification = await verify_crypto_payment(
            transaction_hash=transaction_hash,
            expected_amount=amount,
            wallet_address=wallet_address,
            network=network
        )
        
        if verification.get("verified"):
            return {
                "success": True,
                "transaction_id": transaction_hash,
                "status": "completed",
                "amount": verification.get("amount")
            }
        else:
            return {
                "success": False,
                "error": verification.get("error", "Payment verification failed")
            }
    
    # Generate payment address
    return {
        "success": True,
        "requires_payment": True,
        "wallet_address": get_crypto_wallet_address(network),
        "amount": amount,
        "currency": "USDT",
        "network": network
    }

def get_crypto_wallet_address(network: str) -> str:
    """Get wallet address for specified network"""
    wallets = {
        "TRC20": settings.CRYPTO_WALLET_TRC20,
        "ERC20": settings.CRYPTO_WALLET_ERC20,
        "BEP20": settings.CRYPTO_WALLET_BEP20
    }
    return wallets.get(network, settings.CRYPTO_WALLET_TRC20)

async def process_mtn_payment(amount: float, currency: str, payment_details: Dict) -> Dict[str, Any]:
    """Process MTN Mobile Money payment"""
    phone_number = payment_details.get("phone_number")
    transaction_id = payment_details.get("transaction_id")
    
    # MTN API endpoint
    url = f"{settings.MTN_API_URL}/collection/v1_0/requesttopay"
    
    headers = {
        "Authorization": f"Bearer {await get_mtn_token()}",
        "X-Reference-Id": transaction_id or str(uuid.uuid4()),
        "X-Target-Environment": "sandbox",
        "Content-Type": "application/json"
    }
    
    body = {
        "amount": str(amount),
        "currency": currency,
        "externalId": transaction_id,
        "payer": {
            "partyIdType": "MSISDN",
            "partyId": phone_number
        },
        "payerMessage": "Silent Guardian Subscription",
        "payeeNote": f"Payment for subscription"
    }
    
    try:
        response = requests.post(url, headers=headers, json=body, timeout=30)
        
        if response.status_code == 202:
            return {
                "success": True,
                "requires_verification": True,
                "transaction_id": headers["X-Reference-Id"],
                "message": "Payment request sent. Please check your phone to complete payment."
            }
        else:
            return {"success": False, "error": f"MTN payment failed: {response.text}"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

async def process_airtel_payment(amount: float, currency: str, payment_details: Dict) -> Dict[str, Any]:
    """Process Airtel Money payment"""
    phone_number = payment_details.get("phone_number")
    
    # Airtel API endpoint
    url = f"{settings.AIRTEL_API_URL}/standard/v1/payments"
    
    headers = {
        "X-Country": "UG",
        "X-Currency": currency,
        "Authorization": f"Bearer {await get_airtel_token()}",
        "Content-Type": "application/json"
    }
    
    body = {
        "reference": str(uuid.uuid4()),
        "subscriber": {
            "country": "UG",
            "currency": currency,
            "msisdn": phone_number
        },
        "transaction": {
            "amount": str(amount),
            "country": "UG",
            "currency": currency,
            "id": str(uuid.uuid4())
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=body, timeout=30)
        
        if response.status_code in [200, 201]:
            data = response.json()
            return {
                "success": True,
                "transaction_id": data.get("data", {}).get("transaction_id"),
                "message": "Payment initiated. Please check your phone to complete payment."
            }
        else:
            return {"success": False, "error": f"Airtel payment failed: {response.text}"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

async def refund_payment(transaction_id: str, amount: Optional[float] = None) -> Dict[str, Any]:
    """Refund a payment"""
    # Check if Stripe transaction
    if transaction_id.startswith("pi_"):
        try:
            refund = stripe.Refund.create(
                payment_intent=transaction_id,
                amount=int(amount * 100) if amount else None
            )
            
            return {
                "success": True,
                "refund_id": refund.id,
                "amount": refund.amount / 100
            }
        except stripe.error.StripeError as e:
            return {"success": False, "error": str(e)}
    
    # For mobile money refunds, would need to call respective APIs
    return {"success": False, "error": "Manual refund required for this payment method"}

async def get_mtn_token() -> str:
    """Get MTN API access token"""
    # Implement MTN OAuth
    return "mock_mtn_token"

async def get_airtel_token() -> str:
    """Get Airtel API access token"""
    # Implement Airtel OAuth
    return "mock_airtel_token"

import uuid
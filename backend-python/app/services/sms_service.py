import asyncio
from typing import List, Optional
from twilio.rest import Client
from app.config import settings

# Initialize Twilio client
twilio_client = None
if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
    twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

async def send_sms(to_number: str, message: str) -> bool:
    """Send SMS using Twilio"""
    if not twilio_client:
        print(f"SMS would be sent to {to_number}: {message}")
        return True
    
    try:
        message = twilio_client.messages.create(
            body=message,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=to_number
        )
        return message.sid is not None
    except Exception as e:
        print(f"SMS error: {e}")
        return False

async def send_bulk_sms(recipients: List[str], message: str) -> dict:
    """Send SMS to multiple recipients"""
    results = await asyncio.gather(*[
        send_sms(recipient, message) for recipient in recipients
    ])
    
    return {
        "total": len(recipients),
        "success": sum(results),
        "failed": len(recipients) - sum(results)
    }

# ========== SMS Templates ==========

async def send_verification_code(to_number: str, code: str):
    """Send verification code SMS"""
    message = f"Your Silent Guardian verification code is: {code}. Valid for 10 minutes."
    return await send_sms(to_number, message)

async def send_device_location_alert(to_number: str, device_name: str, lat: float, lng: float):
    """Send device location alert SMS"""
    message = f"ALERT: Your device '{device_name}' has been located at coordinates: {lat}, {lng}. Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    return await send_sms(to_number, message)

async def send_device_stolen_alert(to_number: str, device_name: str):
    """Send stolen device alert SMS"""
    message = f"URGENT: Your device '{device_name}' has been reported as stolen. Tracking has been activated."
    return await send_sms(to_number, message)

async def send_payment_confirmation(to_number: str, amount: float, plan: str):
    """Send payment confirmation SMS"""
    message = f"Payment of ${amount} for {plan} plan confirmed. Your Silent Guardian subscription is now active."
    return await send_sms(to_number, message)

async def send_invite_sms(to_number: str, inviter_name: str, invite_link: str):
    """Send invite SMS"""
    message = f"{inviter_name} has invited you to join Silent Guardian! Click the link to register: {invite_link}"
    return await send_sms(to_number, message)

from datetime import datetime
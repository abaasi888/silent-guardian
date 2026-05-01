import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.services.email_service import send_email
from app.services.sms_service import send_sms

class NotificationService:
    """Unified notification service for email and SMS"""
    
    @staticmethod
    async def send_user_welcome(user_email: str, user_name: str):
        """Send welcome notification to new user"""
        # Email
        from app.services.email_service import send_welcome_email
        await send_welcome_email(user_email, user_name)
    
    @staticmethod
    async def send_device_alert(user_email: str, user_phone: str, device_name: str, alert_type: str, location: Dict):
        """Send device alert notification"""
        subject = f"Silent Guardian Alert: {device_name} - {alert_type}"
        body = f"""
        Your device '{device_name}' has triggered a {alert_type} alert.
        
        Location: {location.get('lat', 'N/A')}, {location.get('lng', 'N/A')}
        Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        
        Please log in to your account for more details.
        """
        
        # Send email
        await send_email(user_email, subject, body)
        
        # Send SMS for critical alerts
        if alert_type in ["stolen", "geofence_breach", "emergency"]:
            sms_body = f"ALERT: {device_name} - {alert_type} at {location.get('lat', 'N/A')}, {location.get('lng', 'N/A')}"
            await send_sms(user_phone, sms_body)
    
    @staticmethod
    async def send_subscription_reminder(user_email: str, device_name: str, days_left: int):
        """Send subscription expiring reminder"""
        from app.services.email_service import send_subscription_expiring_email
        await send_subscription_expiring_email(user_email, device_name, days_left)
    
    @staticmethod
    async def send_kyc_status_update(user_email: str, user_name: str, status: str):
        """Send KYC status update notification"""
        if status == "approved":
            from app.services.email_service import send_kyc_approved_email
            await send_kyc_approved_email(user_email, user_name)
        else:
            subject = "KYC Status Update"
            body = f"Dear {user_name},\n\nYour KYC status has been updated to: {status.upper()}\n\nIf you have questions, please contact support."
            await send_email(user_email, subject, body)
    
    @staticmethod
    async def send_employee_welcome(employee_email: str, employee_name: str, temp_password: str):
        """Send welcome notification to new employee"""
        from app.services.email_service import send_employee_welcome_email
        await send_employee_welcome_email(employee_email, employee_name, temp_password)
    
    @staticmethod
    async def send_invite(user_email: str, inviter_name: str, invite_link: str):
        """Send invite notification"""
        subject = f"{inviter_name} has invited you to Silent Guardian!"
        body = f"""
        Hi there,
        
        {inviter_name} has invited you to join Silent Guardian - the ultimate device tracking and protection platform.
        
        Click the link below to get started:
        {invite_link}
        
        Join now and start protecting your devices!
        
        Best regards,
        Silent Guardian Team
        """
        
        await send_email(user_email, subject, body)

notification_service = NotificationService()
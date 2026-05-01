import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from email.mime.application import MIMEApplication
from typing import List, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor
from app.config import settings

executor = ThreadPoolExecutor(max_workers=5)

async def send_email(
    to_email: str,
    subject: str,
    body: str,
    html_body: Optional[str] = None,
    attachments: Optional[List[tuple]] = None
) -> bool:
    """
    Send email asynchronously
    attachments: list of (filename, content, mimetype)
    """
    def _send():
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = settings.EMAIL_FROM
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Attach plain text version
            msg.attach(MIMEText(body, 'plain'))
            
            # Attach HTML version if provided
            if html_body:
                msg.attach(MIMEText(html_body, 'html'))
            
            # Add attachments
            if attachments:
                for filename, content, mimetype in attachments:
                    attachment = MIMEApplication(content, _subtype=mimetype.split('/')[-1])
                    attachment.add_header('Content-Disposition', 'attachment', filename=filename)
                    msg.attach(attachment)
            
            # Send email
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            
            return True
        except Exception as e:
            print(f"Email error: {e}")
            return False
    
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, _send)

async def send_bulk_emails(
    recipients: List[str],
    subject: str,
    body: str,
    html_body: Optional[str] = None
) -> dict:
    """Send emails to multiple recipients"""
    results = await asyncio.gather(*[
        send_email(email, subject, body, html_body) for email in recipients
    ])
    
    return {
        "total": len(recipients),
        "success": sum(results),
        "failed": len(recipients) - sum(results)
    }

# ========== Email Templates ==========

async def send_welcome_email(to_email: str, name: str):
    """Send welcome email to new user"""
    subject = "Welcome to Silent Guardian!"
    body = f"""
    Dear {name},
    
    Welcome to Silent Guardian! We're excited to have you on board.
    
    Your account has been successfully created. You can now:
    - Register your devices
    - Start tracking your assets
    - Enable real-time location monitoring
    
    Get started by logging into your account and adding your first device.
    
    If you have any questions, our support team is here to help.
    
    Best regards,
    Silent Guardian Team
    """
    
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2>Welcome to Silent Guardian!</h2>
        <p>Dear {name},</p>
        <p>Welcome to Silent Guardian! We're excited to have you on board.</p>
        <p>Your account has been successfully created. You can now:</p>
        <ul>
            <li>Register your devices</li>
            <li>Start tracking your assets</li>
            <li>Enable real-time location monitoring</li>
        </ul>
        <p>Get started by logging into your account and adding your first device.</p>
        <p>If you have any questions, our support team is here to help.</p>
        <br>
        <p>Best regards,<br>Silent Guardian Team</p>
    </body>
    </html>
    """
    
    return await send_email(to_email, subject, body, html_body)

async def send_password_reset_email(to_email: str, name: str, reset_link: str):
    """Send password reset email"""
    subject = "Reset Your Silent Guardian Password"
    body = f"""
    Dear {name},
    
    We received a request to reset your password for your Silent Guardian account.
    
    Click the link below to reset your password (valid for 1 hour):
    {reset_link}
    
    If you did not request this, please ignore this email.
    
    Best regards,
    Silent Guardian Team
    """
    
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2>Reset Your Password</h2>
        <p>Dear {name},</p>
        <p>We received a request to reset your password for your Silent Guardian account.</p>
        <p>Click the button below to reset your password (valid for 1 hour):</p>
        <a href="{reset_link}" style="background-color: #9c27b0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
        <br>
        <p>Best regards,<br>Silent Guardian Team</p>
    </body>
    </html>
    """
    
    return await send_email(to_email, subject, body, html_body)

async def send_subscription_activated_email(to_email: str, name: str, device_name: str, plan: str, expiry_date: str):
    """Send subscription activated email"""
    subject = "Your Silent Guardian Subscription is Active!"
    body = f"""
    Dear {name},
    
    Your {plan.upper()} subscription for device "{device_name}" has been activated!
    
    Subscription Details:
    - Plan: {plan.upper()}
    - Device: {device_name}
    - Expires: {expiry_date}
    
    You can now enjoy full tracking features including:
    - Real-time GPS tracking
    - Location history
    - Geofencing alerts
    - Remote commands
    
    Thank you for choosing Silent Guardian!
    
    Best regards,
    Silent Guardian Team
    """
    
    return await send_email(to_email, subject, body)

async def send_subscription_expiring_email(to_email: str, name: str, device_name: str, days_left: int):
    """Send subscription expiring reminder"""
    subject = "Your Silent Guardian Subscription is Expiring Soon"
    body = f"""
    Dear {name},
    
    Your subscription for device "{device_name}" will expire in {days_left} days.
    
    To avoid interruption of tracking services, please renew your subscription.
    
    You can renew by logging into your account and visiting the Subscriptions page.
    
    Best regards,
    Silent Guardian Team
    """
    
    return await send_email(to_email, subject, body)

async def send_kyc_approved_email(to_email: str, name: str):
    """Send KYC approval notification"""
    subject = "Your KYC has been Approved!"
    body = f"""
    Dear {name},
    
    Congratulations! Your KYC verification has been approved.
    
    You now have full access to all Silent Guardian features.
    
    Thank you for completing the verification process.
    
    Best regards,
    Silent Guardian Team
    """
    
    return await send_email(to_email, subject, body)

async def send_employee_welcome_email(to_email: str, name: str, temporary_password: str):
    """Send welcome email to new employee"""
    subject = "Welcome to Silent Guardian Team!"
    body = f"""
    Dear {name},
    
    Welcome to the Silent Guardian team! Your employee account has been created.
    
    Login Credentials:
    Email: {to_email}
    Temporary Password: {temporary_password}
    
    Please change your password after first login.
    
    You can access your employee dashboard at: {settings.FRONTEND_URL}/employee/login
    
    Best regards,
    Silent Guardian Team
    """
    
    return await send_email(to_email, subject, body)
"""
File Upload Utilities
Path: backend-python/app/utils/file_upload.py
"""

import os
import shutil
import uuid
from pathlib import Path
from datetime import datetime
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException, status

# Base upload directory
BASE_UPLOAD_DIR = Path("uploads")
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_DOCUMENT_TYPES = {"application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def ensure_upload_dirs():
    """Create all necessary upload directories if they don't exist"""
    directories = [
        BASE_UPLOAD_DIR / "documents" / "kyc" / "id_documents",
        BASE_UPLOAD_DIR / "documents" / "kyc" / "selfies",
        BASE_UPLOAD_DIR / "documents" / "kyc" / "business_docs",
        BASE_UPLOAD_DIR / "documents" / "employees" / "cvs",
        BASE_UPLOAD_DIR / "documents" / "employees" / "nssf",
        BASE_UPLOAD_DIR / "documents" / "employees" / "bank_accounts",
        BASE_UPLOAD_DIR / "documents" / "employees" / "academics",
        BASE_UPLOAD_DIR / "documents" / "tickets" / "attachments",
        BASE_UPLOAD_DIR / "profile" / "avatars",
        BASE_UPLOAD_DIR / "profile" / "covers",
        BASE_UPLOAD_DIR / "temp",
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)


def get_file_extension(filename: str) -> str:
    """Get file extension from filename"""
    return Path(filename).suffix.lower()


def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique filename to prevent collisions"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = uuid.uuid4().hex[:8]
    extension = get_file_extension(original_filename)
    return f"{timestamp}_{unique_id}{extension}"


async def save_upload_file(
    file: UploadFile,
    subdirectory: str,
    allowed_types: set,
    max_size: int = MAX_FILE_SIZE
) -> Tuple[str, str]:
    """
    Save an uploaded file to the appropriate directory
    Returns: (file_path, file_url)
    """
    # Validate file size
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size: {max_size // (1024 * 1024)}MB"
        )
    
    # Validate file type
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {allowed_types}"
        )
    
    # Generate unique filename
    unique_filename = generate_unique_filename(file.filename)
    
    # Create full path
    upload_dir = BASE_UPLOAD_DIR / subdirectory
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = upload_dir / unique_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Return relative path for database storage
    relative_path = str(file_path.relative_to(BASE_UPLOAD_DIR))
    file_url = f"/uploads/{relative_path}"
    
    return relative_path, file_url


async def save_kyc_document(
    file: UploadFile,
    user_id: str,
    doc_type: str
) -> Tuple[str, str]:
    """
    Save KYC document for a user
    doc_type: id_document, selfie, business_docs
    """
    subdirectory = f"documents/kyc/{doc_type}"
    return await save_upload_file(file, subdirectory, ALLOWED_IMAGE_TYPES | ALLOWED_DOCUMENT_TYPES)


async def save_employee_document(
    file: UploadFile,
    employee_id: str,
    doc_type: str
) -> Tuple[str, str]:
    """
    Save employee document
    doc_type: cvs, nssf, bank_accounts, academics
    """
    subdirectory = f"documents/employees/{doc_type}"
    return await save_upload_file(file, subdirectory, ALLOWED_IMAGE_TYPES | ALLOWED_DOCUMENT_TYPES)


async def save_profile_picture(
    file: UploadFile,
    user_id: str
) -> Tuple[str, str]:
    """
    Save user profile picture
    """
    subdirectory = "profile/avatars"
    return await save_upload_file(file, subdirectory, ALLOWED_IMAGE_TYPES)


async def save_ticket_attachment(
    file: UploadFile,
    ticket_id: str
) -> Tuple[str, str]:
    """
    Save ticket attachment
    """
    subdirectory = f"documents/tickets/attachments"
    return await save_upload_file(file, subdirectory, ALLOWED_IMAGE_TYPES | ALLOWED_DOCUMENT_TYPES)


def delete_file(file_path: str) -> bool:
    """
    Delete a file from the filesystem
    """
    try:
        full_path = BASE_UPLOAD_DIR / file_path
        if full_path.exists():
            full_path.unlink()
            return True
        return False
    except Exception:
        return False


def get_file_size(file_path: str) -> int:
    """
    Get file size in bytes
    """
    try:
        full_path = BASE_UPLOAD_DIR / file_path
        if full_path.exists():
            return full_path.stat().st_size
        return 0
    except Exception:
        return 0


# Initialize directories when module loads
ensure_upload_dirs()
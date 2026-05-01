"""
File Upload Router
Path: backend-python/app/routers/upload.py
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from typing import Optional
from app.dependencies import get_current_user, get_current_admin
from app.utils.file_upload import (
    save_kyc_document,
    save_employee_document,
    save_profile_picture,
    save_ticket_attachment,
    delete_file
)

router = APIRouter(prefix="/upload", tags=["File Upload"])


@router.post("/kyc/id-document")
async def upload_kyc_id_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload KYC ID document"""
    try:
        file_path, file_url = await save_kyc_document(file, current_user["id"], "id_documents")
        
        # Update user record with document path
        db = get_db()
        await db.users.update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$set": {"kycDocuments.idDocument": file_path}}
        )
        
        return {
            "success": True,
            "file_url": file_url,
            "file_path": file_path,
            "message": "ID document uploaded successfully"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/kyc/selfie")
async def upload_kyc_selfie(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload KYC selfie"""
    try:
        file_path, file_url = await save_kyc_document(file, current_user["id"], "selfies")
        
        await db.users.update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$set": {"kycDocuments.selfie": file_path}}
        )
        
        return {
            "success": True,
            "file_url": file_url,
            "file_path": file_path,
            "message": "Selfie uploaded successfully"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/kyc/business-docs")
async def upload_kyc_business_docs(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload business registration documents (for corporate accounts)"""
    try:
        file_path, file_url = await save_kyc_document(file, current_user["id"], "business_docs")
        
        await db.users.update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$set": {"kycDocuments.businessDocs": file_path}}
        )
        
        return {
            "success": True,
            "file_url": file_url,
            "file_path": file_path,
            "message": "Business documents uploaded successfully"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/employee/cv")
async def upload_employee_cv(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_employee)
):
    """Upload employee CV"""
    try:
        file_path, file_url = await save_employee_document(file, current_user["id"], "cvs")
        
        await db.employees.update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$set": {"kycDocuments.cv": file_path}}
        )
        
        return {
            "success": True,
            "file_url": file_url,
            "file_path": file_path,
            "message": "CV uploaded successfully"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/employee/nssf")
async def upload_employee_nssf(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_employee)
):
    """Upload employee NSSF document"""
    try:
        file_path, file_url = await save_employee_document(file, current_user["id"], "nssf")
        
        await db.employees.update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$set": {"kycDocuments.nssf": file_path}}
        )
        
        return {
            "success": True,
            "file_url": file_url,
            "file_path": file_path,
            "message": "NSSF document uploaded successfully"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/employee/bank-account")
async def upload_employee_bank_account(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_employee)
):
    """Upload employee bank account statement"""
    try:
        file_path, file_url = await save_employee_document(file, current_user["id"], "bank_accounts")
        
        await db.employees.update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$set": {"kycDocuments.bankAccount": file_path}}
        )
        
        return {
            "success": True,
            "file_url": file_url,
            "file_path": file_path,
            "message": "Bank account document uploaded successfully"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/employee/academics")
async def upload_employee_academics(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_employee)
):
    """Upload employee academic certificates"""
    try:
        file_path, file_url = await save_employee_document(file, current_user["id"], "academics")
        
        await db.employees.update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$set": {"kycDocuments.academics": file_path}}
        )
        
        return {
            "success": True,
            "file_url": file_url,
            "file_path": file_path,
            "message": "Academic documents uploaded successfully"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/profile/avatar")
async def upload_profile_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload user profile avatar"""
    try:
        file_path, file_url = await save_profile_picture(file, current_user["id"])
        
        await db.users.update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$set": {"avatar": file_path}}
        )
        
        return {
            "success": True,
            "file_url": file_url,
            "file_path": file_path,
            "message": "Profile picture uploaded successfully"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{file_path:path}")
async def delete_uploaded_file(
    file_path: str,
    current_user: dict = Depends(get_current_admin)
):
    """Delete an uploaded file (admin only)"""
    if delete_file(file_path):
        return {"success": True, "message": "File deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="File not found")
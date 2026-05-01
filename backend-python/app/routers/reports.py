from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from bson import ObjectId
from app.database import get_db
from app.auth import get_current_admin

router = APIRouter()

# ========== Revenue Report ==========
@router.get("/revenue")
async def get_revenue_report(
    period: str = Query("monthly", description="daily, weekly, monthly, yearly"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    # Parse dates
    if start_date:
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    else:
        start = datetime.now(timezone.utc) - timedelta(days=30)
    
    if end_date:
        end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    else:
        end = datetime.now(timezone.utc)
    
    # Get subscriptions within date range
    subscriptions = await db.subscriptions.find({
        "createdAt": {"$gte": start, "$lte": end}
    }).to_list(None)
    
    # Group by period
    revenue_data = {}
    for sub in subscriptions:
        if period == "daily":
            key = sub["createdAt"].strftime("%Y-%m-%d")
        elif period == "weekly":
            key = sub["createdAt"].strftime("%Y-W%W")
        elif period == "monthly":
            key = sub["createdAt"].strftime("%Y-%m")
        else:
            key = sub["createdAt"].strftime("%Y")
        
        if key not in revenue_data:
            revenue_data[key] = {
                "period": key,
                "amount": 0,
                "count": 0,
                "new_signups": 0,
                "renewals": 0
            }
        
        revenue_data[key]["amount"] += sub["amount"]
        revenue_data[key]["count"] += 1
        if sub.get("type") == "new":
            revenue_data[key]["new_signups"] += 1
        else:
            revenue_data[key]["renewals"] += 1
    
    # Calculate totals
    total_revenue = sum(data["amount"] for data in revenue_data.values())
    total_signups = sum(data["count"] for data in revenue_data.values())
    
    return {
        "period": period,
        "startDate": start.isoformat(),
        "endDate": end.isoformat(),
        "data": list(revenue_data.values()),
        "summary": {
            "totalRevenue": total_revenue,
            "totalSignups": total_signups,
            "averageRevenuePerSignup": total_revenue / total_signups if total_signups > 0 else 0
        }
    }

# ========== Device Report ==========
@router.get("/devices")
async def get_device_report(
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    query = {}
    if status:
        query["status"] = status
    
    if start_date:
        query["createdAt"] = {"$gte": datetime.fromisoformat(start_date.replace('Z', '+00:00'))}
    if end_date:
        if "createdAt" not in query:
            query["createdAt"] = {}
        query["createdAt"]["$lte"] = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    
    devices = await db.devices.find(query).to_list(None)
    
    # Group by manufacturer
    by_manufacturer = {}
    by_status = {}
    by_day = {}
    
    for device in devices:
        # By manufacturer
        manuf = device.get("manufacturer", "Unknown")
        by_manufacturer[manuf] = by_manufacturer.get(manuf, 0) + 1
        
        # By status
        status_val = device.get("status", "unknown")
        by_status[status_val] = by_status.get(status_val, 0) + 1
        
        # By day
        day_key = device["createdAt"].strftime("%Y-%m-%d")
        by_day[day_key] = by_day.get(day_key, 0) + 1
    
    return {
        "totalDevices": len(devices),
        "byManufacturer": [{"name": k, "count": v} for k, v in by_manufacturer.items()],
        "byStatus": [{"name": k, "count": v} for k, v in by_status.items()],
        "byDay": [{"date": k, "count": v} for k, v in sorted(by_day.items())],
        "devices": [{
            "id": str(d["_id"]),
            "deviceName": d["deviceName"],
            "deviceId": d["deviceId"],
            "status": d["status"],
            "manufacturer": d.get("manufacturer"),
            "createdAt": d["createdAt"].isoformat()
        } for d in devices[:100]]
    }

# ========== User Report ==========
@router.get("/users")
async def get_user_report(
    account_type: Optional[str] = None,
    kyc_status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    query = {}
    if account_type:
        query["accountType"] = account_type
    if kyc_status:
        query["kycStatus"] = kyc_status
    
    if start_date:
        query["createdAt"] = {"$gte": datetime.fromisoformat(start_date.replace('Z', '+00:00'))}
    if end_date:
        if "createdAt" not in query:
            query["createdAt"] = {}
        query["createdAt"]["$lte"] = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    
    users = await db.users.find(query).to_list(None)
    
    # Group by account type
    by_account_type = {}
    by_kyc_status = {}
    by_day = {}
    
    for user in users:
        # By account type
        acc_type = user.get("accountType", "ordinary")
        by_account_type[acc_type] = by_account_type.get(acc_type, 0) + 1
        
        # By KYC status
        kyc = user.get("kycStatus", "pending")
        by_kyc_status[kyc] = by_kyc_status.get(kyc, 0) + 1
        
        # By day
        day_key = user["createdAt"].strftime("%Y-%m-%d")
        by_day[day_key] = by_day.get(day_key, 0) + 1
    
    return {
        "totalUsers": len(users),
        "byAccountType": [{"name": k, "count": v} for k, v in by_account_type.items()],
        "byKycStatus": [{"name": k, "count": v} for k, v in by_kyc_status.items()],
        "byDay": [{"date": k, "count": v} for k, v in sorted(by_day.items())],
        "users": [{
            "id": str(u["_id"]),
            "fullName": u["fullName"],
            "email": u["email"],
            "accountType": u["accountType"],
            "kycStatus": u.get("kycStatus"),
            "createdAt": u["createdAt"].isoformat()
        } for u in users[:100]]
    }

# ========== Employee Report ==========
@router.get("/employees")
async def get_employee_report(
    employment_type: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    query = {}
    if employment_type:
        query["employmentType"] = employment_type
    if status:
        query["status"] = status
    
    employees = await db.employees.find(query).to_list(None)
    
    # Calculate totals
    total_signups = sum(e.get("totalSignups", 0) for e in employees)
    total_commission = sum(e.get("totalCommission", 0) for e in employees)
    
    # Top performers
    top_performers = sorted(employees, key=lambda x: x.get("totalSignups", 0), reverse=True)[:10]
    
    return {
        "totalEmployees": len(employees),
        "totalSignups": total_signups,
        "totalCommission": total_commission,
        "averageCommissionPerEmployee": total_commission / len(employees) if employees else 0,
        "byEmploymentType": {
            "contractor": len([e for e in employees if e.get("employmentType") == "contractor"]),
            "permanent": len([e for e in employees if e.get("employmentType") == "permanent"])
        },
        "topPerformers": [{
            "id": str(e["_id"]),
            "name": e["fullName"],
            "email": e["email"],
            "totalSignups": e.get("totalSignups", 0),
            "totalCommission": e.get("totalCommission", 0),
            "employmentType": e.get("employmentType")
        } for e in top_performers],
        "employees": [{
            "id": str(e["_id"]),
            "name": e["fullName"],
            "email": e["email"],
            "totalSignups": e.get("totalSignups", 0),
            "totalCommission": e.get("totalCommission", 0),
            "employmentType": e.get("employmentType"),
            "status": e.get("status"),
            "joinDate": e["joinDate"].isoformat() if e.get("joinDate") else None
        } for e in employees[:100]]
    }

# ========== Commission Report ==========
@router.get("/commissions")
async def get_commission_report(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_admin)
):
    db = get_db()
    
    now = datetime.now(timezone.utc)
    target_month = month or now.month
    target_year = year or now.year
    
    # Get all employees
    employees = await db.employees.find({}).to_list(None)
    
    commission_data = []
    total_commission = 0
    
    for emp in employees:
        monthly_commission = 0
        monthly_signups = 0
        
        for signup in emp.get("signups", []):
            if signup.get("date"):
                signup_date = signup["date"]
                if isinstance(signup_date, str):
                    signup_date = datetime.fromisoformat(signup_date.replace('Z', '+00:00'))
                
                if signup_date.month == target_month and signup_date.year == target_year:
                    amount = signup.get("amount", 0)
                    commission_rate = emp.get("commissionRate", 30)
                    commission = amount * commission_rate / 100
                    monthly_commission += commission
                    monthly_signups += 1
        
        total_commission += monthly_commission
        
        commission_data.append({
            "employeeId": str(emp["_id"]),
            "employeeName": emp["fullName"],
            "employeeEmail": emp["email"],
            "employmentType": emp.get("employmentType"),
            "commissionRate": emp.get("commissionRate", 30),
            "baseSalary": emp.get("baseSalary", 0),
            "monthlySignups": monthly_signups,
            "monthlyCommission": monthly_commission,
            "totalEarnings": emp.get("baseSalary", 0) + monthly_commission
        })
    
    # Sort by commission
    commission_data.sort(key=lambda x: x["monthlyCommission"], reverse=True)
    
    return {
        "month": target_month,
        "year": target_year,
        "totalCommissions": total_commission,
        "data": commission_data
    }

# ========== Export Reports (CSV) ==========
@router.get("/export/{report_type}")
async def export_report(
    report_type: str,
    format: str = "csv",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_admin)
):
    import csv
    from io import StringIO
    
    if report_type == "revenue":
        report_data = await get_revenue_report("monthly", start_date, end_date, current_user)
        data = report_data.get("data", [])
        
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["Period", "Amount", "Count", "New Signups", "Renewals"])
        for row in data:
            writer.writerow([row["period"], row["amount"], row["count"], row["new_signups"], row["renewals"]])
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=revenue_report.csv"}
        )
    
    elif report_type == "users":
        report_data = await get_user_report(None, None, start_date, end_date, current_user)
        data = report_data.get("users", [])
        
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Name", "Email", "Account Type", "KYC Status", "Created At"])
        for row in data:
            writer.writerow([row["id"], row["fullName"], row["email"], row["accountType"], row["kycStatus"], row["createdAt"]])
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=users_report.csv"}
        )
    
    elif report_type == "devices":
        report_data = await get_device_report(None, start_date, end_date, current_user)
        data = report_data.get("devices", [])
        
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Device Name", "Device ID", "Status", "Manufacturer", "Created At"])
        for row in data:
            writer.writerow([row["id"], row["deviceName"], row["deviceId"], row["status"], row.get("manufacturer", ""), row["createdAt"]])
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=devices_report.csv"}
        )
    
    else:
        raise HTTPException(status_code=400, detail="Invalid report type")
import re
from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from database import get_db
from models import (
    User,
    SusuGroup,
    GroupMember,
    ContributionPayment,
    PayoutDisbursement,
    GroupStatus,
    PaymentStatus,
    KYCStatus,
    MoMoWebhookLog
)
from schemas import sanitize_ghana_phone
from auth import get_admin_user
from services.sms_service import GhanaSMSService
from services.paystack_service import GhanaMoMoGateway
from pydantic import BaseModel

router = APIRouter(prefix="/api/admin", tags=["Executive Admin Portal"])

# Schemas for Admin Requests
class KYCStatusUpdateRequest(BaseModel):
    status: str # 'VERIFIED', 'PENDING', 'UNVERIFIED'
    note: Optional[str] = None

class BroadcastSMSRequest(BaseModel):
    message: str
    target: str # 'ALL_USERS', 'OVERDUE_MEMBERS', 'CIRCLE_MEMBERS'
    group_id: Optional[str] = None

class ReconcileRequest(BaseModel):
    note: Optional[str] = "Admin manual reconciliation"


@router.get("/metrics")
def get_admin_metrics(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Calculates real-time financial, operational, and risk KPIs for executive management."""
    # 1. Financial Volumes & Escrow Float
    total_volume = db.query(func.sum(ContributionPayment.amount)).filter(
        ContributionPayment.status == PaymentStatus.SUCCESS.value
    ).scalar() or 0.0

    total_payouts = db.query(func.sum(PayoutDisbursement.amount)).filter(
        PayoutDisbursement.status == PaymentStatus.SUCCESS.value
    ).scalar() or 0.0

    active_float = max(0.0, total_volume - total_payouts)

    # 2. Transparent Fee Breakdown:
    # Gateway: 1.95%, Commission: 1.00%, Platform Fee: 1.20%
    gateway_fees = round(total_volume * 0.0195, 2)
    commission_fees = round(total_volume * 0.0100, 2)
    platform_fees = round(total_volume * 0.0120, 2)
    net_revenue = round(gateway_fees + commission_fees + platform_fees, 2)

    # 3. User Demographics & KYC Funnel
    total_savers = db.query(User).count()
    verified_savers = db.query(User).filter(User.kyc_status == KYCStatus.VERIFIED.value).count()
    pending_kyc = db.query(User).filter(User.kyc_status == KYCStatus.PENDING.value).count()
    unverified_savers = db.query(User).filter(
        or_(User.kyc_status == KYCStatus.UNVERIFIED.value, User.kyc_status == None)
    ).count()

    kyc_rate = round((verified_savers / total_savers * 100), 1) if total_savers > 0 else 0.0

    # 4. Circles Operations
    active_circles = db.query(SusuGroup).filter(SusuGroup.status == GroupStatus.ACTIVE.value).count()
    recruiting_circles = db.query(SusuGroup).filter(SusuGroup.status == GroupStatus.RECRUITING.value).count()
    completed_circles = db.query(SusuGroup).filter(SusuGroup.status == GroupStatus.COMPLETED.value).count()

    # 5. Risk & Overdue Monitoring
    active_groups = db.query(SusuGroup).filter(SusuGroup.status == GroupStatus.ACTIVE.value).all()
    overdue_circles_count = 0
    for g in active_groups:
        unpaid_count = db.query(GroupMember).filter(
            GroupMember.group_id == g.id,
            GroupMember.has_paid_current_round == False
        ).count()
        if unpaid_count > 0:
            overdue_circles_count += 1

    return {
        "financials": {
            "total_volume_ghs": round(total_volume, 2),
            "total_payouts_disbursed_ghs": round(total_payouts, 2),
            "active_float_ghs": round(active_float, 2),
            "gateway_fees_ghs": gateway_fees,
            "commission_fees_ghs": commission_fees,
            "platform_fees_ghs": platform_fees,
            "net_revenue_ghs": net_revenue,
            "currency": "GH₵"
        },
        "savers": {
            "total_savers": total_savers,
            "verified_savers": verified_savers,
            "pending_kyc": pending_kyc,
            "unverified_savers": unverified_savers,
            "kyc_completion_rate": kyc_rate
        },
        "circles": {
            "active_count": active_circles,
            "recruiting_count": recruiting_circles,
            "completed_count": completed_circles,
            "overdue_count": overdue_circles_count,
            "default_rate": round((overdue_circles_count / active_circles * 100), 1) if active_circles > 0 else 0.0
        }
    }


@router.get("/users")
def list_admin_users(
    query: Optional[str] = None,
    kyc_status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Returns paginated, searchable savers list for KYC moderation and risk intervention."""
    q = db.query(User)

    if kyc_status and kyc_status != "ALL":
        q = q.filter(User.kyc_status == kyc_status)

    if query:
        clean = query.strip()
        q = q.filter(
            or_(
                User.full_name.ilike(f"%{clean}%"),
                User.phone_number.ilike(f"%{clean}%"),
                User.ghana_card_number.ilike(f"%{clean}%"),
                User.email.ilike(f"%{clean}%")
            )
        )

    total_count = q.count()
    users = q.order_by(desc(User.created_at)).offset(offset).limit(limit).all()

    result = []
    for u in users:
        # Count active circles joined
        active_circles_joined = db.query(GroupMember).join(SusuGroup).filter(
            GroupMember.phone_number == u.phone_number,
            SusuGroup.status == GroupStatus.ACTIVE.value
        ).count()

        result.append({
            "id": u.id,
            "full_name": u.full_name,
            "phone_number": u.phone_number,
            "email": u.email,
            "momo_provider": u.momo_provider,
            "momo_account_name": u.momo_account_name,
            "ghana_card_number": u.ghana_card_number,
            "kyc_status": u.kyc_status or "UNVERIFIED",
            "is_verified": bool(u.is_verified),
            "tier": u.tier or "BRONZE",
            "trust_score": u.trust_score if u.trust_score is not None else 100,
            "next_of_kin_name": u.next_of_kin_name,
            "next_of_kin_phone": u.next_of_kin_phone,
            "is_active": bool(u.is_active),
            "is_admin": bool(getattr(u, "is_admin", False)),
            "active_circles_count": active_circles_joined,
            "created_at": u.created_at.isoformat() if u.created_at else None
        })

    return {
        "total": total_count,
        "users": result
    }


@router.post("/users/{user_id}/kyc-status")
def update_user_kyc_status(
    user_id: str,
    payload: KYCStatusUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Approves or rejects a user's identity verification status."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    target_user.kyc_status = payload.status
    if payload.status == KYCStatus.VERIFIED.value:
        target_user.is_verified = True
        target_user.trust_score = min(100, (target_user.trust_score or 90) + 10)
    elif payload.status == KYCStatus.UNVERIFIED.value:
        target_user.is_verified = False

    db.commit()
    db.refresh(target_user)

    # Dispatch SMS confirmation if verified
    if payload.status == KYCStatus.VERIFIED.value and target_user.phone_number:
        try:
            GhanaSMSService.send_sms(
                phone_number=target_user.phone_number,
                message=f"Hello {target_user.full_name}, your SusuRow identity verification (Ghana Card) has been officially approved! You now have full access to circles and automated payouts."
            )
        except Exception:
            pass

    return {
        "success": True,
        "message": f"User KYC status updated to {payload.status}",
        "user_id": target_user.id,
        "kyc_status": target_user.kyc_status
    }


@router.post("/users/{user_id}/toggle-freeze")
def toggle_user_freeze(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Freezes or unfreezes a saver's account to stop default risks or fraud."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if target_user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot freeze your own administrator account.")

    target_user.is_active = not target_user.is_active
    db.commit()

    action = "unfrozen" if target_user.is_active else "frozen"
    return {
        "success": True,
        "message": f"Account has been {action}.",
        "is_active": target_user.is_active
    }


@router.post("/users/{user_id}/toggle-admin")
def toggle_user_admin(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Promotes or revokes administrative status for an employee / moderator."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if target_user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot demote yourself.")

    current_val = getattr(target_user, "is_admin", False)
    target_user.is_admin = not current_val
    db.commit()

    return {
        "success": True,
        "message": f"User admin status changed to {target_user.is_admin}",
        "is_admin": target_user.is_admin
    }


@router.get("/circles")
def list_admin_circles(
    status_filter: Optional[str] = None,
    query: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Returns all circles with live health badges (ON_TRACK, PAYMENTS_DUE, OVERDUE)."""
    q = db.query(SusuGroup)

    if status_filter and status_filter != "ALL":
        q = q.filter(SusuGroup.status == status_filter)

    if query:
        clean = query.strip()
        q = q.filter(
            or_(
                SusuGroup.name.ilike(f"%{clean}%"),
                SusuGroup.invite_code.ilike(f"%{clean}%"),
                SusuGroup.creator_id.ilike(f"%{clean}%")
            )
        )

    groups = q.order_by(desc(SusuGroup.created_at)).all()
    result = []

    for g in groups:
        # Determine paid members in current round
        paid_members_count = db.query(GroupMember).filter(
            GroupMember.group_id == g.id,
            GroupMember.has_paid_current_round == True
        ).count()

        total_members_count = db.query(GroupMember).filter(
            GroupMember.group_id == g.id
        ).count()

        health = "ON_TRACK"
        if g.status == GroupStatus.ACTIVE.value:
            if paid_members_count < total_members_count:
                health = "PAYMENTS_DUE"
            if paid_members_count == 0 and total_members_count > 0:
                health = "OVERDUE"

        # Find active recipient
        current_recipient_member = db.query(GroupMember).filter(
            GroupMember.group_id == g.id,
            GroupMember.payout_position == g.current_round
        ).first()

        result.append({
            "id": g.id,
            "name": g.name,
            "join_code": g.invite_code,
            "status": g.status,
            "health": health,
            "frequency": g.frequency,
            "rotation_type": g.rotation_type,
            "contribution_amount": g.contribution_amount,
            "total_pot": g.total_pool,
            "current_round": g.current_round,
            "total_rounds": g.members_count,
            "current_members_count": total_members_count,
            "max_members": g.members_count,
            "paid_members_count": paid_members_count,
            "round_deadline": None,
            "recipient_name": current_recipient_member.full_name if current_recipient_member else "Pending",
            "recipient_phone": current_recipient_member.phone_number if current_recipient_member else None,
            "created_at": g.created_at.isoformat() if g.created_at else None
        })

    return result


@router.get("/circles/{group_id}/members")
def get_circle_members_audit(
    group_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Inspects all members in a circle, their turn order, and whether they have paid for the active round."""
    group = db.query(SusuGroup).filter(SusuGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Circle not found.")

    members = db.query(GroupMember).filter(GroupMember.group_id == group_id).order_by(GroupMember.payout_position).all()

    result = []
    for m in members:
        result.append({
            "member_id": m.id,
            "name": m.full_name,
            "phone_number": m.phone_number,
            "momo_provider": m.momo_provider,
            "turn_order": m.payout_position,
            "payout_round": m.payout_position,
            "has_received_payout": bool(m.has_received_payout),
            "paid_current_round": bool(m.has_paid_current_round),
            "is_current_recipient": m.payout_position == group.current_round
        })

    return {
        "group_id": group.id,
        "group_name": group.name,
        "current_round": group.current_round,
        "total_rounds": group.members_count,
        "members": result
    }


@router.post("/circles/{group_id}/payout-override")
def override_circle_payout(
    group_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Emergency administrator override to trigger winner pot disbursement."""
    group = db.query(SusuGroup).filter(SusuGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Circle not found.")

    recipient = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.payout_position == group.current_round
    ).first()

    if not recipient:
        raise HTTPException(status_code=400, detail="No scheduled recipient found for active round.")

    # Record disbursement
    payout_ref = f"OVERRIDE_PAYOUT_{group.current_round}_{recipient.phone_number}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    payout = PayoutDisbursement(
        group_id=group.id,
        member_id=recipient.id,
        round_number=group.current_round,
        amount=group.total_pool,
        recipient_phone=recipient.phone_number,
        momo_provider=recipient.momo_provider or "MTN",
        transaction_reference=payout_ref,
        status=PaymentStatus.SUCCESS.value
    )
    db.add(payout)
    recipient.has_received_payout = True

    # Advance group round if not final
    if group.current_round < group.members_count:
        group.current_round += 1
        for m in group.members:
            m.has_paid_current_round = False
    else:
        group.status = GroupStatus.COMPLETED.value

    db.commit()

    # Send confirmation SMS
    try:
        GhanaSMSService.send_sms(
            phone_number=recipient.phone_number,
            message=f"CONGRATULATIONS {recipient.full_name}! Your Susu pot of GH₵{group.total_pool:.2f} for '{group.name}' Round {group.current_round - 1} has been disbursed to your {recipient.momo_provider} wallet."
        )
    except Exception:
        pass

    return {
        "success": True,
        "message": f"Pot payout of GH₵{group.total_pool:.2f} approved and disbursed to {recipient.full_name}."
    }


@router.get("/transactions")
def list_admin_transactions(
    query: Optional[str] = None,
    tx_type: Optional[str] = "ALL",
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Consolidated financial ledger of all member contributions and winner payouts."""
    results = []

    if tx_type in ["ALL", "CONTRIBUTION"]:
        cp_q = db.query(ContributionPayment).join(SusuGroup, ContributionPayment.group_id == SusuGroup.id)
        if query:
            clean = query.strip()
            cp_q = cp_q.filter(
                or_(
                    ContributionPayment.transaction_reference.ilike(f"%{clean}%"),
                    SusuGroup.name.ilike(f"%{clean}%")
                )
            )
        for cp in cp_q.order_by(desc(ContributionPayment.paid_at)).limit(limit).all():
            results.append({
                "id": cp.id,
                "type": "CONTRIBUTION",
                "reference": cp.transaction_reference,
                "group_name": cp.group.name if cp.group else "Group",
                "group_id": cp.group_id,
                "amount": cp.amount,
                "provider": cp.momo_provider,
                "status": cp.status,
                "created_at": cp.paid_at.isoformat() if cp.paid_at else None
            })

    if tx_type in ["ALL", "PAYOUT"]:
        pd_q = db.query(PayoutDisbursement).join(SusuGroup, PayoutDisbursement.group_id == SusuGroup.id)
        if query:
            clean = query.strip()
            pd_q = pd_q.filter(
                or_(
                    PayoutDisbursement.transaction_reference.ilike(f"%{clean}%"),
                    PayoutDisbursement.recipient_phone.ilike(f"%{clean}%"),
                    SusuGroup.name.ilike(f"%{clean}%")
                )
            )
        for pd in pd_q.order_by(desc(PayoutDisbursement.disbursed_at)).limit(limit).all():
            results.append({
                "id": pd.id,
                "type": "PAYOUT",
                "reference": pd.transaction_reference,
                "group_name": pd.group.name if pd.group else "Group",
                "group_id": pd.group_id,
                "amount": pd.amount,
                "provider": pd.momo_provider,
                "recipient_phone": pd.recipient_phone,
                "status": pd.status,
                "created_at": pd.disbursed_at.isoformat() if pd.disbursed_at else None
            })

    # Sort descending by timestamp
    results.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    return results[offset:offset + limit]


@router.post("/transactions/{tx_id}/reconcile")
def reconcile_transaction(
    tx_id: str,
    payload: ReconcileRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Manually marks a disputed or delayed MoMo transaction as SUCCESS."""
    cp = db.query(ContributionPayment).filter(ContributionPayment.id == tx_id).first()
    if cp:
        cp.status = PaymentStatus.SUCCESS.value
        db.commit()
        return {"success": True, "message": f"Payment {cp.transaction_reference} reconciled as SUCCESS."}

    pd = db.query(PayoutDisbursement).filter(PayoutDisbursement.id == tx_id).first()
    if pd:
        pd.status = PaymentStatus.SUCCESS.value
        db.commit()
        return {"success": True, "message": f"Payout {pd.transaction_reference} reconciled as SUCCESS."}

    raise HTTPException(status_code=404, detail="Transaction not found.")


@router.post("/broadcast-sms")
def broadcast_admin_sms(
    payload: BroadcastSMSRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Dispatches mass or circle-specific SMS alerts via Arkesel."""
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message text cannot be empty.")

    recipients = []
    if payload.target == "ALL_USERS":
        users = db.query(User).filter(User.phone_number != None).all()
        recipients = [u.phone_number for u in users if u.phone_number]
    elif payload.target == "CIRCLE_MEMBERS" and payload.group_id:
        members = db.query(GroupMember).filter(GroupMember.group_id == payload.group_id).all()
        recipients = [m.phone_number for m in members if m.phone_number]
    elif payload.target == "OVERDUE_MEMBERS":
        unpaid = db.query(GroupMember).join(SusuGroup).filter(
            SusuGroup.status == GroupStatus.ACTIVE.value,
            GroupMember.has_paid_current_round == False
        ).all()
        for m in unpaid:
            if m.phone_number:
                recipients.append(m.phone_number)

    # Remove duplicates
    unique_recipients = list(set(recipients))
    sent_count = 0
    for phone in unique_recipients:
        try:
            GhanaSMSService.send_sms(phone, payload.message)
            sent_count += 1
        except Exception:
            pass

    return {
        "success": True,
        "dispatched_count": sent_count,
        "target": payload.target
    }


@router.delete("/groups/{group_id}")
def admin_delete_group(
    group_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """
    Administrative deletion of any circle (Recruiting, Active, or Completed)
    upon user or customer support request.
    Safely cleans up associated payments, payouts, members, and the group itself.
    """
    group = db.query(SusuGroup).filter(SusuGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Susu circle not found.")

    group_name = group.name
    # Delete associated records
    db.query(ContributionPayment).filter(ContributionPayment.group_id == group_id).delete()
    db.query(PayoutDisbursement).filter(PayoutDisbursement.group_id == group_id).delete()
    db.query(GroupMember).filter(GroupMember.group_id == group_id).delete()
    db.delete(group)
    db.commit()

    return {
        "success": True,
        "message": f"Circle '{group_name}' was administratively deleted by Executive Admin."
    }


@router.post("/system/purge-test-data")
def purge_test_data(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """
    Cleans all mock data, test circles, contributions, payouts, and non-admin test users
    so the platform is 100% clean and ready for public production use.
    Guarantees that Executive Admin accounts are preserved.
    """
    # 1. Clean transactions & webhook logs
    db.query(ContributionPayment).delete()
    db.query(PayoutDisbursement).delete()
    db.query(MoMoWebhookLog).delete()

    # 2. Clean all group members & circles
    db.query(GroupMember).delete()
    db.query(SusuGroup).delete()

    # 3. Clean all non-admin test users while protecting admin accounts
    db.query(User).filter(
        or_(User.is_admin == False, User.is_admin == None)
    ).delete()

    db.commit()

    return {
        "success": True,
        "message": "All mock groups, test payments, and non-admin test users have been purged. Platform is clean and production ready.",
        "admin_preserved": admin.phone_number or admin.email
    }

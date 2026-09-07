import uuid
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import SusuGroup, GroupMember, ContributionPayment, PaymentStatus, GroupStatus, MoMoWebhookLog
from schemas import (
    PaymentInitiateRequest,
    PaymentWebhookPayload,
    PaymentResponse,
    GroupDetailResponse
)
from services.momo_service import GhanaMoMoService
from services.paystack_service import GhanaMoMoGateway
from services.rotation_engine import RotationEngine
from routes.groups import _build_detail_response

router = APIRouter(prefix="/api/payments", tags=["Ghana MoMo Payments"])

class SubmitPaymentOtpRequest(BaseModel):
    reference: str
    otp: str

@router.post("/initiate")
async def initiate_payment(payload: PaymentInitiateRequest, db: Session = Depends(get_db)):
    """
    Initiates a Ghana Mobile Money payment prompt for a round contribution or escrow deposit.
    Supports live Paystack Ghana (MTN, Telecel, AT) and simulated dev flow.
    """
    group = db.query(SusuGroup).filter(SusuGroup.id == payload.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Susu circle not found")

    member = db.query(GroupMember).filter(GroupMember.id == payload.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Circle member not found")

    if group.status == GroupStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail="This circle is completed. No more contributions accepted.")

    amount = group.commitment_deposit if payload.is_commitment_deposit else group.contribution_amount
    provider = payload.momo_provider or member.momo_provider or GhanaMoMoService.detect_provider(member.phone_number)
    reference = GhanaMoMoService.generate_transaction_ref(prefix=provider[:3].upper())

    # Call Ghana MoMo Gateway (Paystack or Simulation)
    charge_result = await GhanaMoMoGateway.charge_momo(
        phone_number=member.phone_number,
        amount_ghs=float(amount),
        provider=provider,
        email=f"{member.phone_number.replace('+', '')}@susurow.com",
        reference=reference,
        description=f"SusuRow Round {group.current_round} - {group.name}",
        extra_metadata={
            "group_id": group.id,
            "member_id": member.id,
            "phone_number": member.phone_number,
            "round_number": group.current_round,
            "is_commitment_deposit": payload.is_commitment_deposit
        }
    )

    prompt_text = charge_result.get("ussd_prompt") or f"Authorize payment of GH₵{amount:.2f} on {member.phone_number} ({provider})."

    # Save event log
    GhanaMoMoService.log_webhook_event(
        db=db,
        reference=reference,
        provider=provider,
        event_type="PAYMENT_INITIATED",
        payload={
            "group_id": group.id,
            "member_id": member.id,
            "round_number": group.current_round,
            "amount": amount,
            "is_commitment_deposit": payload.is_commitment_deposit,
            "gateway_result": charge_result
        }
    )

    return {
        "status": "INITIATED",
        "message": f"Payment prompt dispatched to {member.phone_number} ({provider})",
        "transaction_reference": reference,
        "amount": amount,
        "currency": "GHS",
        "provider": provider,
        "ussd_prompt": prompt_text,
        "requires_otp": charge_result.get("requires_otp", False),
        "gateway_status": charge_result.get("status", "pending"),
        "gateway": charge_result.get("gateway", "SIMULATED"),
        "expires_in_seconds": 120
    }

@router.post("/submit-otp")
async def submit_payment_otp(payload: SubmitPaymentOtpRequest, db: Session = Depends(get_db)):
    """
    Submits SMS OTP code to Paystack to authorize payment or trigger the USSD prompt.
    """
    result = await GhanaMoMoGateway.submit_otp(otp=payload.otp, reference=payload.reference)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error") or "Failed to verify OTP code with Paystack.")

    # Check if payment is paid
    verify_result = await GhanaMoMoGateway.verify_payment(payload.reference)
    if verify_result.get("paid"):
        await verify_transaction(payload.reference, db)

    return {
        "success": True,
        "status": result.get("status"),
        "message": result.get("display_text") or "Code submitted successfully. Please check your phone to confirm your PIN."
    }

@router.post("/webhook")
def process_momo_webhook(payload: PaymentWebhookPayload, db: Session = Depends(get_db)):
    """
    Standard webhook handler for Mobile Money settlements.
    Validates payment, records payment in DB, and advances the round if all members have paid.
    """
    GhanaMoMoService.log_webhook_event(
        db=db,
        reference=payload.transaction_reference,
        provider=payload.momo_provider,
        event_type="WEBHOOK_RECEIVED",
        payload=payload.model_dump()
    )

    if payload.status != "SUCCESS":
        return {"status": "ACKNOWLEDGED", "message": "Failed payment acknowledged"}

    clean_phone = payload.phone_number.replace("+233", "0").replace(" ", "")
    member = db.query(GroupMember).filter(
        (GroupMember.phone_number == clean_phone) | (GroupMember.phone_number == payload.phone_number)
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="No member found for this phone number")

    group = db.query(SusuGroup).filter(SusuGroup.id == member.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Circle not found for member")

    # Record payment
    payment = ContributionPayment(
        id=str(uuid.uuid4()),
        group_id=group.id,
        member_id=member.id,
        round_number=group.current_round,
        amount=payload.amount,
        momo_provider=payload.momo_provider,
        transaction_reference=payload.transaction_reference,
        status=PaymentStatus.SUCCESS.value,
        paid_at=datetime.utcnow()
    )
    db.add(payment)
    member.has_paid_current_round = True
    db.commit()

    # Trigger rotational engine check & advance
    advance_result = RotationEngine.check_and_advance_round(db, group)

    return {
        "status": "SETTLED",
        "transaction_reference": payload.transaction_reference,
        "member_id": member.id,
        "round_number": payment.round_number,
        "rotation_result": advance_result
    }

def _settle_payment(
    db: Session,
    reference: str,
    verify_data: Optional[Dict[str, Any]] = None,
    log_payload: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Idempotently records contribution payment in DB, sets member.has_paid_current_round = True,
    and advances rotation round if all members have paid.
    """
    verify_data = verify_data or {}
    log_payload = log_payload or {}

    metadata = verify_data.get("metadata") or {}
    if isinstance(metadata, str):
        try:
            metadata = json.loads(metadata)
        except Exception:
            metadata = {}

    group_id = log_payload.get("group_id") or metadata.get("group_id")
    member_id = log_payload.get("member_id") or metadata.get("member_id")
    is_escrow = log_payload.get("is_commitment_deposit") or metadata.get("is_commitment_deposit", False)

    # 1. Resolve member
    member = None
    if member_id:
        member = db.query(GroupMember).filter(GroupMember.id == member_id).first()

    if not member:
        customer = verify_data.get("customer") or {}
        cust_phone = (
            log_payload.get("phone_number")
            or metadata.get("phone_number")
            or metadata.get("mobile_number")
            or customer.get("phone")
            or ""
        )
        clean_phone = cust_phone.replace("+233", "0").replace(" ", "").replace("-", "").strip()
        if clean_phone.startswith("233"):
            clean_phone = "0" + clean_phone[3:]

        if group_id and clean_phone:
            member = db.query(GroupMember).filter(
                GroupMember.group_id == group_id,
                (GroupMember.phone_number == clean_phone) | (GroupMember.phone_number == cust_phone)
            ).first()

        if not member and clean_phone:
            member = db.query(GroupMember).filter(
                (GroupMember.phone_number == clean_phone) | (GroupMember.phone_number == cust_phone)
            ).order_by(GroupMember.joined_at.desc()).first()

    if not member:
        return {"settled": False, "reason": "No member found for transaction"}

    # 2. Resolve group
    group = db.query(SusuGroup).filter(SusuGroup.id == member.group_id).first()
    if not group:
        return {"settled": False, "reason": "Group not found for member"}

    # 3. Resolve amount
    amount = 0.0
    if verify_data.get("amount"):
        amount = float(verify_data.get("amount")) / 100.0
    elif log_payload.get("amount"):
        amount = float(log_payload.get("amount"))
    else:
        amount = float(group.commitment_deposit if is_escrow else group.contribution_amount)

    provider = (
        log_payload.get("provider")
        or metadata.get("provider")
        or member.momo_provider
        or "MTN"
    )

    # 4. Check existing payment to prevent duplicate records
    existing_payment = db.query(ContributionPayment).filter(
        ContributionPayment.transaction_reference == reference
    ).first()

    if not existing_payment:
        payment = ContributionPayment(
            id=str(uuid.uuid4()),
            group_id=group.id,
            member_id=member.id,
            round_number=group.current_round,
            amount=amount,
            momo_provider=provider,
            transaction_reference=reference,
            status=PaymentStatus.SUCCESS.value,
            paid_at=datetime.utcnow()
        )
        db.add(payment)

    if is_escrow:
        member.deposit_paid = True
    else:
        member.has_paid_current_round = True

    db.commit()

    # Log settlement event
    GhanaMoMoService.log_webhook_event(
        db=db,
        reference=reference,
        provider=provider,
        event_type="PAYMENT_SETTLED",
        payload={
            "group_id": group.id,
            "member_id": member.id,
            "amount": amount,
            "status": "SUCCESS",
            "is_commitment_deposit": is_escrow
        }
    )

    # Check and advance round
    advance_result = RotationEngine.check_and_advance_round(db, group)

    return {
        "settled": True,
        "member_id": member.id,
        "group_id": group.id,
        "amount": amount,
        "advance_result": advance_result
    }

@router.post("/paystack-webhook")
async def paystack_webhook(
    request: Request,
    x_paystack_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Live Paystack Webhook Handler with HMAC SHA512 signature verification.
    """
    body = await request.body()
    
    # If Paystack secret key is configured, verify HMAC signature
    is_valid = GhanaMoMoGateway.verify_paystack_webhook_signature(body, x_paystack_signature or "")
    
    try:
        event = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = event.get("event")
    data = event.get("data", {})
    reference = data.get("reference")

    if event_type == "charge.success" and reference:
        log = db.query(MoMoWebhookLog).filter(MoMoWebhookLog.transaction_reference == reference).first()
        log_payload = log.payload if log else {}
        _settle_payment(db, reference, verify_data=data, log_payload=log_payload)

    return {"status": "success"}

@router.post("/simulate-instant", response_model=GroupDetailResponse)
def simulate_instant_payment(payload: PaymentInitiateRequest, db: Session = Depends(get_db)):
    """
    Simulated Ghana MoMo payment for instant testing.
    """
    group = db.query(SusuGroup).filter(SusuGroup.id == payload.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Circle not found")

    member = db.query(GroupMember).filter(GroupMember.id == payload.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if group.status == GroupStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail="Circle is already completed.")

    if member.has_paid_current_round and not payload.is_commitment_deposit:
        raise HTTPException(status_code=400, detail="Member has already contributed for this round.")

    amount = group.commitment_deposit if payload.is_commitment_deposit else group.contribution_amount
    provider = payload.momo_provider or member.momo_provider
    ref = GhanaMoMoService.generate_transaction_ref(prefix=provider[:3].upper())

    payment = ContributionPayment(
        id=str(uuid.uuid4()),
        group_id=group.id,
        member_id=member.id,
        round_number=group.current_round,
        amount=amount,
        momo_provider=provider,
        transaction_reference=ref,
        status=PaymentStatus.SUCCESS.value,
        paid_at=datetime.utcnow()
    )
    db.add(payment)

    if payload.is_commitment_deposit:
        member.deposit_paid = True
    else:
        member.has_paid_current_round = True
    db.commit()

    RotationEngine.check_and_advance_round(db, group)
    db.refresh(group)

    return _build_detail_response(group)

@router.get("/{group_id}", response_model=List[PaymentResponse])
def get_group_payments(group_id: str, db: Session = Depends(get_db)):
    payments = db.query(ContributionPayment).filter(
        ContributionPayment.group_id == group_id
    ).order_by(ContributionPayment.paid_at.desc()).all()
    return [PaymentResponse.model_validate(p) for p in payments]


@router.get("/verify/{reference}")
async def verify_transaction(reference: str, db: Session = Depends(get_db)):
    """
    Verifies payment status with Paystack / Mobile Money network.
    Only marks as settled if Paystack confirms real successful transaction.
    """
    verify_result = await GhanaMoMoGateway.verify_payment(reference)
    if verify_result.get("paid"):
        log = db.query(MoMoWebhookLog).filter(MoMoWebhookLog.transaction_reference == reference).first()
        log_payload = log.payload if log else {}
        tx_data = verify_result.get("data") or {}

        settle_res = _settle_payment(db, reference, verify_data=tx_data, log_payload=log_payload)
        return {
            "status": "SUCCESS",
            "paid": True,
            "message": "Payment verified and contribution recorded!",
            "details": settle_res
        }

    return {
        "status": verify_result.get("status", "PENDING"),
        "paid": False,
        "message": "Payment is still pending authorization on your phone. Please approve the prompt on your SIM."
    }

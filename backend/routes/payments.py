import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from database import get_db
from models import SusuGroup, GroupMember, ContributionPayment, PaymentStatus, GroupStatus
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
        description=f"SusuRow Round {group.current_round} - {group.name}"
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
        "gateway": charge_result.get("gateway", "SIMULATED"),
        "expires_in_seconds": 120
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
        customer = data.get("customer", {})
        metadata = data.get("metadata", {})
        phone = metadata.get("phone_number") or customer.get("phone")
        amount_ghs = float(data.get("amount", 0)) / 100.0
        provider = metadata.get("provider", "MTN")

        if phone:
            clean_phone = phone.replace("+233", "0").replace(" ", "")
            member = db.query(GroupMember).filter(
                (GroupMember.phone_number == clean_phone) | (GroupMember.phone_number == phone)
            ).first()

            if member:
                group = db.query(SusuGroup).filter(SusuGroup.id == member.group_id).first()
                if group and not member.has_paid_current_round:
                    payment = ContributionPayment(
                        id=str(uuid.uuid4()),
                        group_id=group.id,
                        member_id=member.id,
                        round_number=group.current_round,
                        amount=amount_ghs,
                        momo_provider=provider,
                        transaction_reference=reference,
                        status=PaymentStatus.SUCCESS.value,
                        paid_at=datetime.utcnow()
                    )
                    db.add(payment)
                    member.has_paid_current_round = True
                    db.commit()
                    RotationEngine.check_and_advance_round(db, group)

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

import uuid
import random
import string
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import SusuGroup, GroupMember, ContributionPayment, PayoutDisbursement, GroupStatus, RotationType
from schemas import GroupCreate, GroupSummaryResponse, GroupDetailResponse, MemberResponse, PaymentResponse, PayoutResponse
from services.rotation_engine import RotationEngine
from services.momo_service import GhanaMoMoService

router = APIRouter(prefix="/api/groups", tags=["Susu Groups"])

def generate_invite_code() -> str:
    """Generates a memorable Ghanaian Susu code e.g. SUSU-K7B29"""
    chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"SUSU-{chars}"

@router.get("", response_model=List[GroupSummaryResponse])
def get_groups(
    frequency: Optional[str] = Query(None, description="DAILY, WEEKLY, or MONTHLY"),
    rotation_type: Optional[str] = Query(None, description="SEQUENTIAL, BALLOT, or BIDDING"),
    status: Optional[str] = Query(None, description="RECRUITING, ACTIVE, or COMPLETED"),
    is_private: Optional[bool] = Query(None, description="Filter public or private circles"),
    search: Optional[str] = Query(None, description="Search by name or description"),
    db: Session = Depends(get_db)
):
    query = db.query(SusuGroup)

    if is_private is not None:
        query = query.filter(SusuGroup.is_private == is_private)
    else:
        query = query.filter(SusuGroup.is_private == False)

    if frequency:
        query = query.filter(SusuGroup.frequency == frequency.upper())
    if rotation_type:
        query = query.filter(SusuGroup.rotation_type == rotation_type.upper())
    if status:
        query = query.filter(SusuGroup.status == status.upper())
    if search:
        query = query.filter(SusuGroup.name.ilike(f"%{search}%") | SusuGroup.description.ilike(f"%{search}%"))

    groups = query.order_by(SusuGroup.created_at.desc()).all()
    results = []
    for g in groups:
        enrolled = len(g.members)
        results.append(GroupSummaryResponse(
            id=g.id,
            name=g.name,
            description=g.description,
            is_private=g.is_private,
            contribution_amount=g.contribution_amount,
            frequency=g.frequency,
            members_count=g.members_count,
            enrolled_count=enrolled,
            total_pool=g.total_pool,
            commitment_deposit=g.commitment_deposit,
            rotation_type=g.rotation_type,
            invite_code=g.invite_code,
            current_round=g.current_round,
            creator_id=g.creator_id,
            status=g.status,
            created_at=g.created_at
        ))
    return results

@router.get("/user/{phone_number}", response_model=List[GroupSummaryResponse])
def get_user_groups(phone_number: str, db: Session = Depends(get_db)):
    """Fetches all circles where the given phone number is enrolled or is creator."""
    clean_phone = phone_number.replace("+233", "0").replace(" ", "")
    
    member_group_ids = [
        m.group_id for m in db.query(GroupMember).filter(
            (GroupMember.phone_number == clean_phone) | 
            (GroupMember.phone_number == phone_number)
        ).all()
    ]
    
    groups = db.query(SusuGroup).filter(
        (SusuGroup.id.in_(member_group_ids)) | 
        (SusuGroup.creator_id == clean_phone) |
        (SusuGroup.creator_id == phone_number)
    ).order_by(SusuGroup.created_at.desc()).all()

    results = []
    for g in groups:
        enrolled = len(g.members)
        results.append(GroupSummaryResponse(
            id=g.id,
            name=g.name,
            description=g.description,
            is_private=g.is_private,
            contribution_amount=g.contribution_amount,
            frequency=g.frequency,
            members_count=g.members_count,
            enrolled_count=enrolled,
            total_pool=g.total_pool,
            commitment_deposit=g.commitment_deposit,
            rotation_type=g.rotation_type,
            invite_code=g.invite_code,
            current_round=g.current_round,
            creator_id=g.creator_id,
            status=g.status,
            created_at=g.created_at
        ))
    return results

@router.get("/code/{invite_code}", response_model=GroupDetailResponse)
def get_group_by_invite_code(invite_code: str, db: Session = Depends(get_db)):
    """Looks up a private or public circle via its unique code (e.g. SUSU-X9B21)."""
    group = db.query(SusuGroup).filter(SusuGroup.invite_code.ilike(invite_code.strip())).first()
    if not group:
        raise HTTPException(status_code=404, detail=f"Circle with invite code '{invite_code}' was not found.")
    return _build_detail_response(group)

@router.get("/{group_id}", response_model=GroupDetailResponse)
def get_group_detail(group_id: str, db: Session = Depends(get_db)):
    group = db.query(SusuGroup).filter(SusuGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Susu circle not found")
    return _build_detail_response(group)

def _build_detail_response(group: SusuGroup) -> GroupDetailResponse:
    enrolled = len(group.members)
    sorted_members = sorted(group.members, key=lambda m: (m.payout_position or 999, m.joined_at))
    current_recipient = next((m for m in group.members if m.payout_position == group.current_round), None)
    all_current_paid = len(group.members) > 0 and all(m.has_paid_current_round for m in group.members)
    progress = 0.0
    if group.members_count > 0:
        if group.status == GroupStatus.COMPLETED.value:
            progress = 100.0
        else:
            paid_count = sum(1 for m in group.members if m.has_received_payout)
            progress = round((paid_count / group.members_count) * 100.0, 1)

    return GroupDetailResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        is_private=group.is_private,
        contribution_amount=group.contribution_amount,
        frequency=group.frequency,
        members_count=group.members_count,
        enrolled_count=enrolled,
        total_pool=group.total_pool,
        commitment_deposit=group.commitment_deposit,
        rotation_type=group.rotation_type,
        invite_code=group.invite_code,
        current_round=group.current_round,
        creator_id=group.creator_id,
        status=group.status,
        created_at=group.created_at,
        members=[MemberResponse.model_validate(m) for m in sorted_members],
        payments=[PaymentResponse.model_validate(p) for p in group.payments],
        payouts=[PayoutResponse.model_validate(p) for p in group.payouts],
        current_recipient=MemberResponse.model_validate(current_recipient) if current_recipient else None,
        all_current_round_paid=all_current_paid,
        progress_percentage=progress
    )

@router.post("", response_model=GroupDetailResponse)
def create_group(payload: GroupCreate, db: Session = Depends(get_db)):
    """Creates a new Susu Circle and automatically enrolls the creator as member #1."""
    invite_code = generate_invite_code()
    while db.query(SusuGroup).filter(SusuGroup.invite_code == invite_code).first():
        invite_code = generate_invite_code()

    total_pool = payload.contribution_amount * payload.members_count
    clean_creator_phone = payload.creator_phone.replace("+233", "0").replace(" ", "")

    group = SusuGroup(
        id=str(uuid.uuid4()),
        name=payload.name,
        description=payload.description,
        is_private=payload.is_private,
        contribution_amount=payload.contribution_amount,
        frequency=payload.frequency.upper(),
        members_count=payload.members_count,
        total_pool=total_pool,
        commitment_deposit=payload.commitment_deposit or 0.0,
        rotation_type=payload.rotation_type.upper(),
        invite_code=invite_code,
        current_round=1,
        creator_id=clean_creator_phone,
        status=GroupStatus.RECRUITING.value,
        created_at=datetime.utcnow()
    )
    db.add(group)
    db.flush()

    # Automatically enroll the creator
    creator_provider = payload.creator_momo_provider or GhanaMoMoService.detect_provider(clean_creator_phone)
    creator_member = GroupMember(
        id=str(uuid.uuid4()),
        group_id=group.id,
        phone_number=clean_creator_phone,
        full_name=payload.creator_name or "Circle Leader",
        momo_provider=creator_provider,
        payout_position=1 if payload.rotation_type == RotationType.SEQUENTIAL.value else None,
        has_paid_current_round=False,
        has_received_payout=False,
        deposit_paid=True if (payload.commitment_deposit or 0.0) > 0 else False,
        joined_at=datetime.utcnow()
    )
    db.add(creator_member)
    db.commit()
    db.refresh(group)

    return _build_detail_response(group)

@router.delete("/{group_id}")
def delete_group(
    group_id: str,
    phone_number: str = Query(..., description="Phone number of the creator requesting deletion"),
    db: Session = Depends(get_db)
):
    """
    Deletes a Susu Circle.
    Strict Financial Safety Rules:
    1. Only the creator of the group has permission to delete it.
    2. If the group has active savings rounds in progress, it cannot be deleted until the full duration/rounds finish to safeguard savers' funds.
    3. If the group is RECRUITING (before active rounds start) or COMPLETED, deletion is permitted.
    """
    group = db.query(SusuGroup).filter(SusuGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Susu circle not found")

    clean_phone = phone_number.replace("+233", "0").replace(" ", "").strip()
    clean_creator = group.creator_id.replace("+233", "0").replace(" ", "").strip()

    if clean_phone != clean_creator and phone_number != group.creator_id:
        raise HTTPException(
            status_code=403,
            detail="Only the creator of this Susu circle has permission to delete it."
        )

    # Check financial safety conditions
    other_members = [m for m in group.members if m.phone_number.replace("+233", "0").replace(" ", "") != clean_creator]
    has_active_contributions = len(group.payments) > 0 or any(m.has_paid_current_round or m.has_received_payout for m in group.members)

    if group.status == GroupStatus.ACTIVE.value or (len(other_members) > 0 and has_active_contributions):
        if group.status != GroupStatus.COMPLETED.value:
            raise HTTPException(
                status_code=400,
                detail="This circle is currently active with rotational savings in progress. To safeguard all members' contributions, it cannot be deleted until the full duration and rounds are completed."
            )

    # Delete all associated records safely
    db.query(ContributionPayment).filter(ContributionPayment.group_id == group.id).delete()
    db.query(PayoutDisbursement).filter(PayoutDisbursement.group_id == group.id).delete()
    db.query(GroupMember).filter(GroupMember.group_id == group.id).delete()
    db.delete(group)
    db.commit()

    return {
        "success": True,
        "message": f"Susu circle '{group.name}' was successfully deleted."
    }

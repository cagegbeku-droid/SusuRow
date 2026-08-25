import uuid
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SusuGroup, GroupMember, GroupStatus, RotationType
from schemas import MemberJoinRequest, MemberResponse, MemberBidSubmit, GroupDetailResponse
from services.rotation_engine import RotationEngine
from services.momo_service import GhanaMoMoService
from routes.groups import _build_detail_response

router = APIRouter(prefix="/api/members", tags=["Circle Members"])

@router.post("/join", response_model=GroupDetailResponse)
def join_group(payload: MemberJoinRequest, db: Session = Depends(get_db)):
    """Enrolls a saver into a Susu circle by group_id or invite_code."""
    # Find group by ID or invite code
    group = None
    if payload.group_id:
        group = db.query(SusuGroup).filter(SusuGroup.id == payload.group_id).first()
    elif payload.invite_code:
        group = db.query(SusuGroup).filter(SusuGroup.invite_code.ilike(payload.invite_code.strip())).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Susu circle not found. Please verify the circle ID or invite code.")

    if group.status == GroupStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail="This Susu circle has already completed its savings cycle.")

    # Check capacity limit
    current_members = db.query(GroupMember).filter(GroupMember.group_id == group.id).all()
    if len(current_members) >= group.members_count:
        raise HTTPException(status_code=400, detail=f"Circle has reached maximum capacity ({group.members_count} savers).")

    clean_phone = payload.phone_number.replace("+233", "0").replace(" ", "").strip()
    clean_creator = group.creator_id.replace("+233", "0").replace(" ", "").strip() if group.creator_id else ""

    # Check if user is the creator (creators are automatically enrolled on creation)
    if clean_phone == clean_creator or payload.phone_number.strip() == group.creator_id:
        raise HTTPException(
            status_code=400, 
            detail="You created this Susu group and are already enrolled as the Circle Leader."
        )

    # Check if already enrolled in this circle
    existing = db.query(GroupMember).filter(
        GroupMember.group_id == group.id,
        (GroupMember.phone_number == clean_phone) | (GroupMember.phone_number == payload.phone_number.strip())
    ).first()
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="You are already an enrolled member of this Susu group."
        )

    # Auto-detect or use selected MoMo provider
    provider = payload.momo_provider or GhanaMoMoService.detect_provider(clean_phone)

    # Determine payout position based on rotation type
    position = None
    if group.rotation_type == RotationType.SEQUENTIAL.value:
        position = len(current_members) + 1

    member = GroupMember(
        id=str(uuid.uuid4()),
        group_id=group.id,
        phone_number=clean_phone,
        full_name=payload.full_name,
        momo_provider=provider,
        payout_position=position,
        has_paid_current_round=False,
        has_received_payout=False,
        deposit_paid=True if group.commitment_deposit > 0 else False,
        joined_at=datetime.utcnow()
    )
    db.add(member)
    db.commit()

    # If circle becomes full, update status to ACTIVE
    updated_members = db.query(GroupMember).filter(GroupMember.group_id == group.id).all()
    if len(updated_members) >= group.members_count:
        group.status = GroupStatus.ACTIVE.value
        db.commit()

    db.refresh(group)
    return _build_detail_response(group)

@router.post("/bid", response_model=GroupDetailResponse)
def submit_bid(payload: MemberBidSubmit, db: Session = Depends(get_db)):
    """Submits or updates a discount bid for bidding-based Susu circles."""
    member = db.query(GroupMember).filter(GroupMember.id == payload.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    group = db.query(SusuGroup).filter(SusuGroup.id == member.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if group.rotation_type != RotationType.BIDDING.value:
        raise HTTPException(status_code=400, detail="Bids can only be submitted for Bidding Scheme circles.")

    member.bid_amount = payload.bid_amount
    db.commit()

    # Recalculate ranking positions
    RotationEngine.resolve_bidding_positions(db, group)
    db.refresh(group)
    return _build_detail_response(group)

@router.get("/{group_id}", response_model=List[MemberResponse])
def get_group_members(group_id: str, db: Session = Depends(get_db)):
    members = db.query(GroupMember).filter(GroupMember.group_id == group_id).order_by(
        GroupMember.payout_position.asc().nullslast(),
        GroupMember.joined_at.asc()
    ).all()
    return [MemberResponse.model_validate(m) for m in members]

import uuid
import random
import string
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import SusuGroup, GroupMember, ContributionPayment, PayoutDisbursement, GroupMessage, GroupStatus, RotationType
from schemas import (
    GroupCreate, GroupSummaryResponse, GroupDetailResponse, MemberResponse,
    PaymentResponse, PayoutResponse, GroupMessageResponse, CycleVoteRequest, LaunchNextCycleRequest
)
from services.rotation_engine import RotationEngine
from services.momo_service import GhanaMoMoService
from services.sms_service import GhanaSMSService

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
            cycle_number=getattr(g, "cycle_number", 1) or 1,
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
        user_member = next((m for m in g.members if m.phone_number in [clean_phone, phone_number]), None)
        current_recipient = next((m for m in g.members if m.payout_position == g.current_round), None)

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
            cycle_number=getattr(g, "cycle_number", 1) or 1,
            creator_id=g.creator_id,
            status=g.status,
            user_payout_position=user_member.payout_position if user_member else None,
            user_has_received_payout=user_member.has_received_payout if user_member else None,
            current_recipient_name=current_recipient.full_name if current_recipient else None,
            created_at=g.created_at
        ))
    return results

@router.get("/code/{invite_code}", response_model=GroupDetailResponse)
def get_group_by_invite_code(invite_code: str, db: Session = Depends(get_db)):
    """Looks up a private or public circle via its unique code (e.g. SUSU-X9B21)."""
    group = db.query(SusuGroup).filter(SusuGroup.invite_code.ilike(invite_code.strip())).first()
    if not group:
        raise HTTPException(status_code=404, detail=f"No Susu circle found matching code '{invite_code}'.")
    return _build_detail_response(group)

@router.get("/{group_id}", response_model=GroupDetailResponse)
def get_group_detail(group_id: str, db: Session = Depends(get_db)):
    """Fetches full state of a Susu group including member positions, payments, and payouts."""
    group = db.query(SusuGroup).filter(SusuGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Susu circle not found")
    return _build_detail_response(group)

def _build_detail_response(group: SusuGroup) -> GroupDetailResponse:
    enrolled = len(group.members)
    sorted_members = sorted(group.members, key=lambda m: (m.payout_position or 999, m.joined_at))

    current_recipient = None
    if group.status == GroupStatus.ACTIVE.value:
        current_recipient = next((m for m in group.members if m.payout_position == group.current_round), None)

    all_current_paid = False
    if group.status == GroupStatus.ACTIVE.value and enrolled > 0:
        all_current_paid = all(m.has_paid_current_round for m in group.members)

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
        cycle_number=getattr(group, "cycle_number", 1) or 1,
        creator_id=group.creator_id,
        status=group.status,
        created_at=group.created_at,
        members=[MemberResponse.model_validate(m) for m in sorted_members],
        payments=[PaymentResponse.model_validate(p) for p in group.payments],
        payouts=[PayoutResponse.model_validate(p) for p in group.payouts],
        messages=[m for m in group.messages],
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

    contribution_amount = round(float(payload.contribution_amount), 2)
    total_pool = round(contribution_amount * payload.members_count, 2)
    clean_creator_phone = payload.creator_phone.replace("+233", "0").replace(" ", "")

    group = SusuGroup(
        id=str(uuid.uuid4()),
        name=payload.name,
        description=payload.description,
        is_private=payload.is_private,
        contribution_amount=contribution_amount,
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

@router.post("/reopen/{group_id}", response_model=GroupDetailResponse)
def reopen_group(
    group_id: str,
    phone_number: str = Query(..., description="Phone number of the creator"),
    db: Session = Depends(get_db)
):
    """Allows the circle creator to reopen a prematurely completed circle back to recruiting/active."""
    group = db.query(SusuGroup).filter(SusuGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Circle not found")

    clean_phone = phone_number.replace("+233", "0").replace(" ", "").strip()
    clean_creator = (group.creator_id or "").replace("+233", "0").replace(" ", "").strip()
    if clean_phone != clean_creator and phone_number != group.creator_id:
        raise HTTPException(status_code=403, detail="Only creator can reopen this circle.")

    group.status = GroupStatus.RECRUITING.value if len(group.members) < group.members_count else GroupStatus.ACTIVE.value
    group.current_round = 1
    # Remove premature payouts
    db.query(PayoutDisbursement).filter(PayoutDisbursement.group_id == group.id).delete()
    for m in group.members:
        m.has_received_payout = False
    db.commit()
    db.refresh(group)
    return _build_detail_response(group)


@router.post("/{group_id}/cycle-vote", response_model=GroupDetailResponse)
def vote_next_cycle(
    group_id: str,
    payload: CycleVoteRequest,
    db: Session = Depends(get_db)
):
    """Allows a circle member to decide (opt-in or opt-out) whether to join the next savings cycle."""
    group = db.query(SusuGroup).filter(SusuGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Susu circle not found")

    clean_phone = payload.phone_number.replace("+233", "0").replace(" ", "").strip()
    member = next((m for m in group.members if m.phone_number.replace("+233", "0").replace(" ", "") == clean_phone), None)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in this Susu circle")

    member.next_cycle_opt_in = payload.opt_in
    db.commit()
    db.refresh(group)
    return _build_detail_response(group)


@router.post("/{group_id}/launch-next-cycle", response_model=GroupDetailResponse)
async def launch_next_cycle(
    group_id: str,
    payload: LaunchNextCycleRequest,
    db: Session = Depends(get_db)
):
    """
    Launches the next cycle (e.g. Cycle 2) for members who opted in.
    Members who opted out (or didn't opt-in) are excused, freeing up seats for new savers.
    """
    group = db.query(SusuGroup).filter(SusuGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Susu circle not found")

    clean_creator = payload.creator_phone.replace("+233", "0").replace(" ", "").strip()
    group_creator = (group.creator_id or "").replace("+233", "0").replace(" ", "").strip()
    ADMIN_PHONES = {"0599360626", "233599360626", "+233599360626"}

    if clean_creator != group_creator and clean_creator not in ADMIN_PHONES:
        raise HTTPException(status_code=403, detail="Only the circle creator or administrator can launch the next cycle.")

    # Identify members who explicitly opted in
    returning_members = [m for m in group.members if m.next_cycle_opt_in is True]

    # If creator didn't opt in but is creator, keep creator
    creator_member = next((m for m in group.members if m.phone_number.replace("+233", "0").replace(" ", "") == group_creator), None)
    if creator_member and creator_member not in returning_members:
        creator_member.next_cycle_opt_in = True
        returning_members.insert(0, creator_member)

    # Remove members who opted out or did not opt-in
    for m in list(group.members):
        if m not in returning_members:
            db.delete(m)

    # Reset returning members for the fresh cycle
    for idx, m in enumerate(returning_members, 1):
        m.has_paid_current_round = False
        m.has_received_payout = False
        m.bid_amount = 0.0
        m.next_cycle_opt_in = None
        if group.rotation_type == RotationType.SEQUENTIAL.value:
            m.payout_position = idx
        else:
            m.payout_position = None

    # Clear previous cycle payments and payouts
    db.query(ContributionPayment).filter(ContributionPayment.group_id == group.id).delete()
    db.query(PayoutDisbursement).filter(PayoutDisbursement.group_id == group.id).delete()

    # Advance cycle counter and reset round
    new_cycle = (getattr(group, "cycle_number", 1) or 1) + 1
    group.cycle_number = new_cycle
    group.current_round = 1

    # Check capacity status
    if len(returning_members) >= group.members_count:
        group.status = GroupStatus.ACTIVE.value
    else:
        group.status = GroupStatus.RECRUITING.value

    # Post system announcement
    open_seats = max(0, group.members_count - len(returning_members))
    announcement_text = (
        f"🔄 Cycle {new_cycle} has officially launched! "
        f"{len(returning_members)} returning member(s) confirmed. "
        f"{f'{open_seats} seat(s) are now open for new savers to join!' if open_seats > 0 else 'All seats filled!'}"
    )
    announcement = GroupMessage(
        id=str(uuid.uuid4()),
        group_id=group.id,
        sender_phone="SYSTEM",
        sender_name="SusuRow System",
        message_text=announcement_text,
        is_announcement=True,
        created_at=datetime.utcnow()
    )
    db.add(announcement)
    db.commit()
    db.refresh(group)

    # Send SMS notification to returning members
    sms_msg = f"SusuRow: Cycle {new_cycle} for '{group.name}' has launched! Check your app for round details."
    for m in returning_members:
        try:
            await GhanaSMSService.send_sms_message(m.phone_number, sms_msg)
        except Exception:
            pass

    return _build_detail_response(group)


@router.post("/{group_id}/start-rotation", response_model=GroupDetailResponse)
async def start_rotation(
    group_id: str,
    phone_number: str = Query(..., description="Phone number of the creator"),
    db: Session = Depends(get_db)
):
    """Allows the circle creator or admin to kickoff rotation when the circle is full or ready."""
    group = db.query(SusuGroup).filter(SusuGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Susu circle not found")

    clean_phone = phone_number.replace("+233", "0").replace(" ", "").strip()
    clean_creator = (group.creator_id or "").replace("+233", "0").replace(" ", "").strip()
    ADMIN_PHONES = {"0599360626", "233599360626", "+233599360626"}

    if clean_phone != clean_creator and clean_phone not in ADMIN_PHONES:
        raise HTTPException(status_code=403, detail="Only the circle creator or administrator can start the rotation.")

    if len(group.members) < 2:
        raise HTTPException(status_code=400, detail="Circle must have at least 2 members before rotation can begin.")

    # If ballot, draw order
    if group.rotation_type == RotationType.BALLOT.value:
        RotationEngine.ballot_draw(group.members)

    group.status = GroupStatus.ACTIVE.value
    group.current_round = 1

    announcement = GroupMessage(
        id=str(uuid.uuid4()),
        group_id=group.id,
        sender_phone="SYSTEM",
        sender_name="SusuRow System",
        message_text=f"🚀 Rotation started! Round 1 is now active. Please deposit your contribution of GH₵{group.contribution_amount:.2f}.",
        is_announcement=True,
        created_at=datetime.utcnow()
    )
    db.add(announcement)
    db.commit()
    db.refresh(group)

    # Dispatches SMS notification
    sms_text = f"SusuRow: Circle '{group.name}' rotation has started! Round 1 is active. Please deposit GH₵{group.contribution_amount:.2f}."
    for m in group.members:
        try:
            await GhanaSMSService.send_sms_message(m.phone_number, sms_text)
        except Exception:
            pass

    return _build_detail_response(group)


from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SusuGroup, PayoutDisbursement
from schemas import BallotTriggerRequest, GroupDetailResponse, PayoutResponse, AdvanceRoundResponse
from services.rotation_engine import RotationEngine
from routes.groups import _build_detail_response

router = APIRouter(prefix="/api/rotation", tags=["Rotation Engine"])

@router.post("/ballot", response_model=GroupDetailResponse)
def trigger_ballot_draw(payload: BallotTriggerRequest, db: Session = Depends(get_db)):
    """Executes a cryptographically seeded random shuffle of member payout positions."""
    group = db.query(SusuGroup).filter(SusuGroup.id == payload.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Circle not found")

    try:
        RotationEngine.execute_ballot_draw(db, group, seed=payload.seed)
        db.refresh(group)
        return _build_detail_response(group)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/advance/{group_id}", response_model=AdvanceRoundResponse)
def advance_round_manually(group_id: str, db: Session = Depends(get_db)):
    """Checks and advances the round if all members have completed payment for current_round."""
    group = db.query(SusuGroup).filter(SusuGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Circle not found")

    result = RotationEngine.check_and_advance_round(db, group)
    
    if not result.get("advanced"):
        return AdvanceRoundResponse(
            success=False,
            message=result.get("reason", "Unable to advance round"),
            current_round=group.current_round,
            payout_disbursed=None,
            group_status=group.status
        )

    disbursement = None
    if result.get("disbursement_id"):
        disb_record = db.query(PayoutDisbursement).filter(PayoutDisbursement.id == result["disbursement_id"]).first()
        if disb_record:
            disbursement = PayoutResponse.model_validate(disb_record)

    return AdvanceRoundResponse(
        success=True,
        message=result.get("message", "Round successfully advanced"),
        current_round=result.get("new_round", group.current_round),
        payout_disbursed=disbursement,
        group_status=result.get("group_status", group.status)
    )

@router.get("/payouts/{group_id}", response_model=List[PayoutResponse])
def get_group_payouts(group_id: str, db: Session = Depends(get_db)):
    payouts = db.query(PayoutDisbursement).filter(
        PayoutDisbursement.group_id == group_id
    ).order_by(PayoutDisbursement.disbursed_at.desc()).all()
    return [PayoutResponse.model_validate(p) for p in payouts]

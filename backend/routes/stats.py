from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import SusuGroup, GroupMember, ContributionPayment, PayoutDisbursement, GroupStatus
from schemas import PlatformStats

router = APIRouter(prefix="/api/stats", tags=["Platform Analytics"])

@router.get("", response_model=PlatformStats)
def get_platform_stats(db: Session = Depends(get_db)):
    """Calculates overall SusuRow network metrics."""
    total_payments = db.query(func.sum(ContributionPayment.amount)).scalar() or 0.0
    total_payouts = db.query(func.sum(PayoutDisbursement.amount)).scalar() or 0.0
    
    active_circles = db.query(SusuGroup).filter(
        SusuGroup.status.in_([GroupStatus.ACTIVE.value, GroupStatus.RECRUITING.value])
    ).count()
    
    completed_circles = db.query(SusuGroup).filter(
        SusuGroup.status == GroupStatus.COMPLETED.value
    ).count()
    
    total_savers = db.query(GroupMember).count()

    return PlatformStats(
        total_pooled_ghs=round(total_payments, 2),
        total_payouts_disbursed_ghs=round(total_payouts, 2),
        active_circles_count=active_circles,
        completed_circles_count=completed_circles,
        total_savers_count=total_savers,
        default_rate=0.0
    )

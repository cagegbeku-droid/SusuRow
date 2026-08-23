from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
from services.reminders import send_round_due_reminders
from typing import Optional

router = APIRouter(prefix="/api/reminders", tags=["Automated Reminders"])

@router.post("/send-due-reminders")
async def trigger_due_reminders(
    group_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Triggers automated SMS reminders to members with due payments in active Susu groups.
    Can be scheduled via Cron or triggered on demand.
    """
    result = await send_round_due_reminders(db, group_id=group_id)
    return result

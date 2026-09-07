from sqlalchemy.orm import Session
from models import SusuGroup, GroupMember, GroupStatus
from services.sms_service import GhanaSMSService
import asyncio
from typing import List, Dict, Any

async def send_round_due_reminders(db: Session, group_id: str = None) -> Dict[str, Any]:
    """
    Finds active groups where members have not paid the current round and sends a polite SMS reminder.
    """
    query = db.query(SusuGroup).filter(SusuGroup.status == GroupStatus.ACTIVE.value)
    if group_id:
        query = query.filter(SusuGroup.id == group_id)
    
    active_groups = query.all()
    reminded_members = []
    failed_members = []

    from models import User

    for group in active_groups:
        unpaid_members = [m for m in group.members if not m.has_paid_current_round]
        freq_label = (group.frequency or "ROUND").capitalize()
        for member in unpaid_members:
            clean_phone = member.phone_number.replace("+233", "0").replace(" ", "").replace("-", "").strip()
            user = db.query(User).filter(
                (User.phone_number == clean_phone) | (User.phone_number == member.phone_number)
            ).first()
            if user and user.auto_debit_enabled and user.security_pin_hash:
                # Automated deduction is configured with authorized PIN; skip manual SMS nagging
                continue

            message = (
                f"SusuRow Reminder: Your {freq_label} contribution of GH₵{group.contribution_amount:.2f} "
                f"for '{group.name}' (Round {group.current_round}) is due. "
                f"Kindly open SusuRow to make your payment."
            )
            try:
                res = await GhanaSMSService.send_sms_message(member.phone_number, message)
                if res.get("success"):
                    reminded_members.append({
                        "phone_number": member.phone_number,
                        "group_name": group.name,
                        "amount": group.contribution_amount
                    })
                else:
                    failed_members.append({
                        "phone_number": member.phone_number,
                        "error": res.get("error")
                    })
            except Exception as e:
                failed_members.append({
                    "phone_number": member.phone_number,
                    "error": str(e)
                })

    return {
        "status": "success",
        "total_reminded": len(reminded_members),
        "reminded_members": reminded_members,
        "failed_members": failed_members
    }

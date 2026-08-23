from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from database import get_db
from models import GroupMessage, SusuGroup, GroupMember
from schemas import GroupMessageCreate, GroupMessageResponse

router = APIRouter(prefix="/api/chat", tags=["In-Group Chat"])

@router.get("/{group_id}/messages", response_model=List[GroupMessageResponse])
def get_group_messages(group_id: str, db: Session = Depends(get_db)):
    """Fetch all messages posted inside a Susu group."""
    group = db.query(SusuGroup).filter(SusuGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Susu group not found.")

    messages = (
        db.query(GroupMessage)
        .filter(GroupMessage.group_id == group_id)
        .order_by(GroupMessage.created_at.asc())
        .limit(100)
        .all()
    )
    return messages


@router.post("/send", response_model=GroupMessageResponse)
def send_group_message(payload: GroupMessageCreate, db: Session = Depends(get_db)):
    """Post a message or announcement inside a Susu group."""
    group = db.query(SusuGroup).filter(SusuGroup.id == payload.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Susu group not found.")

    # Check if sender is enrolled in the group or creator
    clean_sender = payload.sender_phone.replace("+233", "0").replace(" ", "")
    is_creator = group.creator_id.replace("+233", "0").replace(" ", "") == clean_sender
    is_member = (
        db.query(GroupMember)
        .filter(
            GroupMember.group_id == payload.group_id,
            GroupMember.phone_number == clean_sender
        )
        .first()
    )

    if not is_creator and not is_member:
        raise HTTPException(
            status_code=403,
            detail="Only enrolled group members can post messages."
        )

    msg = GroupMessage(
        id=str(uuid.uuid4()),
        group_id=payload.group_id,
        sender_phone=clean_sender,
        sender_name=payload.sender_name.strip(),
        message_text=payload.message_text.strip(),
        is_announcement=payload.is_announcement
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

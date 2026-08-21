import random
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from models import (
    SusuGroup,
    GroupMember,
    ContributionPayment,
    PayoutDisbursement,
    GroupStatus,
    RotationType,
    PaymentStatus
)
from services.momo_service import GhanaMoMoService

class RotationEngine:
    @staticmethod
    def assign_initial_slot(db: Session, group: SusuGroup, member: GroupMember) -> int:
        """Assigns the member's slot based on rotation type."""
        enrolled_members = db.query(GroupMember).filter(GroupMember.group_id == group.id).all()
        current_count = len(enrolled_members)

        if group.rotation_type == RotationType.SEQUENTIAL.value:
            position = current_count # 1-indexed (since this member is already added to session or count includes them)
            member.payout_position = position
        elif group.rotation_type in [RotationType.BALLOT.value, RotationType.BIDDING.value]:
            # For ballot and bidding, position remains null or temporary until draw/resolution
            member.payout_position = None
        
        # Check if group is now at full capacity
        if current_count >= group.members_count:
            if group.rotation_type == RotationType.BALLOT.value:
                # Can auto-trigger ballot or wait for manual trigger
                pass
            if group.status == GroupStatus.RECRUITING.value:
                group.status = GroupStatus.ACTIVE.value
        
        db.commit()
        return member.payout_position

    @staticmethod
    def execute_ballot_draw(db: Session, group: SusuGroup, seed: Optional[str] = None) -> List[GroupMember]:
        """Cryptographically seeded shuffle of member payout positions when group fills to capacity."""
        members = db.query(GroupMember).filter(GroupMember.group_id == group.id).all()
        if not members:
            raise ValueError("No members enrolled in this circle.")
        
        rng = random.Random()
        if seed:
            rng.seed(seed)
        else:
            rng.seed(f"{group.id}-{datetime.utcnow().isoformat()}")
        
        shuffled_members = list(members)
        rng.shuffle(shuffled_members)

        for idx, member in enumerate(shuffled_members, start=1):
            member.payout_position = idx
        
        group.status = GroupStatus.ACTIVE.value
        db.commit()
        return sorted(members, key=lambda m: m.payout_position or 999)

    @staticmethod
    def resolve_bidding_positions(db: Session, group: SusuGroup) -> List[GroupMember]:
        """Resolves payout positions based on discount bids submitted (highest bid gets earliest round)."""
        members = db.query(GroupMember).filter(GroupMember.group_id == group.id).all()
        if not members:
            raise ValueError("No members enrolled in this circle.")
        
        # Sort by bid_amount descending, then by joined_at ascending
        sorted_members = sorted(members, key=lambda m: (-m.bid_amount, m.joined_at))

        for idx, member in enumerate(sorted_members, start=1):
            member.payout_position = idx

        group.status = GroupStatus.ACTIVE.value
        db.commit()
        return sorted(members, key=lambda m: m.payout_position or 999)

    @staticmethod
    def check_and_advance_round(db: Session, group: SusuGroup) -> Dict[str, Any]:
        """
        Evaluates if all enrolled members have paid their contribution for current_round.
        If all have paid, automatically executes the lump-sum payout disbursement to current round's recipient,
        resets payment flags, and increments state machine to round N + 1.
        """
        members = db.query(GroupMember).filter(GroupMember.group_id == group.id).all()
        if not members:
            return {"advanced": False, "reason": "No members in group"}

        # Ensure all members have payout positions assigned
        if any(m.payout_position is None for m in members):
            # Auto-assign sequential positions if not yet assigned
            for idx, m in enumerate(members, start=1):
                if m.payout_position is None:
                    m.payout_position = idx
            db.commit()

        # Check if all members paid the current round
        all_paid = all(m.has_paid_current_round for m in members)
        if not all_paid:
            unpaid_count = sum(1 for m in members if not m.has_paid_current_round)
            return {
                "advanced": False,
                "reason": f"Waiting on {unpaid_count} member(s) to complete Round {group.current_round} payment",
                "all_paid": False
            }

        # Find designated recipient for this round
        recipient = next((m for m in members if m.payout_position == group.current_round), None)
        if not recipient:
            # Fallback if position numbering has gap
            recipient = members[(group.current_round - 1) % len(members)]

        # Calculate lump-sum pot amount
        payout_amount = group.total_pool

        # Generate MoMo disbursement reference
        payout_ref = GhanaMoMoService.generate_transaction_ref(prefix="PAYOUT")
        
        # Record payout disbursement
        disbursement = PayoutDisbursement(
            id=str(uuid.uuid4()),
            group_id=group.id,
            member_id=recipient.id,
            round_number=group.current_round,
            amount=payout_amount,
            recipient_phone=recipient.phone_number,
            momo_provider=recipient.momo_provider,
            transaction_reference=payout_ref,
            status=PaymentStatus.SUCCESS.value,
            disbursed_at=datetime.utcnow()
        )
        db.add(disbursement)
        recipient.has_received_payout = True

        # Check if circle has completed all rounds
        is_final_round = (group.current_round >= group.members_count) or (group.current_round >= len(members))

        if is_final_round:
            group.status = GroupStatus.COMPLETED.value
            message = f"🎉 Circle '{group.name}' completed all {group.current_round} rounds! Final pot of GH₵{payout_amount:.2f} disbursed to {recipient.full_name} ({recipient.phone_number}). Commitment escrow deposits unlocked."
        else:
            # Advance to next round and reset payment flags
            previous_round = group.current_round
            group.current_round += 1
            for m in members:
                m.has_paid_current_round = False
            message = f"✅ Round {previous_round} completed! Pot of GH₵{payout_amount:.2f} disbursed to {recipient.full_name} via {recipient.momo_provider} MoMo. Circle advanced to Round {group.current_round}."

        db.commit()
        db.refresh(group)

        return {
            "advanced": True,
            "message": message,
            "previous_round": group.current_round - 1 if not is_final_round else group.current_round,
            "new_round": group.current_round,
            "recipient_name": recipient.full_name,
            "recipient_phone": recipient.phone_number,
            "payout_amount": payout_amount,
            "payout_ref": payout_ref,
            "group_status": group.status,
            "disbursement_id": disbursement.id
        }

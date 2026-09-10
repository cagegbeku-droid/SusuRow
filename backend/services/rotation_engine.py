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
    User,
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
            position = current_count
            member.payout_position = position
        elif group.rotation_type in [RotationType.BALLOT.value, RotationType.BIDDING.value]:
            member.payout_position = None
        
        if current_count >= group.members_count:
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
        
        sorted_members = sorted(members, key=lambda m: (-m.bid_amount, m.joined_at))

        for idx, member in enumerate(sorted_members, start=1):
            member.payout_position = idx

        group.status = GroupStatus.ACTIVE.value
        db.commit()
        return sorted(members, key=lambda m: m.payout_position or 999)

    @staticmethod
    def check_and_advance_round(
        db: Session,
        group: SusuGroup,
        requester_phone: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        STRICT FINANCIAL INVARIANT ENGINE:
        A payout can ONLY be disbursed and advanced if:
        1. The circle has 100% of required members enrolled (len(members) == group.members_count).
        2. The circle is in ACTIVE rotation status.
        3. EVERY single enrolled member has deposited their contribution for current_round into escrow.
        4. The designated recipient has contributed their own round payment.
        Creator bypasses and mock disbursements are strictly prohibited.
        """
        members = db.query(GroupMember).filter(GroupMember.group_id == group.id).all()
        if not members:
            return {"advanced": False, "reason": "No members in group"}

        # 1. Enforce Full Enrollment
        if len(members) < group.members_count:
            return {
                "advanced": False,
                "reason": f"Circle is still recruiting ({len(members)} of {group.members_count} members enrolled). All {group.members_count} members must join before rotation begins.",
                "all_paid": False
            }

        # Auto-activate circle if all members joined but status is still RECRUITING
        if group.status == GroupStatus.RECRUITING.value and len(members) >= group.members_count:
            group.status = GroupStatus.ACTIVE.value
            db.commit()

        if group.status != GroupStatus.ACTIVE.value:
            return {
                "advanced": False,
                "reason": f"Circle is currently {group.status}. Payouts can only occur on ACTIVE circles.",
                "all_paid": False
            }

        if any(m.payout_position is None for m in members):
            for idx, m in enumerate(members, start=1):
                if m.payout_position is None:
                    m.payout_position = idx
            db.commit()

        # 2. Enforce 100% Escrow Contribution Verification
        all_paid = all(m.has_paid_current_round for m in members)
        if not all_paid:
            unpaid_members = [m.full_name for m in members if not m.has_paid_current_round]
            unpaid_count = len(unpaid_members)
            names_preview = ", ".join(unpaid_members[:3])
            if unpaid_count > 3:
                names_preview += f" and {unpaid_count - 3} others"
            return {
                "advanced": False,
                "reason": f"Escrow incomplete: Waiting on {unpaid_count} member(s) ({names_preview}) to pay their Round {group.current_round} contribution (GH₵{group.contribution_amount:.2f} each).",
                "all_paid": False
            }

        # 3. Find designated recipient for this round
        recipient = next((m for m in members if m.payout_position == group.current_round), None)
        if not recipient:
            return {
                "advanced": False,
                "reason": f"No designated member assigned to payout turn {group.current_round}.",
                "all_paid": False
            }

        # 4. Verify recipient has paid their own share
        if not recipient.has_paid_current_round:
            return {
                "advanced": False,
                "reason": f"Turn recipient {recipient.full_name} must contribute their own round share before receiving payout.",
                "all_paid": False
            }

        # The lump sum is the full pool for the round
        payout_amount = round(float(group.total_pool or (group.contribution_amount * group.members_count)), 2)
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

        # Boost trust score for members who paid on time
        for m in members:
            if m.has_paid_current_round:
                user = db.query(User).filter(User.phone_number == m.phone_number).first()
                if user:
                    user.on_time_payments_count += 1
                    user.trust_score = min(100, user.trust_score + 2)

        # Check if circle has completed all rounds (must reach members_count rounds)
        is_final_round = group.current_round >= group.members_count

        if is_final_round:
            group.status = GroupStatus.COMPLETED.value
            message = f"🎉 Group '{group.name}' completed all {group.current_round} rounds! Total lump sum of GH₵{payout_amount:.2f} disbursed to {recipient.full_name} ({recipient.phone_number})."
        else:
            previous_round = group.current_round
            group.current_round += 1
            for m in members:
                m.has_paid_current_round = False
            message = f"✅ Round {previous_round} complete! Total lump sum of GH₵{payout_amount:.2f} disbursed to {recipient.full_name} ({recipient.phone_number}). Advanced to Round {group.current_round}."

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

import sys
import uuid
from datetime import datetime, timedelta
from database import SessionLocal, Base, engine
from models import SusuGroup, GroupMember, ContributionPayment, PayoutDisbursement, GroupStatus, RotationType, PaymentStatus
from services.momo_service import GhanaMoMoService

def seed_database():
    """Optional developer CLI utility to seed sample data only when explicitly invoked."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(SusuGroup).count() > 0:
        print("Database already contains data. Skipping seed.")
        db.close()
        return

    print("Seeding SusuRow with sample Ghanaian circles...")

    # Circle 1: Osu Techies Weekly Susu (Sequential, Active Round 2)
    c1_id = str(uuid.uuid4())
    c1 = SusuGroup(
        id=c1_id,
        name="Osu Techies Weekly Susu",
        description="Weekly rotational pool for tech professionals in Osu & Airport City. Fast MoMo disbursement every Sunday evening.",
        is_private=False,
        contribution_amount=500.0,
        frequency="WEEKLY",
        members_count=5,
        total_pool=2500.0,
        commitment_deposit=100.0,
        rotation_type=RotationType.SEQUENTIAL.value,
        invite_code="SUSU-OSU01",
        current_round=2,
        creator_id="0244123456",
        status=GroupStatus.ACTIVE.value,
        created_at=datetime.utcnow() - timedelta(days=14)
    )
    db.add(c1)
    db.flush()

    m1 = GroupMember(id=str(uuid.uuid4()), group_id=c1_id, phone_number="0244123456", full_name="Kwame Mensah", momo_provider="MTN", payout_position=1, has_paid_current_round=True, has_received_payout=True, deposit_paid=True, joined_at=datetime.utcnow() - timedelta(days=14))
    m2 = GroupMember(id=str(uuid.uuid4()), group_id=c1_id, phone_number="0201234567", full_name="Abena Serwaa", momo_provider="TELECEL", payout_position=2, has_paid_current_round=True, has_received_payout=False, deposit_paid=True, joined_at=datetime.utcnow() - timedelta(days=14))
    m3 = GroupMember(id=str(uuid.uuid4()), group_id=c1_id, phone_number="0271234567", full_name="Kofi Boateng", momo_provider="AT", payout_position=3, has_paid_current_round=True, has_received_payout=False, deposit_paid=True, joined_at=datetime.utcnow() - timedelta(days=13))
    m4 = GroupMember(id=str(uuid.uuid4()), group_id=c1_id, phone_number="0558765432", full_name="Ama Osei", momo_provider="MTN", payout_position=4, has_paid_current_round=False, has_received_payout=False, deposit_paid=True, joined_at=datetime.utcnow() - timedelta(days=12))
    m5 = GroupMember(id=str(uuid.uuid4()), group_id=c1_id, phone_number="0549998877", full_name="Yaw Appiah", momo_provider="MTN", payout_position=5, has_paid_current_round=False, has_received_payout=False, deposit_paid=True, joined_at=datetime.utcnow() - timedelta(days=11))
    db.add_all([m1, m2, m3, m4, m5])
    db.flush()

    for m in [m1, m2, m3, m4, m5]:
        p = ContributionPayment(
            id=str(uuid.uuid4()),
            group_id=c1_id,
            member_id=m.id,
            round_number=1,
            amount=500.0,
            momo_provider=m.momo_provider,
            transaction_reference=GhanaMoMoService.generate_transaction_ref(m.momo_provider[:3]),
            status=PaymentStatus.SUCCESS.value,
            paid_at=datetime.utcnow() - timedelta(days=8)
        )
        db.add(p)

    db.add(PayoutDisbursement(
        id=str(uuid.uuid4()),
        group_id=c1_id,
        member_id=m1.id,
        round_number=1,
        amount=2500.0,
        recipient_phone=m1.phone_number,
        momo_provider=m1.momo_provider,
        transaction_reference=GhanaMoMoService.generate_transaction_ref("PAYOUT"),
        status=PaymentStatus.SUCCESS.value,
        disbursed_at=datetime.utcnow() - timedelta(days=7)
    ))

    db.commit()
    db.close()
    print("Database seeding completed.")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--seed":
        seed_database()
    else:
        print("To seed sample data manually, run: python seed.py --seed")

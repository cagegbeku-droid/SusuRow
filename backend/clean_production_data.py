#!/usr/bin/env python3
"""
SusuRow - Production Data Cleaner & Reset Utility
Purges all test groups, mock payment records, payout disbursements, and test savers,
while strictly preserving all Executive Administrator accounts (e.g. 0599360626).
"""
import sys
import os
from sqlalchemy import or_

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
from models import (
    User,
    SusuGroup,
    GroupMember,
    ContributionPayment,
    PayoutDisbursement,
    MoMoWebhookLog,
    ExecutiveWithdrawal
)
from main import auto_migrate_schema

def clean_data():
    Base.metadata.create_all(bind=engine)
    auto_migrate_schema()
    db = SessionLocal()
    print("=" * 60)
    print("SUSUROW - CLEANING DATA FOR PRODUCTION LAUNCH")
    print("=" * 60)

    try:
        # 1. Purge financial transactions & executive withdrawals
        p_count = db.query(ContributionPayment).delete()
        d_count = db.query(PayoutDisbursement).delete()
        w_count = db.query(MoMoWebhookLog).delete()
        ew_count = db.query(ExecutiveWithdrawal).delete()
        print(f"[OK] Removed {p_count} contribution payment records.")
        print(f"[OK] Removed {d_count} payout disbursement records.")
        print(f"[OK] Removed {w_count} webhook log entries.")
        print(f"[OK] Removed {ew_count} executive withdrawal records.")

        # 2. Purge circles and memberships
        m_count = db.query(GroupMember).delete()
        g_count = db.query(SusuGroup).delete()
        print(f"[OK] Removed {m_count} circle memberships.")
        print(f"[OK] Removed {g_count} test savings circles.")

        # 3. Clean test users while preserving Executive Admins
        ADMIN_PHONES = {"0599360626", "233599360626", "+233599360626"}
        
        # Ensure any existing user matching admin phone is flagged as admin
        db.query(User).filter(User.phone_number.in_(ADMIN_PHONES)).update({"is_admin": True, "kyc_status": "VERIFIED"}, synchronize_session=False)
        db.commit()

        admins = db.query(User).filter(User.is_admin == True).all()
        if not admins:
            # Seed the primary Executive Admin account so the executive is always active
            from auth import hash_password
            default_admin = User(
                full_name="Coratech Global Executive",
                phone_number="0599360626",
                username="coratech_admin",
                email="admin@coratechglobal.com",
                is_admin=True,
                kyc_status="VERIFIED",
                hashed_password=hash_password("SusuRowAdmin2026!"),
                momo_provider="MTN"
            )
            db.add(default_admin)
            db.commit()
            admins = [default_admin]

        admin_names = [f"{a.full_name} ({a.phone_number or a.email})" for a in admins]
        print(f"[PRESERVED] {len(admins)} Executive Administrator account(s): {', '.join(admin_names)}")

        admin_ids = [a.id for a in admins]
        u_count = db.query(User).filter(~User.id.in_(admin_ids)).delete(synchronize_session=False)
        print(f"[OK] Removed {u_count} test saver accounts.")

        db.commit()
        print("=" * 60)
        print("[SUCCESS] DATABASE IS NOW 100% CLEAN AND PRODUCTION-READY!")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"[ERROR] during cleanup: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    clean_data()

import pytest
from conftest import TestingSessionLocal
from models import User, SusuGroup, GroupMember, ContributionPayment, PayoutDisbursement, GroupStatus, PaymentStatus, KYCStatus
from auth import create_access_token
import uuid
from datetime import datetime, timedelta

def test_admin_access_control(client):
    db = TestingSessionLocal()
    try:
        # Create normal user
        normal_user = User(
            id="normal_saver_id",
            phone_number="0241112233",
            full_name="Normal Saver",
            is_admin=False,
            is_active=True
        )
        # Create admin user
        admin_user = User(
            id="admin_user_id",
            phone_number="0599360626",
            full_name="Platform Executive",
            is_admin=True,
            is_active=True
        )
        db.add(normal_user)
        db.add(admin_user)
        db.commit()
    finally:
        db.close()

    # 1. Normal Saver Token -> 403 Forbidden
    normal_token = create_access_token(data={"sub": "normal_saver_id", "phone": "0241112233"})
    normal_headers = {"Authorization": f"Bearer {normal_token}"}
    res = client.get("/api/admin/metrics", headers=normal_headers)
    assert res.status_code == 403

    # 2. Admin Phone (0599360626) -> 200 OK
    admin_token = create_access_token(data={"sub": "admin_user_id", "phone": "0599360626"})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/admin/metrics", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "financials" in data
    assert "savers" in data
    assert "circles" in data
    assert data["financials"]["currency"] == "GH₵"

def test_admin_user_moderation(client):
    db = TestingSessionLocal()
    try:
        admin_user = User(
            id="admin_user_id_2",
            phone_number="0599360626",
            full_name="Platform Executive",
            is_admin=True,
            is_active=True
        )
        target_user = User(
            id="target_user_id",
            phone_number="0247778899",
            full_name="Target Saver",
            ghana_card_number="GHA-000000000-1",
            kyc_status="PENDING",
            is_admin=False,
            is_active=True
        )
        db.add(admin_user)
        db.add(target_user)
        db.commit()
    finally:
        db.close()

    admin_token = create_access_token(data={"sub": "admin_user_id_2", "phone": "0599360626"})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Query users
    res = client.get("/api/admin/users?limit=10", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 2
    assert any(u["id"] == "target_user_id" for u in data["users"])

    # Update KYC Status to VERIFIED
    res = client.post(
        "/api/admin/users/target_user_id/kyc-status",
        headers=admin_headers,
        json={"status": "VERIFIED", "note": "Verified Ghana Card"}
    )
    assert res.status_code == 200
    assert res.json()["kyc_status"] == "VERIFIED"

    # Toggle freeze
    res = client.post("/api/admin/users/target_user_id/toggle-freeze", headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["is_active"] is False

    # Toggle unfreeze
    res = client.post("/api/admin/users/target_user_id/toggle-freeze", headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["is_active"] is True

def test_admin_circles_and_transactions(client):
    db = TestingSessionLocal()
    try:
        admin_user = User(
            id="admin_user_id_3",
            phone_number="0599360626",
            full_name="Platform Executive",
            is_admin=True,
            is_active=True
        )
        group = SusuGroup(
            id="test_group_id",
            name="Accra Daily Traders",
            creator_id="admin_user_id_3",
            invite_code="TEST99",
            contribution_amount=50.0,
            members_count=5,
            total_pool=250.0,
            frequency="DAILY",
            rotation_type="SEQUENTIAL",
            status=GroupStatus.ACTIVE.value,
            current_round=1
        )
        member = GroupMember(
            id="member_1_id",
            group_id="test_group_id",
            full_name="Recipient Saver",
            phone_number="0599360626",
            payout_position=1,
            has_paid_current_round=True
        )
        payment = ContributionPayment(
            id="pay_1",
            group_id="test_group_id",
            member_id="member_1_id",
            round_number=1,
            amount=50.0,
            momo_provider="MTN",
            transaction_reference="TX_CONTRIB_001",
            status=PaymentStatus.SUCCESS.value
        )
        db.add(admin_user)
        db.add(group)
        db.add(member)
        db.add(payment)
        db.commit()
    finally:
        db.close()

    admin_token = create_access_token(data={"sub": "admin_user_id_3", "phone": "0599360626"})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Circles list
    res = client.get("/api/admin/circles", headers=admin_headers)
    assert res.status_code == 200
    circles = res.json()
    assert len(circles) >= 1
    assert circles[0]["name"] == "Accra Daily Traders"
    assert circles[0]["health"] == "ON_TRACK"

    # Circle members audit
    res = client.get("/api/admin/circles/test_group_id/members", headers=admin_headers)
    assert res.status_code == 200
    audit_data = res.json()
    assert audit_data["group_id"] == "test_group_id"
    assert len(audit_data["members"]) == 1
    assert audit_data["members"][0]["paid_current_round"] is True

    # Payout override
    res = client.post("/api/admin/circles/test_group_id/payout-override", headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["success"] is True

    # Transactions ledger
    res = client.get("/api/admin/transactions", headers=admin_headers)
    assert res.status_code == 200
    txs = res.json()
    assert len(txs) >= 1

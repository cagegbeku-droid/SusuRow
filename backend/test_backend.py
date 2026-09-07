def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_create_and_fetch_group(client):
    payload = {
        "name": "Accra Digital Savers",
        "description": "Weekly Susu for tech workers",
        "is_private": False,
        "contribution_amount": 200.0,
        "frequency": "WEEKLY",
        "members_count": 3,
        "commitment_deposit": 50.0,
        "rotation_type": "SEQUENTIAL",
        "creator_phone": "0244123456",
        "creator_name": "Kwame Tech",
        "creator_momo_provider": "MTN"
    }
    res = client.post("/api/groups", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Accra Digital Savers"
    assert data["total_pool"] == 600.0
    assert data["enrolled_count"] == 1
    assert data["invite_code"].startswith("SUSU-")
    group_id = data["id"]
    invite_code = data["invite_code"]

    # Lookup by invite code
    res_code = client.get(f"/api/groups/code/{invite_code}")
    assert res_code.status_code == 200
    assert res_code.json()["id"] == group_id

def test_join_circle_and_advance_round(client):
    # 1. Create group of capacity 3
    create_res = client.post("/api/groups", json={
        "name": "Test Rotation Circle",
        "contribution_amount": 100.0,
        "frequency": "DAILY",
        "members_count": 3,
        "commitment_deposit": 20.0,
        "rotation_type": "SEQUENTIAL",
        "creator_phone": "0241000001",
        "creator_name": "Member One",
        "creator_momo_provider": "MTN"
    })
    assert create_res.status_code == 200
    group_data = create_res.json()
    group_id = group_data["id"]
    m1_id = group_data["members"][0]["id"]

    # 2. Member 2 joins
    join2 = client.post("/api/members/join", json={
        "group_id": group_id,
        "phone_number": "0202000002",
        "full_name": "Member Two",
        "momo_provider": "TELECEL"
    })
    assert join2.status_code == 200
    m2_id = [m["id"] for m in join2.json()["members"] if m["phone_number"] == "0202000002"][0]

    # 3. Member 3 joins
    join3 = client.post("/api/members/join", json={
        "group_id": group_id,
        "phone_number": "0273000003",
        "full_name": "Member Three",
        "momo_provider": "AT"
    })
    assert join3.status_code == 200
    assert join3.json()["enrolled_count"] == 3
    assert join3.json()["status"] == "ACTIVE"
    m3_id = [m["id"] for m in join3.json()["members"] if m["phone_number"] == "0273000003"][0]

    # 4. Member 1 & 2 pay Round 1
    p1 = client.post("/api/payments/simulate-instant", json={
        "group_id": group_id,
        "member_id": m1_id
    })
    assert p1.status_code == 200
    assert p1.json()["current_round"] == 1

    p2 = client.post("/api/payments/simulate-instant", json={
        "group_id": group_id,
        "member_id": m2_id
    })
    assert p2.status_code == 200
    assert p2.json()["current_round"] == 1

    # 5. Member 3 pays Round 1 -> Should automatically trigger pot payout to Member 1 and advance to Round 2!
    p3 = client.post("/api/payments/simulate-instant", json={
        "group_id": group_id,
        "member_id": m3_id
    })
    assert p3.status_code == 200
    updated_group = p3.json()
    assert updated_group["current_round"] == 2
    assert len(updated_group["payouts"]) == 1
    assert updated_group["payouts"][0]["amount"] == 300.0 # 3 * 100
    assert updated_group["payouts"][0]["recipient_phone"] == "0241000001"

def test_ballot_shuffle(client):
    create_res = client.post("/api/groups", json={
        "name": "Ballot Circle Test",
        "contribution_amount": 150.0,
        "frequency": "WEEKLY",
        "members_count": 3,
        "commitment_deposit": 0.0,
        "rotation_type": "BALLOT",
        "creator_phone": "0241111111",
        "creator_name": "Alice Ballot",
        "creator_momo_provider": "MTN"
    })
    assert create_res.status_code == 200
    group_id = create_res.json()["id"]

    client.post("/api/members/join", json={"group_id": group_id, "phone_number": "0242222222", "full_name": "Bob Ballot"})
    client.post("/api/members/join", json={"group_id": group_id, "phone_number": "0243333333", "full_name": "Charlie Ballot"})

    # Trigger ballot draw
    ballot_res = client.post("/api/rotation/ballot", json={"group_id": group_id, "seed": "ghana-test-seed-42"})
    assert ballot_res.status_code == 200
    members = ballot_res.json()["members"]
    positions = [m["payout_position"] for m in members]
    assert sorted(positions) == [1, 2, 3]

def test_bidding_scheme_ranking(client):
    create_res = client.post("/api/groups", json={
        "name": "Bidding Circle Test",
        "contribution_amount": 250.0,
        "frequency": "MONTHLY",
        "members_count": 3,
        "commitment_deposit": 0.0,
        "rotation_type": "BIDDING",
        "creator_phone": "0249991111",
        "creator_name": "Leader",
        "creator_momo_provider": "MTN"
    })
    assert create_res.status_code == 200
    group_data = create_res.json()
    group_id = group_data["id"]
    m1_id = group_data["members"][0]["id"]

    join2 = client.post("/api/members/join", json={"group_id": group_id, "phone_number": "0249992222", "full_name": "Saver 2"})
    m2_id = [m["id"] for m in join2.json()["members"] if m["phone_number"] == "0249992222"][0]

    join3 = client.post("/api/members/join", json={"group_id": group_id, "phone_number": "0249993333", "full_name": "Saver 3"})
    m3_id = [m["id"] for m in join3.json()["members"] if m["phone_number"] == "0249993333"][0]

    # Member 2 bids GHS 50, Member 3 bids GHS 20, Member 1 bids GHS 5
    client.post("/api/members/bid", json={"member_id": m2_id, "bid_amount": 50.0})
    client.post("/api/members/bid", json={"member_id": m3_id, "bid_amount": 20.0})
    bid_res = client.post("/api/members/bid", json={"member_id": m1_id, "bid_amount": 5.0})

    members_updated = bid_res.json()["members"]
    m2_pos = next(m["payout_position"] for m in members_updated if m["id"] == m2_id)
    m3_pos = next(m["payout_position"] for m in members_updated if m["id"] == m3_id)
    m1_pos = next(m["payout_position"] for m in members_updated if m["id"] == m1_id)

    assert m2_pos == 1  # Highest bid (50) gets position 1
    assert m3_pos == 2  # Second highest (20) gets position 2
    assert m1_pos == 3  # Lowest (5) gets position 3

def test_delete_group_rules(client):
    # 1. Create a recruiting group
    res = client.post("/api/groups", json={
        "name": "Deletable Recruiting Circle",
        "contribution_amount": 100.0,
        "frequency": "WEEKLY",
        "members_count": 3,
        "creator_phone": "0245550001",
        "creator_name": "Creator Kwame",
        "creator_momo_provider": "MTN"
    })
    group_id = res.json()["id"]

    # 2. Non-creator tries to delete -> 403 Forbidden
    del_forbidden = client.delete(f"/api/groups/{group_id}?phone_number=0209999999")
    assert del_forbidden.status_code == 403

    # 3. Add members and start active payments
    join2 = client.post("/api/members/join", json={"group_id": group_id, "phone_number": "0205550002", "full_name": "Member 2"})
    join3 = client.post("/api/members/join", json={"group_id": group_id, "phone_number": "0275550003", "full_name": "Member 3"})
    m1_id = res.json()["members"][0]["id"]
    client.post("/api/payments/simulate-instant", json={"group_id": group_id, "member_id": m1_id})

    # 4. Creator tries to delete active circle in progress -> 400 Bad Request
    del_active = client.delete(f"/api/groups/{group_id}?phone_number=0245550001")
    assert del_active.status_code == 400
    assert "currently active" in del_active.json()["detail"]

    # 5. Create another empty recruiting group and delete it -> 200 OK
    res_empty = client.post("/api/groups", json={
        "name": "Empty Recruiting Circle",
        "contribution_amount": 50.0,
        "frequency": "DAILY",
        "members_count": 5,
        "creator_phone": "0245550001",
        "creator_name": "Creator Kwame"
    })
    empty_id = res_empty.json()["id"]
    del_ok = client.delete(f"/api/groups/{empty_id}?phone_number=0245550001")
    assert del_ok.status_code == 200
    assert del_ok.json()["success"] == True

def test_create_group_small_amounts_and_manual_members(client):
    # Test entering whole amounts like 1, 2, 3... and custom member counts (e.g. 7)
    res = client.post("/api/groups", json={
        "name": "Micro Savers Group",
        "contribution_amount": 1,
        "frequency": "DAILY",
        "members_count": 7,
        "creator_phone": "0247770001",
        "creator_name": "Micro Saver Leader",
        "creator_momo_provider": "MTN"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["contribution_amount"] == 1.0
    assert data["members_count"] == 7
    assert data["total_pool"] == 7.0

from unittest.mock import patch, AsyncMock

def test_verify_transaction_settlement(client):
    # 1. Create a group
    res = client.post("/api/groups", json={
        "name": "Verification Settlement Circle",
        "contribution_amount": 2.0,
        "frequency": "WEEKLY",
        "members_count": 2,
        "creator_phone": "0248880001",
        "creator_name": "Settlement Leader",
        "creator_momo_provider": "MTN"
    })
    group_id = res.json()["id"]
    member_id = res.json()["members"][0]["id"]

    # 2. Call initiate to log webhook event
    with patch("services.paystack_service.GhanaMoMoGateway.charge_momo", new_callable=AsyncMock) as mock_charge:
        mock_charge.return_value = {
            "success": True,
            "gateway": "PAYSTACK",
            "status": "pending",
            "requires_otp": False,
            "reference": "TEST-REF-123456",
            "ussd_prompt": "Authorize payment on your phone"
        }
        init_res = client.post("/api/payments/initiate", json={
            "group_id": group_id,
            "member_id": member_id,
            "momo_provider": "MTN"
        })
        assert init_res.status_code == 200
        ref = init_res.json()["transaction_reference"]

    # 3. Call verify_transaction with that reference, mocking successful gateway response
    with patch("services.paystack_service.GhanaMoMoGateway.verify_payment", new_callable=AsyncMock) as mock_verify:
        mock_verify.return_value = {
            "success": True,
            "paid": True,
            "data": {
                "reference": ref,
                "amount": 200,
                "status": "success",
                "customer": {"phone": "0248880001"}
            }
        }
        verify_res = client.get(f"/api/payments/verify/{ref}")
        assert verify_res.status_code == 200
        assert verify_res.json()["status"] == "SUCCESS"
        assert verify_res.json()["paid"] == True

    # 4. Check group detail: member should now be marked as has_paid_current_round = True!
    g_res = client.get(f"/api/groups/{group_id}")
    assert g_res.status_code == 200
    member = g_res.json()["members"][0]
    assert member["has_paid_current_round"] == True
    assert len(g_res.json()["payments"]) == 1
    assert g_res.json()["payments"][0]["transaction_reference"] == ref
    assert g_res.json()["status"] == "RECRUITING"

def test_creator_lump_sum_disbursement(client):
    # 1. Create a 2-person circle
    res = client.post("/api/groups", json={
        "name": "Creator Disbursement Circle",
        "contribution_amount": 5.0,
        "frequency": "WEEKLY",
        "members_count": 2,
        "creator_phone": "0249990001",
        "creator_name": "Kofi Leader",
        "creator_momo_provider": "MTN"
    })
    group_id = res.json()["id"]

    # 2. Non-creator tries to disburse before all members joined and paid -> fails
    non_creator_res = client.post(f"/api/rotation/advance/{group_id}?creator_phone=0200000000")
    assert non_creator_res.status_code == 200
    assert non_creator_res.json()["success"] == False

    # 3. Circle creator explicitly disburses the total sum (lump sum pot) to current receiver -> succeeds!
    creator_res = client.post(f"/api/rotation/advance/{group_id}?creator_phone=0249990001")
    assert creator_res.status_code == 200
    assert creator_res.json()["success"] == True
    assert creator_res.json()["payout_disbursed"]["amount"] == 10.0  # Total sum: 2 savers * GH₵5 = GH₵10.00

def test_fee_breakdown_calculation(client):
    """
    Verifies the 3-part fee breakdown:
    Gateway fee: 1.95% (GH₵0.98 for GH₵50)
    Commission fee: 1.0% (GH₵0.50 for GH₵50)
    Transaction fee: 1.2% (GH₵0.60 for GH₵50)
    Total charged: GH₵52.08, while contribution pot receives exactly GH₵50.00.
    """
    res = client.post("/api/groups", json={
        "name": "Fee Calculation Circle",
        "contribution_amount": 50.0,
        "frequency": "WEEKLY",
        "members_count": 3,
        "creator_phone": "0245550001",
        "creator_name": "Fee Tester",
        "creator_momo_provider": "MTN"
    })
    assert res.status_code == 200
    data = res.json()
    group_id = data["id"]
    member_id = data["members"][0]["id"]

    initiate_res = client.post("/api/payments/initiate", json={
        "group_id": group_id,
        "member_id": member_id,
        "momo_provider": "MTN"
    })
    assert initiate_res.status_code == 200
    init_data = initiate_res.json()

    assert init_data["amount"] == 50.0
    assert init_data["base_amount"] == 50.0
    assert init_data["gateway_fee"] == 0.98  # 1.95% of 50.00
    assert init_data["commission_fee"] == 0.50  # 1.0% of 50.00
    assert init_data["transaction_fee"] == 0.60  # 1.2% of 50.00
    assert init_data["total_fee"] == 2.08
    assert init_data["total_charged"] == 52.08

def test_auto_debit_opt_in_and_trigger(client):
    """
    Tests that:
    1. Automated payment requires a 4-digit PIN to authorize automated deductions.
    2. When enabled, trigger-auto-debits executes deduction automatically into the pot.
    3. Once paid, no reminders or further debits trigger for the rest of the round.
    """
    from auth import create_access_token
    from models import User
    from database import get_db

    # 1. Create circle
    res = client.post("/api/groups", json={
        "name": "Auto Debit Circle",
        "contribution_amount": 25.0,
        "frequency": "WEEKLY",
        "members_count": 2,
        "creator_phone": "0247770001",
        "creator_name": "Ama Auto",
        "creator_momo_provider": "MTN"
    })
    assert res.status_code == 200
    group_id = res.json()["id"]

    # 2. Member 2 joins
    join_res = client.post("/api/members/join", json={
        "group_id": group_id,
        "phone_number": "0208880002",
        "full_name": "Kofi Auto",
        "momo_provider": "TELECEL"
    })
    assert join_res.status_code == 200
    assert join_res.json()["status"] == "ACTIVE"

    # 3. Trigger auto-debits before users activate it -> 0 triggered, 2 skipped
    trigger_before = client.post(f"/api/payments/trigger-auto-debits?group_id={group_id}")
    assert trigger_before.status_code == 200
    assert trigger_before.json()["triggered_count"] == 0
    assert trigger_before.json()["skipped_count"] == 2

    # 4. User registers and logs in
    reg_res = client.post("/api/auth/register", json={
        "phone_number": "0208880002",
        "password": "SecurePassword2026!",
        "full_name": "Kofi Auto",
        "momo_provider": "TELECEL"
    })
    assert reg_res.status_code == 200
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 5. Enabling without PIN or invalid PIN fails
    invalid_pin_res = client.post("/api/auth/auto-debit", json={
        "enabled": True,
        "frequency": "WEEKLY",
        "time": "08:00",
        "pin": "12" # Less than 4 digits
    }, headers=headers)
    assert invalid_pin_res.status_code == 400

    # 6. Enabling with valid 4-digit PIN succeeds
    valid_pin_res = client.post("/api/auth/auto-debit", json={
        "enabled": True,
        "frequency": "WEEKLY",
        "time": "08:00",
        "pin": "1234"
    }, headers=headers)
    assert valid_pin_res.status_code == 200
    assert valid_pin_res.json()["auto_debit_enabled"] == True
    assert valid_pin_res.json()["has_security_pin"] == True

    # 7. Trigger auto-debit: system automatically deducts with authorized PIN without requiring phone prompt
    trigger_after = client.post(f"/api/payments/trigger-auto-debits?group_id={group_id}")
    assert trigger_after.status_code == 200
    assert trigger_after.json()["triggered_count"] == 1
    assert trigger_after.json()["triggered_members"][0]["status"] == "DEDUCTED_AUTOMATICALLY"
    assert trigger_after.json()["triggered_members"][0]["phone_number"] == "0208880002"

    # 8. Check member state: has_paid_current_round is now True
    group_detail = client.get(f"/api/groups/{group_id}")
    kofi_member = next(m for m in group_detail.json()["members"] if m["phone_number"] == "0208880002")
    assert kofi_member["has_paid_current_round"] == True

    # 9. Trigger auto-debits again in same round: Kofi is NOT charged again!
    trigger_again = client.post(f"/api/payments/trigger-auto-debits?group_id={group_id}")
    assert trigger_again.status_code == 200
    # Kofi is excluded because he already paid!
    kofi_in_triggered = any(m["phone_number"] == "0208880002" for m in trigger_again.json()["triggered_members"])
    assert kofi_in_triggered == False

    # 10. Check due reminders: Kofi is excluded from reminders since he already paid
    remind_res = client.post(f"/api/reminders/send-due-reminders?group_id={group_id}")
    assert remind_res.status_code == 200
    kofi_reminded = any(m["phone_number"] == "0208880002" for m in remind_res.json()["reminded_members"])
    assert kofi_reminded == False






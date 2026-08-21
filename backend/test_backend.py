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

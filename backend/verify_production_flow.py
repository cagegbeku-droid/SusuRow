import httpx
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

def log_step(title):
    print(f"\n{'='*20} {title} {'='*20}")

def run_production_verification():
    with httpx.Client(timeout=10.0) as client:
        log_step("STEP 1: Verify Initial Clean State")
        stats_res = client.get(f"{BASE_URL}/stats")
        assert stats_res.status_code == 200, f"Failed stats: {stats_res.text}"
        stats = stats_res.json()
        print(f"Platform Stats: {json.dumps(stats, indent=2)}")

        groups_res = client.get(f"{BASE_URL}/groups")
        assert groups_res.status_code == 200
        groups = groups_res.json()
        print(f"Marketplace Groups Count: {len(groups)}")

        log_step("STEP 2: Saver 1 (Kwame Mensah) Phone OTP Sign-In")
        # 1. Send OTP
        otp1_res = client.post(f"{BASE_URL}/auth/send-otp", json={
            "phone_number": "0244123456",
            "full_name": "Kwame Mensah",
            "momo_provider": "MTN"
        })
        assert otp1_res.status_code == 200, f"Failed send OTP: {otp1_res.text}"
        otp1_data = otp1_res.json()
        dev_code1 = otp1_data.get("dev_otp") or "123456"
        print(f"OTP Sent to 0244123456. Code: {dev_code1}")

        # 2. Verify OTP & Obtain JWT
        auth1_res = client.post(f"{BASE_URL}/auth/verify-otp", json={
            "phone_number": "0244123456",
            "otp_code": dev_code1,
            "full_name": "Kwame Mensah",
            "momo_provider": "MTN"
        })
        assert auth1_res.status_code == 200, f"Failed verify OTP: {auth1_res.text}"
        auth1 = auth1_res.json()
        token1 = auth1["access_token"]
        user1 = auth1["user"]
        print(f"Saver 1 Authenticated! User ID: {user1['id']}, JWT: {token1[:20]}...")

        # 3. Check /me
        me_res = client.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {token1}"})
        assert me_res.status_code == 200
        print(f"Saver 1 Profile verified: {me_res.json()['full_name']} ({me_res.json()['phone_number']})")

        log_step("STEP 3: Saver 1 Creates 'Accra Tech Innovators Susu' Circle")
        create_res = client.post(f"{BASE_URL}/groups", json={
            "name": "Accra Tech Innovators Susu",
            "description": "Weekly Susu rotation for Accra tech engineers & product designers. Payouts via MoMo.",
            "is_private": False,
            "contribution_amount": 300.0,
            "frequency": "WEEKLY",
            "members_count": 3,
            "commitment_deposit": 50.0,
            "rotation_type": "SEQUENTIAL",
            "creator_phone": user1["phone_number"],
            "creator_name": user1["full_name"],
            "creator_momo_provider": user1["momo_provider"]
        }, headers={"Authorization": f"Bearer {token1}"})
        assert create_res.status_code == 200, f"Failed create group: {create_res.text}"
        group = create_res.json()
        group_id = group["id"]
        invite_code = group["invite_code"]
        member1_id = group["members"][0]["id"]
        print(f"Created Circle '{group['name']}' (ID: {group_id})")
        print(f"Invite Code: {invite_code}, Total Expected Pot: GHS {group['total_pool']}")

        log_step("STEP 4: Saver 2 (Abena Serwaa) Signs In & Joins Circle")
        otp2_res = client.post(f"{BASE_URL}/auth/send-otp", json={"phone_number": "0201234567", "full_name": "Abena Serwaa", "momo_provider": "TELECEL"})
        dev_code2 = otp2_res.json().get("dev_otp") or "123456"
        auth2_res = client.post(f"{BASE_URL}/auth/verify-otp", json={"phone_number": "0201234567", "otp_code": dev_code2, "full_name": "Abena Serwaa", "momo_provider": "TELECEL"})
        user2 = auth2_res.json()["user"]

        join2_res = client.post(f"{BASE_URL}/members/join", json={
            "group_id": group_id,
            "phone_number": user2["phone_number"],
            "full_name": user2["full_name"],
            "momo_provider": user2["momo_provider"]
        })
        assert join2_res.status_code == 200
        member2_id = [m["id"] for m in join2_res.json()["members"] if m["phone_number"] == user2["phone_number"]][0]
        print(f"Saver 2 joined circle. Enrolled: {join2_res.json()['enrolled_count']}/3")

        log_step("STEP 5: Saver 3 (Kofi Boateng) Signs In & Joins via Secret Code")
        otp3_res = client.post(f"{BASE_URL}/auth/send-otp", json={"phone_number": "0271234567", "full_name": "Kofi Boateng", "momo_provider": "AT"})
        dev_code3 = otp3_res.json().get("dev_otp") or "123456"
        auth3_res = client.post(f"{BASE_URL}/auth/verify-otp", json={"phone_number": "0271234567", "otp_code": dev_code3, "full_name": "Kofi Boateng", "momo_provider": "AT"})
        user3 = auth3_res.json()["user"]

        join3_res = client.post(f"{BASE_URL}/members/join", json={
            "invite_code": invite_code,
            "phone_number": user3["phone_number"],
            "full_name": user3["full_name"],
            "momo_provider": user3["momo_provider"]
        })
        assert join3_res.status_code == 200
        group_active = join3_res.json()
        member3_id = [m["id"] for m in group_active["members"] if m["phone_number"] == user3["phone_number"]][0]
        print(f"Saver 3 joined circle! Group status is now: {group_active['status']}")
        assert group_active["status"] == "ACTIVE"

        log_step("STEP 6: Multi-party MoMo Contributions for Round 1")
        print("Initiating Saver 1 MTN MoMo Payment (GHS 300)...")
        p1 = client.post(f"{BASE_URL}/payments/simulate-instant", json={"group_id": group_id, "member_id": member1_id})
        assert p1.status_code == 200
        print("Saver 1 paid.")

        print("Initiating Saver 2 Telecel Cash Payment (GHS 300)...")
        p2 = client.post(f"{BASE_URL}/payments/simulate-instant", json={"group_id": group_id, "member_id": member2_id})
        assert p2.status_code == 200
        print("Saver 2 paid.")

        print("Initiating Saver 3 AT Money Payment (GHS 300)...")
        p3 = client.post(f"{BASE_URL}/payments/simulate-instant", json={"group_id": group_id, "member_id": member3_id})
        assert p3.status_code == 200
        updated_circle = p3.json()
        print("Saver 3 paid.")

        log_step("STEP 7: Automatic Round 1 Pot Payout & State Machine Advance")
        print(f"Current Circle Round: {updated_circle['current_round']}")
        assert updated_circle["current_round"] == 2, f"Expected round 2, got {updated_circle['current_round']}"
        assert len(updated_circle["payouts"]) == 1, f"Expected 1 payout, got {len(updated_circle['payouts'])}"

        payout = updated_circle["payouts"][0]
        print(f"Lump-Sum Disbursed: GHS {payout['amount']} to {payout['recipient_phone']} ({payout['momo_provider']})")
        print(f"Disbursement Reference: {payout['transaction_reference']}")
        assert payout["amount"] == 900.0, f"Expected GHS 900 pot, got {payout['amount']}"
        assert payout["recipient_phone"] == user1["phone_number"]

        log_step("STEP 8: Verify Live Platform Metrics")
        final_stats_res = client.get(f"{BASE_URL}/stats")
        final_stats = final_stats_res.json()
        print(f"Updated Platform Stats: {json.dumps(final_stats, indent=2)}")
        assert final_stats["total_pooled_ghs"] >= 900.0
        assert final_stats["total_payouts_disbursed_ghs"] >= 900.0
        assert final_stats["active_circles_count"] >= 1
        assert final_stats["total_savers_count"] >= 3

        print("\nSUCCESS: All production verification tests passed cleanly with 100% fidelity!")

if __name__ == "__main__":
    run_production_verification()

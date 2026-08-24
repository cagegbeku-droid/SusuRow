import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_full_profile_kyc_flow(client):
    # 1. Sign in with Google
    google_payload = {
        "email": "kwame.mensah@gmail.com",
        "name": "Kwame Mensah",
        "picture": "https://example.com/kwame.jpg",
        "phone_number": "0245556677"
    }
    res = client.post("/api/auth/google", json=google_payload)
    assert res.status_code == 200
    auth_data = res.json()
    token = auth_data["access_token"]
    user = auth_data["user"]
    assert user["full_name"] == "Kwame Mensah"
    assert user["points"] >= 50
    assert user["tier"] == "BRONZE"

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Profile
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    profile = me_res.json()
    assert profile["phone_number"] == "0245556677"

    # 3. Update Personal Information
    update_res = client.put(
        "/api/auth/profile",
        json={
            "full_name": "Kwame Mensah Esq",
            "username": "kwamemensah",
            "date_of_birth": "1994-06-15",
            "employment_status": "Self-Employed / Trader",
            "savings_goal": "Business Capital"
        },
        headers=headers
    )
    assert update_res.status_code == 200
    updated_profile = update_res.json()
    assert updated_profile["full_name"] == "Kwame Mensah Esq"
    assert updated_profile["username"] == "kwamemensah"

    # 4. Submit Ghana Card KYC & Next of Kin + Digital Signature
    kyc_res = client.post(
        "/api/auth/kyc",
        json={
            "ghana_card_number": "GHA-712345678-9",
            "next_of_kin_name": "Ama Mensah",
            "next_of_kin_phone": "0249998877",
            "next_of_kin_relation": "Spouse",
            "employment_status": "Self-Employed / Trader",
            "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        },
        headers=headers
    )
    assert kyc_res.status_code == 200
    kyc_profile = kyc_res.json()
    assert kyc_profile["kyc_status"] == "VERIFIED"
    assert kyc_profile["ghana_card_number"] == "GHA-712345678-9"
    assert kyc_profile["has_signature"] == True
    assert kyc_profile["tier"] == "SILVER" # Upgraded to Silver upon KYC verification
    assert kyc_profile["points"] > 50

    # 5. Set 4-Digit Security PIN
    pin_res = client.post(
        "/api/auth/pin",
        json={"pin": "1234"},
        headers=headers
    )
    assert pin_res.status_code == 200
    pin_profile = pin_res.json()
    assert pin_profile["has_security_pin"] == True

    # 6. Configure Multi-Rail Wallets
    wallet_res = client.post(
        "/api/auth/wallet",
        json={
            "primary_wallet_provider": "TELECEL",
            "primary_wallet_number": "0501234567",
            "bank_name": "GCB Bank",
            "bank_account_number": "1011234567890",
            "bank_branch": "High Street Accra"
        },
        headers=headers
    )
    assert wallet_res.status_code == 200
    wallet_profile = wallet_res.json()
    assert wallet_profile["primary_wallet_provider"] == "TELECEL"
    assert wallet_profile["primary_wallet_number"] == "0501234567"
    assert wallet_profile["bank_name"] == "GCB Bank"

    # 7. Configure Scheduled Auto-Debit Top-up
    debit_res = client.post(
        "/api/auth/auto-debit",
        json={
            "enabled": True,
            "frequency": "MONTHLY",
            "time": "09:30"
        },
        headers=headers
    )
    assert debit_res.status_code == 200
    debit_profile = debit_res.json()
    assert debit_profile["auto_debit_enabled"] == True
    assert debit_profile["auto_debit_frequency"] == "MONTHLY"
    assert debit_profile["auto_debit_time"] == "09:30"

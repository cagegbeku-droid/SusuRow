from conftest import TestingSessionLocal
from models import OTPVerification

def test_password_register_and_login(client):
    phone = "0245001122"
    password = "MySecurePassword2026!"
    
    # 1. Register with phone and password
    reg_res = client.post("/api/auth/register", json={
        "phone_number": phone,
        "password": password,
        "full_name": "Kofi Mensah",
        "momo_provider": "MTN"
    })
    assert reg_res.status_code == 200
    data = reg_res.json()
    assert "access_token" in data
    assert data["user"]["phone_number"] == phone
    assert data["user"]["full_name"] == "Kofi Mensah"

    # 2. Duplicate registration fails
    dup_res = client.post("/api/auth/register", json={
        "phone_number": phone,
        "password": password,
        "full_name": "Kofi Mensah",
        "momo_provider": "MTN"
    })
    assert dup_res.status_code == 400

    # 3. Login with wrong password fails
    bad_login = client.post("/api/auth/login", json={
        "phone_number": phone,
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401

    # 4. Login with correct password succeeds
    login_res = client.post("/api/auth/login", json={
        "phone_number": phone,
        "password": password
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data
    assert login_data["user"]["phone_number"] == phone

def test_send_and_verify_otp(client):
    phone = "0244123456"
    send_res = client.post("/api/auth/send-otp", json={
        "phone_number": phone,
        "full_name": "Kwame Mensah",
        "momo_provider": "MTN"
    })
    assert send_res.status_code == 200
    data = send_res.json()
    assert data["success"] == True
    assert data["phone_number"] == phone

    # Retrieve OTP directly from test DB session
    db = TestingSessionLocal()
    otp_entry = db.query(OTPVerification).filter(
        OTPVerification.phone_number == phone,
        OTPVerification.is_used == False
    ).order_by(OTPVerification.created_at.desc()).first()
    assert otp_entry is not None
    otp_code = otp_entry.otp_code
    db.close()

    # Verify OTP
    verify_res = client.post("/api/auth/verify-otp", json={
        "phone_number": phone,
        "otp_code": otp_code,
        "full_name": "Kwame Mensah",
        "momo_provider": "MTN"
    })
    assert verify_res.status_code == 200
    auth_data = verify_res.json()
    assert "access_token" in auth_data
    assert auth_data["user"]["phone_number"] == phone
    assert auth_data["user"]["full_name"] == "Kwame Mensah"
    token = auth_data["access_token"]

    # Authenticated /me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["phone_number"] == phone

    # Update profile
    update_res = client.put(
        "/api/auth/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"full_name": "Kwame Mensah Snr"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["full_name"] == "Kwame Mensah Snr"

def test_invalid_otp(client):
    phone = "0201234567"
    client.post("/api/auth/send-otp", json={"phone_number": phone})
    
    bad_res = client.post("/api/auth/verify-otp", json={
        "phone_number": phone,
        "otp_code": "000000"
    })
    assert bad_res.status_code == 400

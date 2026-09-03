import uuid
import re
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, OTPVerification, KYCStatus, UserTier, GroupMember, SusuGroup, GroupStatus, ContributionPayment, PayoutDisbursement
from schemas import (
    RegisterRequest,
    LoginRequest,
    GoogleAuthRequest,
    SendOTPRequest,
    VerifyOTPRequest,
    AuthResponse,
    UserProfile,
    UpdateProfileRequest,
    KYCSubmitRequest,
    SecurityPINRequest,
    WalletConfigRequest,
    AutoDebitRequest,
    detect_momo_provider,
    sanitize_ghana_phone
)
from services.sms_service import GhanaSMSService
from services.paystack_service import GhanaMoMoGateway
from auth import create_access_token, get_current_user, hash_password, verify_password
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["Authentication & Profile Hierarchy"])


def _build_user_profile(user: User) -> UserProfile:
    return UserProfile(
        id=user.id,
        phone_number=user.phone_number,
        full_name=user.full_name or "Saver",
        username=user.username,
        email=user.email,
        avatar_url=user.avatar_url,
        momo_provider=user.momo_provider or "MTN",
        tier=user.tier or "BRONZE",
        points=user.points if user.points is not None else 50,
        trust_score=user.trust_score if user.trust_score is not None else 100,
        on_time_payments_count=user.on_time_payments_count or 0,
        is_verified=bool(user.is_verified),
        nationality=user.nationality or "Ghanaian",
        date_of_birth=user.date_of_birth,
        kyc_status=user.kyc_status or "UNVERIFIED",
        ghana_card_number=user.ghana_card_number,
        next_of_kin_name=user.next_of_kin_name,
        next_of_kin_phone=user.next_of_kin_phone,
        next_of_kin_relation=user.next_of_kin_relation,
        employment_status=user.employment_status,
        savings_goal=user.savings_goal,
        has_security_pin=bool(user.security_pin_hash),
        has_signature=bool(user.signature_data),
        primary_wallet_provider=user.primary_wallet_provider or user.momo_provider or "MTN",
        primary_wallet_number=user.primary_wallet_number or user.phone_number,
        bank_name=user.bank_name,
        bank_account_number=user.bank_account_number,
        bank_branch=user.bank_branch,
        auto_debit_enabled=bool(user.auto_debit_enabled),
        auto_debit_frequency=user.auto_debit_frequency or "WEEKLY",
        auto_debit_time=user.auto_debit_time or "08:00",
        created_at=user.created_at or datetime.utcnow()
    )


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Registers a new saver account with Phone Number and Password."""
    clean_phone = sanitize_ghana_phone(payload.phone_number)
    
    existing = db.query(User).filter(User.phone_number == clean_phone).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this phone number already exists. Please sign in."
        )
    
    provider = payload.momo_provider or detect_momo_provider(clean_phone)
    pwd_hash = hash_password(payload.password)
    
    user = User(
        id=str(uuid.uuid4()),
        phone_number=clean_phone,
        full_name=payload.full_name.strip(),
        username=payload.username.strip() if payload.username else f"saver_{clean_phone[-4:]}",
        email=payload.email.strip() if payload.email else None,
        momo_provider=provider,
        primary_wallet_provider=provider,
        primary_wallet_number=clean_phone,
        hashed_password=pwd_hash,
        tier=UserTier.BRONZE.value,
        points=50,
        trust_score=100,
        is_verified=False,
        kyc_status=KYCStatus.UNVERIFIED.value,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": user.id, "phone": user.phone_number})
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=_build_user_profile(user)
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Logs in an existing saver using Phone Number and Password."""
    clean_phone = sanitize_ghana_phone(payload.phone_number)
    user = db.query(User).filter(User.phone_number == clean_phone).first()
    
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password."
        )
    
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password."
        )

    if not user.is_active:
        user.is_active = True
        db.commit()

    token = create_access_token(data={"sub": user.id, "phone": user.phone_number})
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=_build_user_profile(user)
    )


@router.post("/google", response_model=AuthResponse)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Sign Up / Log In with Google.
    Creates or retrieves user by email or phone.
    """
    user = None
    if payload.email:
        user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    
    if not user and payload.phone_number:
        clean_phone = sanitize_ghana_phone(payload.phone_number)
        user = db.query(User).filter(User.phone_number == clean_phone).first()

    if not user:
        # Create new user via Google
        clean_phone = sanitize_ghana_phone(payload.phone_number) if payload.phone_number else None

        # Unique sanitized username from real Google email
        base_username = payload.email.split("@")[0] if payload.email else "saver"
        base_username = re.sub(r'[^a-zA-Z0-9_]', '', base_username).lower() or "saver"
        candidate_username = base_username
        if db.query(User).filter(User.username == candidate_username).first():
            candidate_username = f"{candidate_username}_{random_digits(3)}"

        user = User(
            id=str(uuid.uuid4()),
            phone_number=clean_phone,
            full_name=payload.name.strip(),
            username=candidate_username,
            email=payload.email.strip().lower() if payload.email else None,
            avatar_url=payload.picture,
            momo_provider="MTN",
            primary_wallet_provider="MTN",
            primary_wallet_number=clean_phone,
            tier=UserTier.BRONZE.value,
            points=60, # 60 points for Google verified signup
            trust_score=100,
            is_verified=True,
            kyc_status=KYCStatus.UNVERIFIED.value,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update user's avatar or email or full name if provided by Google
        if payload.picture:
            user.avatar_url = payload.picture
        if payload.name and (not user.full_name or user.full_name == "Google Saver"):
            user.full_name = payload.name.strip()
        if payload.email and not user.email:
            user.email = payload.email.strip().lower()
        db.commit()
        db.refresh(user)

    token = create_access_token(data={"sub": user.id, "phone": user.phone_number})
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=_build_user_profile(user)
    )


def random_digits(n: int = 7) -> str:
    import random
    return "".join(str(random.randint(0, 9)) for _ in range(n))


@router.post("/send-otp")
async def send_otp(payload: SendOTPRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Generates and sends single-segment fast OTP SMS via Arkesel Ghana."""
    clean_phone = sanitize_ghana_phone(payload.phone_number)
    otp_code = GhanaSMSService.generate_otp(6)
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    db.query(OTPVerification).filter(
        OTPVerification.phone_number == clean_phone,
        OTPVerification.is_used == False
    ).delete()

    otp_record = OTPVerification(
        phone_number=clean_phone,
        otp_code=otp_code,
        expires_at=expires_at,
        is_used=False
    )
    db.add(otp_record)
    db.commit()

    background_tasks.add_task(GhanaSMSService.send_otp_sms, clean_phone, otp_code)

    return {
        "success": True,
        "message": f"6-digit verification code sent to {clean_phone}.",
        "phone_number": clean_phone,
        "expires_in_seconds": 600
    }


@router.post("/verify-otp", response_model=AuthResponse)
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verifies OTP code and signs in/registers user."""
    clean_phone = sanitize_ghana_phone(payload.phone_number)

    otp_record = db.query(OTPVerification).filter(
        OTPVerification.phone_number == clean_phone,
        OTPVerification.otp_code == payload.otp_code.strip(),
        OTPVerification.is_used == False,
        OTPVerification.expires_at > datetime.utcnow()
    ).first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please request a new one."
        )

    otp_record.is_used = True
    db.commit()

    user = db.query(User).filter(User.phone_number == clean_phone).first()
    if not user:
        provider = payload.momo_provider or detect_momo_provider(clean_phone)
        name = payload.full_name.strip() if payload.full_name else f"Saver {clean_phone[-4:]}"
        user = User(
            id=str(uuid.uuid4()),
            phone_number=clean_phone,
            full_name=name,
            username=f"saver_{clean_phone[-4:]}",
            momo_provider=provider,
            primary_wallet_provider=provider,
            primary_wallet_number=clean_phone,
            hashed_password=hash_password(payload.password) if payload.password else None,
            tier=UserTier.BRONZE.value,
            points=50,
            trust_score=100,
            is_verified=True,
            kyc_status=KYCStatus.UNVERIFIED.value,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.is_verified = True
        if payload.password and not user.hashed_password:
            user.hashed_password = hash_password(payload.password)
        db.commit()
        db.refresh(user)

    token = create_access_token(data={"sub": user.id, "phone": user.phone_number})
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=_build_user_profile(user)
    )


@router.get("/me", response_model=UserProfile)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieves full profile for the authenticated saver."""
    return _build_user_profile(current_user)


@router.put("/profile", response_model=UserProfile)
def update_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates personal information (Legal Name, Username, Email, DOB, Nationality, Goals)."""
    if payload.full_name and payload.full_name.strip():
        current_user.full_name = payload.full_name.strip()
    if payload.phone_number and payload.phone_number.strip():
        clean_phone = sanitize_ghana_phone(payload.phone_number)
        existing = db.query(User).filter(User.phone_number == clean_phone, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="This phone number is already registered to another account.")
        current_user.phone_number = clean_phone
        current_user.primary_wallet_number = clean_phone
        current_user.momo_provider = payload.momo_provider or detect_momo_provider(clean_phone)
        current_user.primary_wallet_provider = current_user.momo_provider
    elif payload.momo_provider:
        current_user.momo_provider = payload.momo_provider
        current_user.primary_wallet_provider = payload.momo_provider
    if payload.username and payload.username.strip():
        uname = payload.username.strip().lower().replace("@", "")
        existing = db.query(User).filter(User.username == uname, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="This username is already taken.")
        current_user.username = uname
    if payload.email:
        current_user.email = payload.email.strip().lower()
    if payload.date_of_birth:
        current_user.date_of_birth = payload.date_of_birth
    if payload.nationality:
        current_user.nationality = payload.nationality
    if payload.avatar_url:
        current_user.avatar_url = payload.avatar_url
    if payload.employment_status:
        current_user.employment_status = payload.employment_status
    if payload.savings_goal:
        current_user.savings_goal = payload.savings_goal

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return _build_user_profile(current_user)


@router.post("/kyc", response_model=UserProfile)
def submit_kyc(
    payload: KYCSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits Ghana Card ID, Next of Kin emergency contact info, and Digital Signature.
    Upgrades saver tier and awards verification reward points.
    """
    current_user.ghana_card_number = payload.ghana_card_number.strip().upper()
    current_user.next_of_kin_name = payload.next_of_kin_name.strip()
    current_user.next_of_kin_phone = payload.next_of_kin_phone.strip()
    current_user.next_of_kin_relation = payload.next_of_kin_relation.strip()
    
    if payload.employment_status:
        current_user.employment_status = payload.employment_status
    if payload.savings_goal:
        current_user.savings_goal = payload.savings_goal
    if payload.signature_data:
        current_user.signature_data = payload.signature_data

    current_user.kyc_status = KYCStatus.VERIFIED.value
    current_user.is_verified = True
    
    if current_user.tier == UserTier.BRONZE.value:
        current_user.tier = UserTier.SILVER.value
        current_user.points += 100

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return _build_user_profile(current_user)


@router.post("/pin", response_model=UserProfile)
def set_security_pin(
    payload: SecurityPINRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sets or updates 4-digit Security PIN for pot payouts & wallet authorization."""
    current_user.security_pin_hash = hash_password(payload.pin)
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return _build_user_profile(current_user)


@router.post("/wallet", response_model=UserProfile)
def configure_wallets(
    payload: WalletConfigRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Configures multi-rail Mobile Money and Bank payout channels."""
    current_user.primary_wallet_provider = payload.primary_wallet_provider
    current_user.primary_wallet_number = payload.primary_wallet_number
    if payload.bank_name:
        current_user.bank_name = payload.bank_name
    if payload.bank_account_number:
        current_user.bank_account_number = payload.bank_account_number
    if payload.bank_branch:
        current_user.bank_branch = payload.bank_branch

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return _build_user_profile(current_user)


@router.post("/auto-debit", response_model=UserProfile)
def configure_auto_debit(
    payload: AutoDebitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Configures scheduled recurring auto-debit top-up."""
    current_user.auto_debit_enabled = payload.enabled
    current_user.auto_debit_frequency = payload.frequency
    current_user.auto_debit_time = payload.time
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return _build_user_profile(current_user)


@router.post("/deactivate")
def deactivate_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Temporarily pauses saver account."""
    current_user.is_active = False
    current_user.updated_at = datetime.utcnow()
    db.commit()
    return {"success": True, "message": "Account deactivated successfully."}


@router.delete("/account")
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permanently deletes account after validating no running rounds with active funds."""
    user_members = db.query(GroupMember).filter(GroupMember.phone_number == current_user.phone_number).all()
    for m in user_members:
        group = db.query(SusuGroup).filter(SusuGroup.id == m.group_id).first()
        if group and group.status == GroupStatus.ACTIVE.value:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete account while enrolled in active group '{group.name}' with rounds in progress."
            )

    db.delete(current_user)
    db.commit()
    return {"success": True, "message": "Account deleted permanently."}


@router.get("/transactions")
def get_user_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all historical contributions and pot payouts for the authenticated saver."""
    members = db.query(GroupMember).filter(GroupMember.phone_number == current_user.phone_number).all()
    if not members:
        return []

    member_ids = [m.id for m in members]
    group_map = {}
    for m in members:
        g = db.query(SusuGroup).filter(SusuGroup.id == m.group_id).first()
        group_map[m.group_id] = g.name if g else "Susu Group"

    payments = db.query(ContributionPayment).filter(ContributionPayment.member_id.in_(member_ids)).all()
    payouts = db.query(PayoutDisbursement).filter(PayoutDisbursement.member_id.in_(member_ids)).all()

    history = []
    for p in payments:
        history.append({
            "id": p.id,
            "type": "CONTRIBUTION",
            "group_id": p.group_id,
            "group_name": group_map.get(p.group_id, "Susu Circle"),
            "amount": p.amount,
            "momo_provider": p.momo_provider,
            "round_number": p.round_number,
            "reference": p.transaction_reference,
            "status": p.status,
            "created_at": p.paid_at.isoformat() if p.paid_at else None
        })

    for po in payouts:
        history.append({
            "id": po.id,
            "type": "PAYOUT",
            "group_id": po.group_id,
            "group_name": group_map.get(po.group_id, "Susu Circle"),
            "amount": po.amount,
            "momo_provider": current_user.primary_wallet_provider or "MTN",
            "round_number": po.round_number,
            "reference": po.transaction_reference,
            "status": po.status,
            "created_at": po.disbursed_at.isoformat() if po.disbursed_at else None
        })

    history.sort(key=lambda x: x["created_at"] or "", reverse=True)
    return history


class ResolveMoMoRequest(BaseModel):
    phone_number: str
    provider: str = "MTN"


@router.post("/resolve-momo")
async def resolve_momo_account(payload: ResolveMoMoRequest):
    """
    Verifies that a phone number is an active Mobile Money account with the telecom provider (MTN, Telecel, AT)
    and resolves the official registered account holder name.
    """
    clean_phone = sanitize_ghana_phone(payload.phone_number)
    provider = payload.provider or detect_momo_provider(clean_phone)
    result = await GhanaMoMoGateway.resolve_momo_account(clean_phone, provider)
    return result

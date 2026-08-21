import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, OTPVerification
from schemas import (
    RegisterRequest,
    LoginRequest,
    SendOTPRequest,
    VerifyOTPRequest,
    AuthResponse,
    UserProfile,
    UpdateProfileRequest,
    detect_momo_provider,
    sanitize_ghana_phone
)
from services.sms_service import GhanaSMSService
from auth import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["Authentication & Savers"])

@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Registers a new saver account with Full Name, Phone Number, MoMo Provider, and Password."""
    clean_phone = sanitize_ghana_phone(payload.phone_number)
    
    existing = db.query(User).filter(User.phone_number == clean_phone).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this phone number already exists. Please log in."
        )
    
    provider = payload.momo_provider or detect_momo_provider(clean_phone)
    pwd_hash = hash_password(payload.password)
    
    user = User(
        id=str(uuid.uuid4()),
        phone_number=clean_phone,
        full_name=payload.full_name.strip(),
        momo_provider=provider,
        hashed_password=pwd_hash,
        is_verified=True,
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
        user=UserProfile.model_validate(user)
    )

@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Logs in an existing saver with Phone Number and Password."""
    clean_phone = sanitize_ghana_phone(payload.phone_number)
    user = db.query(User).filter(User.phone_number == clean_phone).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this phone number. Please register first."
        )
    
    if not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please verify and try again, or use SMS code."
        )

    token = create_access_token(data={"sub": user.id, "phone": user.phone_number})
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfile.model_validate(user)
    )

@router.post("/send-otp")
async def send_otp(
    payload: SendOTPRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Generates and instantly dispatches a 6-digit OTP to a Ghanaian mobile number via background task."""
    clean_phone = payload.phone_number.replace("+233", "0").replace(" ", "").strip()
    otp_code = GhanaSMSService.generate_otp(6)
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Invalidate previous unused OTPs for this number
    db.query(OTPVerification).filter(
        OTPVerification.phone_number == clean_phone,
        OTPVerification.is_used == False
    ).update({"is_used": True})

    otp_entry = OTPVerification(
        id=str(uuid.uuid4()),
        phone_number=clean_phone,
        otp_code=otp_code,
        expires_at=expires_at,
        is_used=False,
        created_at=datetime.utcnow()
    )
    db.add(otp_entry)
    db.commit()

    # Dispatch SMS concurrently in background task for sub-second UI response
    background_tasks.add_task(GhanaSMSService.send_otp_sms, clean_phone, otp_code)

    detected_provider = payload.momo_provider or detect_momo_provider(clean_phone)

    return {
        "status": "OTP_SENT",
        "message": f"Verification code sent to {clean_phone}",
        "phone_number": clean_phone,
        "momo_provider": detected_provider,
        "expires_in_seconds": 600
    }

@router.post("/verify-otp", response_model=AuthResponse)
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Validates the OTP code, registers or signs in the saver, and issues a JWT token."""
    clean_phone = payload.phone_number.replace("+233", "0").replace(" ", "").strip()

    otp_entry = db.query(OTPVerification).filter(
        OTPVerification.phone_number == clean_phone,
        OTPVerification.otp_code == payload.otp_code.strip(),
        OTPVerification.is_used == False,
        OTPVerification.expires_at > datetime.utcnow()
    ).first()

    if not otp_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please request a new OTP."
        )

    # Mark OTP as used
    otp_entry.is_used = True

    # Find or create user
    user = db.query(User).filter(User.phone_number == clean_phone).first()
    provider = payload.momo_provider or detect_momo_provider(clean_phone)

    if not user:
        name = payload.full_name or f"Saver {clean_phone[-4:]}"
        user = User(
            id=str(uuid.uuid4()),
            phone_number=clean_phone,
            full_name=name,
            momo_provider=provider,
            hashed_password=hash_password(payload.password) if payload.password else None,
            is_verified=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(user)
    else:
        user.is_verified = True
        if payload.full_name:
            user.full_name = payload.full_name
        if payload.momo_provider:
            user.momo_provider = payload.momo_provider
        if payload.password:
            user.hashed_password = hash_password(payload.password)
        user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(user)

    # Create JWT access token
    token = create_access_token(data={"sub": user.id, "phone": user.phone_number})

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfile.model_validate(user)
    )

@router.get("/me", response_model=UserProfile)
def get_current_profile(current_user: User = Depends(get_current_user)):
    """Returns the authenticated saver's profile."""
    return UserProfile.model_validate(current_user)

@router.put("/profile", response_model=UserProfile)
def update_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates profile information (Full Name, Preferred MoMo Provider, Ghana Card)."""
    if payload.full_name:
        current_user.full_name = payload.full_name.strip()
    if payload.momo_provider:
        current_user.momo_provider = payload.momo_provider
    if payload.password:
        current_user.hashed_password = hash_password(payload.password)
    if payload.ghana_card_number:
        current_user.ghana_card_number = payload.ghana_card_number.strip()
    current_user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(current_user)
    return UserProfile.model_validate(current_user)

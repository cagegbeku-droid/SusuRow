from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
import re

class MoMoProviderEnum(str):
    MTN = "MTN"
    TELECEL = "TELECEL"
    AT = "AT"


def sanitize_ghana_phone(phone: str) -> str:
    """Standardizes Ghanaian phone numbers to standard 10 digits e.g. 0244123456 or international +233244123456."""
    cleaned = re.sub(r"[^\d+]", "", phone.strip())
    if cleaned.startswith("+233"):
        cleaned = "0" + cleaned[4:]
    elif cleaned.startswith("233") and len(cleaned) == 12:
        cleaned = "0" + cleaned[3:]
    return cleaned


def detect_momo_provider(phone: str) -> str:
    cleaned = sanitize_ghana_phone(phone)
    if len(cleaned) >= 3:
        prefix = cleaned[:3]
        if prefix in ["024", "054", "055", "059", "025", "053"]:
            return "MTN"
        elif prefix in ["020", "050"]:
            return "TELECEL"
        elif prefix in ["027", "057", "026", "056"]:
            return "AT"
    return "MTN"


# Auth & User Schemas
class RegisterRequest(BaseModel):
    phone_number: str
    password: str = Field(..., min_length=4, max_length=128)
    full_name: str
    username: Optional[str] = None
    email: Optional[str] = None
    momo_provider: Optional[str] = "MTN"

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        clean = sanitize_ghana_phone(v)
        if not re.match(r"^0(24|54|55|59|25|53|20|50|27|57|26|56)\d{7}$", clean):
            if len(clean) != 10 or not clean.isdigit():
                raise ValueError("Please provide a valid 10-digit Ghanaian mobile number (e.g. 0244123456)")
        return clean


class LoginRequest(BaseModel):
    phone_number: str
    password: str = Field(..., min_length=1)

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return sanitize_ghana_phone(v)


class GoogleAuthRequest(BaseModel):
    id_token: Optional[str] = None
    email: str
    name: str
    picture: Optional[str] = None
    phone_number: Optional[str] = None


class SendOTPRequest(BaseModel):
    phone_number: str
    full_name: Optional[str] = None
    momo_provider: Optional[str] = None

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        clean = sanitize_ghana_phone(v)
        if not re.match(r"^0(24|54|55|59|25|53|20|50|27|57|26|56)\d{7}$", clean):
            if len(clean) != 10 or not clean.isdigit():
                raise ValueError("Please provide a valid 10-digit Ghanaian mobile number (e.g. 0244123456)")
        return clean


class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp_code: str = Field(..., min_length=4, max_length=10)
    full_name: Optional[str] = None
    momo_provider: Optional[str] = None
    password: Optional[str] = None

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return sanitize_ghana_phone(v)


class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    phone_number: str
    full_name: str
    username: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    momo_provider: str
    tier: str = "BRONZE"
    points: int = 50
    trust_score: int = 100
    on_time_payments_count: int = 0
    is_verified: bool = False
    nationality: str = "Ghanaian"
    date_of_birth: Optional[str] = None
    
    # KYC & Documents
    kyc_status: str = "UNVERIFIED"
    ghana_card_number: Optional[str] = None
    next_of_kin_name: Optional[str] = None
    next_of_kin_phone: Optional[str] = None
    next_of_kin_relation: Optional[str] = None
    employment_status: Optional[str] = None
    savings_goal: Optional[str] = None
    has_security_pin: bool = False
    has_signature: bool = False

    # Financial Rails
    primary_wallet_provider: str = "MTN"
    primary_wallet_number: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_branch: Optional[str] = None

    # Automated Top-ups
    auto_debit_enabled: bool = False
    auto_debit_frequency: str = "WEEKLY"
    auto_debit_time: str = "08:00"

    created_at: datetime


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[str] = None
    nationality: Optional[str] = None
    avatar_url: Optional[str] = None
    employment_status: Optional[str] = None
    savings_goal: Optional[str] = None


class KYCSubmitRequest(BaseModel):
    ghana_card_number: str = Field(..., description="Format: GHA-XXXXXXXXX-X")
    next_of_kin_name: str = Field(..., min_length=2)
    next_of_kin_phone: str = Field(..., min_length=10)
    next_of_kin_relation: str = Field("Spouse/Sibling/Parent", min_length=2)
    employment_status: Optional[str] = "Employed"
    savings_goal: Optional[str] = None
    signature_data: Optional[str] = None # Base64 signature image

    @field_validator("ghana_card_number")
    @classmethod
    def validate_ghana_card(cls, v: str) -> str:
        clean = v.strip().upper()
        if not re.match(r"^GHA-\d{9}-\d$", clean):
            # Also accept loose format GHA-XXXXXXXXX-X
            if not clean.startswith("GHA-") or len(clean) < 14:
                raise ValueError("Invalid Ghana Card format. Must be GHA-XXXXXXXXX-X (e.g. GHA-712345678-9)")
        return clean


class SecurityPINRequest(BaseModel):
    pin: str = Field(..., min_length=4, max_length=4, description="4-digit numeric PIN")
    current_password: Optional[str] = None

    @field_validator("pin")
    @classmethod
    def validate_pin_digits(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 4:
            raise ValueError("PIN must be exactly 4 numeric digits")
        return v


class WalletConfigRequest(BaseModel):
    primary_wallet_provider: str = Field("MTN", description="MTN, TELECEL, AT, or BANK")
    primary_wallet_number: str = Field(...)
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_branch: Optional[str] = None


class AutoDebitRequest(BaseModel):
    enabled: bool
    frequency: str = "WEEKLY" # DAILY, WEEKLY, MONTHLY
    time: str = "08:00"


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


# Member Schemas
class MemberBase(BaseModel):
    phone_number: str
    full_name: str
    momo_provider: Optional[str] = "MTN"

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        clean = sanitize_ghana_phone(v)
        if not re.match(r"^0(24|54|55|59|25|53|20|50|27|57|26|56)\d{7}$", clean):
            if len(clean) != 10 or not clean.isdigit():
                raise ValueError("Please provide a valid 10-digit Ghanaian mobile number (e.g. 0244123456)")
        return clean


class MemberJoinRequest(MemberBase):
    group_id: Optional[str] = None
    invite_code: Optional[str] = None


class MemberBidSubmit(BaseModel):
    member_id: str
    bid_amount: float = Field(..., ge=0.0, description="Discount amount bid to secure early round")


class MemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    group_id: str
    phone_number: str
    full_name: str
    momo_provider: str
    payout_position: Optional[int] = None
    has_paid_current_round: bool
    has_received_payout: bool
    deposit_paid: bool
    bid_amount: float
    trust_score: int = 100
    joined_at: datetime


# Chat & Messages Schemas
class GroupMessageCreate(BaseModel):
    group_id: str
    sender_phone: str
    sender_name: str
    message_text: str = Field(..., min_length=1, max_length=1000)
    is_announcement: bool = False


class GroupMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    group_id: str
    sender_phone: str
    sender_name: str
    message_text: str
    is_announcement: bool
    created_at: datetime


# Payment & Payout Schemas
class PaymentInitiateRequest(BaseModel):
    group_id: str
    member_id: str
    momo_provider: Optional[str] = None
    is_commitment_deposit: bool = False


class PaymentWebhookPayload(BaseModel):
    transaction_reference: str
    momo_provider: str
    phone_number: str
    amount: float
    status: str = "SUCCESS"
    network_transaction_id: Optional[str] = None


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    group_id: str
    member_id: str
    round_number: int
    amount: float
    momo_provider: str
    transaction_reference: str
    status: str
    paid_at: datetime


class PayoutResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    group_id: str
    member_id: str
    round_number: int
    amount: float
    recipient_phone: str
    momo_provider: str
    transaction_reference: str
    status: str
    disbursed_at: datetime
    member_name: Optional[str] = None


# Group Schemas
class GroupCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=120)
    description: Optional[str] = None
    is_private: bool = False
    contribution_amount: float = Field(..., gt=0.0, description="Contribution amount per round in GHS")
    frequency: str = Field("WEEKLY", description="DAILY, WEEKLY, or MONTHLY")
    members_count: int = Field(..., ge=2, le=50, description="Capacity limit between 2 and 50 members")
    commitment_deposit: Optional[float] = Field(0.0, ge=0.0, description="Optional upfront escrow deposit in GHS")
    rotation_type: str = Field("SEQUENTIAL", description="SEQUENTIAL, BALLOT, or BIDDING")
    creator_phone: str
    creator_name: Optional[str] = "Group Leader"
    creator_momo_provider: Optional[str] = "MTN"


class GroupSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str]
    is_private: bool
    contribution_amount: float
    frequency: str
    members_count: int
    enrolled_count: int
    total_pool: float
    commitment_deposit: float
    rotation_type: str
    invite_code: str
    current_round: int
    creator_id: str
    status: str
    created_at: datetime


class GroupDetailResponse(GroupSummaryResponse):
    model_config = ConfigDict(from_attributes=True)

    members: List[MemberResponse] = []
    payments: List[PaymentResponse] = []
    payouts: List[PayoutResponse] = []
    messages: List[GroupMessageResponse] = []
    current_recipient: Optional[MemberResponse] = None
    all_current_round_paid: bool = False
    progress_percentage: float = 0.0


# Rotation Actions
class BallotTriggerRequest(BaseModel):
    group_id: str
    seed: Optional[str] = None


class AdvanceRoundResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    success: bool
    message: str
    current_round: int
    payout_disbursed: Optional[PayoutResponse] = None
    group_status: str


# Stats Schema
class PlatformStats(BaseModel):
    total_pooled_ghs: float
    total_payouts_disbursed_ghs: float
    active_circles_count: int
    completed_circles_count: int
    total_savers_count: int
    default_rate: float

import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from database import Base
import enum

class GroupFrequency(str, enum.Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"

class RotationType(str, enum.Enum):
    SEQUENTIAL = "SEQUENTIAL"
    BALLOT = "BALLOT"
    BIDDING = "BIDDING"

class GroupStatus(str, enum.Enum):
    RECRUITING = "RECRUITING"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"

class MoMoProvider(str, enum.Enum):
    MTN = "MTN"
    TELECEL = "TELECEL"
    AT = "AT"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    phone_number = Column(String(20), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    momo_provider = Column(String(20), default=MoMoProvider.MTN.value, nullable=False)
    hashed_password = Column(String(256), nullable=True) # Secure PBKDF2 hash
    hashed_pin = Column(String(128), nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    ghana_card_number = Column(String(30), nullable=True) # Optional Ghana Card (GHA-XXXXXXXXX-X)
    trust_score = Column(Integer, default=100, nullable=False) # 0 to 100 Saver Reliability Score
    on_time_payments_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    phone_number = Column(String(20), index=True, nullable=False)
    otp_code = Column(String(10), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class SusuGroup(Base):
    __tablename__ = "susu_groups"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    is_private = Column(Boolean, default=False, nullable=False)
    contribution_amount = Column(Float, nullable=False) # e.g. 200.0 GHS
    frequency = Column(String(20), default=GroupFrequency.WEEKLY.value, nullable=False)
    members_count = Column(Integer, nullable=False) # Capacity limit (e.g. 3 to 50)
    total_pool = Column(Float, nullable=False) # contribution_amount * members_count
    commitment_deposit = Column(Float, default=0.0, nullable=False) # Upfront escrow security deposit
    rotation_type = Column(String(20), default=RotationType.SEQUENTIAL.value, nullable=False)
    invite_code = Column(String(20), unique=True, index=True, nullable=False)
    current_round = Column(Integer, default=1, nullable=False)
    creator_id = Column(String(60), nullable=False) # Creator phone number
    status = Column(String(20), default=GroupStatus.RECRUITING.value, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan", order_by="GroupMember.payout_position")
    payments = relationship("ContributionPayment", back_populates="group", cascade="all, delete-orphan")
    payouts = relationship("PayoutDisbursement", back_populates="group", cascade="all, delete-orphan")
    messages = relationship("GroupMessage", back_populates="group", cascade="all, delete-orphan", order_by="GroupMessage.created_at")


class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id = Column(String(36), ForeignKey("susu_groups.id"), nullable=False)
    phone_number = Column(String(20), nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    momo_provider = Column(String(20), default=MoMoProvider.MTN.value, nullable=False)
    payout_position = Column(Integer, nullable=True) # 1 to N
    has_paid_current_round = Column(Boolean, default=False, nullable=False)
    has_received_payout = Column(Boolean, default=False, nullable=False)
    deposit_paid = Column(Boolean, default=False, nullable=False)
    bid_amount = Column(Float, default=0.0, nullable=False) # For bidding scheme
    trust_score = Column(Integer, default=100, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    group = relationship("SusuGroup", back_populates="members")
    payments = relationship("ContributionPayment", back_populates="member", cascade="all, delete-orphan")
    payouts = relationship("PayoutDisbursement", back_populates="member", cascade="all, delete-orphan")


class GroupMessage(Base):
    __tablename__ = "group_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id = Column(String(36), ForeignKey("susu_groups.id"), nullable=False)
    sender_phone = Column(String(20), nullable=False)
    sender_name = Column(String(100), nullable=False)
    message_text = Column(Text, nullable=False)
    is_announcement = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    group = relationship("SusuGroup", back_populates="messages")


class ContributionPayment(Base):
    __tablename__ = "contribution_payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id = Column(String(36), ForeignKey("susu_groups.id"), nullable=False)
    member_id = Column(String(36), ForeignKey("group_members.id"), nullable=False)
    round_number = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    momo_provider = Column(String(20), nullable=False)
    transaction_reference = Column(String(60), unique=True, index=True, nullable=False)
    status = Column(String(20), default=PaymentStatus.SUCCESS.value, nullable=False)
    paid_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    group = relationship("SusuGroup", back_populates="payments")
    member = relationship("GroupMember", back_populates="payments")


class PayoutDisbursement(Base):
    __tablename__ = "payout_disbursements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id = Column(String(36), ForeignKey("susu_groups.id"), nullable=False)
    member_id = Column(String(36), ForeignKey("group_members.id"), nullable=False)
    round_number = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    recipient_phone = Column(String(20), nullable=False)
    momo_provider = Column(String(20), nullable=False)
    transaction_reference = Column(String(60), unique=True, index=True, nullable=False)
    status = Column(String(20), default=PaymentStatus.SUCCESS.value, nullable=False)
    disbursed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    group = relationship("SusuGroup", back_populates="payouts")
    member = relationship("GroupMember", back_populates="payouts")


class MoMoWebhookLog(Base):
    __tablename__ = "momo_webhook_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_reference = Column(String(60), nullable=False, index=True)
    provider = Column(String(20), nullable=False)
    event_type = Column(String(40), nullable=False)
    payload_json = Column(Text, nullable=False)
    processed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

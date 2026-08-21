import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from database import Base, get_db
import models
from main import app
from services.sms_service import GhanaSMSService

# Shared In-Memory Test Engine
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(autouse=True)
def db_session():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(autouse=True)
def mock_sms_gateway():
    """Mock SMS gateway during automated tests to preserve live Arkesel SMS units."""
    async def fake_send_sms(phone, otp):
        return {
            "success": True,
            "provider": "DEV_CONSOLE",
            "otp_code": otp,
            "message": "Mock test dispatch"
        }
    with patch.object(GhanaSMSService, 'send_otp_sms', side_effect=fake_send_sms):
        yield

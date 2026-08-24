import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from database import engine, Base
import models
from routes.auth import router as auth_router
from routes.groups import router as groups_router
from routes.members import router as members_router
from routes.payments import router as payments_router
from routes.rotation import router as rotation_router
from routes.stats import router as stats_router
from routes.chat import router as chat_router
from routes.reminders import router as reminders_router

def auto_migrate_schema():
    """Ensures newly added columns exist in both PostgreSQL (Supabase / Render) and SQLite."""
    try:
        with engine.begin() as conn:
            columns_to_add = [
                ("username", "VARCHAR(50)"),
                ("email", "VARCHAR(120)"),
                ("avatar_url", "TEXT"),
                ("security_pin_hash", "VARCHAR(256)"),
                ("tier", "VARCHAR(20) DEFAULT 'BRONZE'"),
                ("points", "INTEGER DEFAULT 50"),
                ("date_of_birth", "VARCHAR(20)"),
                ("nationality", "VARCHAR(50) DEFAULT 'Ghanaian'"),
                ("kyc_status", "VARCHAR(20) DEFAULT 'UNVERIFIED'"),
                ("next_of_kin_name", "VARCHAR(100)"),
                ("next_of_kin_phone", "VARCHAR(20)"),
                ("next_of_kin_relation", "VARCHAR(50)"),
                ("employment_status", "VARCHAR(50)"),
                ("savings_goal", "VARCHAR(100)"),
                ("signature_data", "TEXT"),
                ("primary_wallet_provider", "VARCHAR(20) DEFAULT 'MTN'"),
                ("primary_wallet_number", "VARCHAR(30)"),
                ("bank_name", "VARCHAR(100)"),
                ("bank_account_number", "VARCHAR(50)"),
                ("bank_branch", "VARCHAR(50)"),
                ("auto_debit_enabled", "BOOLEAN DEFAULT FALSE"),
                ("auto_debit_frequency", "VARCHAR(20) DEFAULT 'WEEKLY'"),
                ("auto_debit_time", "VARCHAR(10) DEFAULT '08:00'"),
                ("is_active", "BOOLEAN DEFAULT TRUE"),
            ]
            
            is_sqlite = engine.dialect.name == "sqlite"
            for col_name, col_type in columns_to_add:
                try:
                    if is_sqlite:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                    else:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                except Exception:
                    pass
    except Exception as e:
        print(f"[Schema Migration Notice]: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema cleanly on startup
    try:
        Base.metadata.create_all(bind=engine)
        auto_migrate_schema()
        print("[Database]: Tables and schema migrations verified successfully.")
    except Exception as e:
        print(f"[Database Startup Notice]: {e}")
    yield

app = FastAPI(
    title="SusuRow API - Digital ROSCA Platform (by Coratech Global)",
    description="Digital Ghanaian Susu rotational savings with Ghana Mobile Money settlement engine.",
    version="1.5.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth_router)
app.include_router(groups_router)
app.include_router(members_router)
app.include_router(payments_router)
app.include_router(rotation_router)
app.include_router(stats_router)
app.include_router(chat_router)
app.include_router(reminders_router)

@app.get("/")
def root():
    return {
        "app": "SusuRow API",
        "developer": "Coratech Global (coratechglobal.com)",
        "environment": "production",
        "status": "online",
        "version": "1.5.0",
        "currency": "GHS (Ghanaian Cedi GH₵)",
        "supported_momo": ["MTN Mobile Money", "Telecel Cash", "AT Money"]
    }

@app.get("/api/health")
def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

import os
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import engine, Base, get_db
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
    """Ensures all columns exist in PostgreSQL (Supabase / Render) and SQLite."""
    results = []
    
    # Table migrations: (table_name, column_name, column_type)
    migrations = [
        ("users", "username", "VARCHAR(50)"),
        ("users", "email", "VARCHAR(120)"),
        ("users", "avatar_url", "TEXT"),
        ("users", "security_pin_hash", "VARCHAR(256)"),
        ("users", "tier", "VARCHAR(20) DEFAULT 'BRONZE'"),
        ("users", "points", "INTEGER DEFAULT 50"),
        ("users", "trust_score", "INTEGER DEFAULT 100"),
        ("users", "on_time_payments_count", "INTEGER DEFAULT 0"),
        ("users", "date_of_birth", "VARCHAR(20)"),
        ("users", "nationality", "VARCHAR(50) DEFAULT 'Ghanaian'"),
        ("users", "kyc_status", "VARCHAR(20) DEFAULT 'UNVERIFIED'"),
        ("users", "ghana_card_number", "VARCHAR(30)"),
        ("users", "next_of_kin_name", "VARCHAR(100)"),
        ("users", "next_of_kin_phone", "VARCHAR(20)"),
        ("users", "next_of_kin_relation", "VARCHAR(50)"),
        ("users", "employment_status", "VARCHAR(50)"),
        ("users", "savings_goal", "VARCHAR(100)"),
        ("users", "signature_data", "TEXT"),
        ("users", "primary_wallet_provider", "VARCHAR(20) DEFAULT 'MTN'"),
        ("users", "primary_wallet_number", "VARCHAR(30)"),
        ("users", "bank_name", "VARCHAR(100)"),
        ("users", "bank_account_number", "VARCHAR(50)"),
        ("users", "bank_branch", "VARCHAR(50)"),
        ("users", "auto_debit_enabled", "BOOLEAN DEFAULT FALSE"),
        ("users", "auto_debit_frequency", "VARCHAR(20) DEFAULT 'WEEKLY'"),
        ("users", "auto_debit_time", "VARCHAR(10) DEFAULT '08:00'"),
        ("users", "is_active", "BOOLEAN DEFAULT TRUE"),
        ("group_members", "trust_score", "INTEGER DEFAULT 100"),
        ("group_members", "bid_amount", "FLOAT DEFAULT 0.0"),
    ]
    
    is_sqlite = engine.dialect.name == "sqlite"
    if not is_sqlite:
        try:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ALTER COLUMN phone_number DROP NOT NULL;"))
                conn.execute(text("ALTER TABLE users ALTER COLUMN momo_provider DROP NOT NULL;"))
                results.append("Dropped NOT NULL on users.phone_number and users.momo_provider")
        except Exception as e:
            results.append(f"Notice dropping NOT NULL: {str(e)}")

    for table_name, col_name, col_type in migrations:
        try:
            with engine.begin() as conn:
                if is_sqlite:
                    conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}"))
                else:
                    conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
            results.append(f"Verified {table_name}.{col_name}")
        except Exception as e:
            results.append(f"Notice {table_name}.{col_name}: {str(e)}")
    return results

@asynccontextmanager
async def lifespan(app: FastAPI):
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

@app.get("/api/migrate-db")
def trigger_migration(db: Session = Depends(get_db)):
    """Triggers and checks DB schema migration."""
    migration_logs = auto_migrate_schema()
    try:
        user_count = db.query(models.User).count()
        return {
            "status": "success",
            "db_dialect": engine.dialect.name,
            "user_count": user_count,
            "migration_logs": migration_logs
        }
    except Exception as e:
        return {
            "status": "error",
            "db_dialect": engine.dialect.name,
            "error": str(e),
            "traceback": traceback.format_exc(),
            "migration_logs": migration_logs
        }


@app.get("/api/admin/clean-all-data")
def clean_all_data(db: Session = Depends(get_db)):
    """Cleans all test data from the database for a fresh start."""
    try:
        db.query(models.ContributionPayment).delete()
        db.query(models.PayoutDisbursement).delete()
        db.query(models.GroupMessage).delete()
        db.query(models.GroupMember).delete()
        db.query(models.SusuGroup).delete()
        db.query(models.OTPVerification).delete()
        db.query(models.MoMoWebhookLog).delete()
        db.query(models.User).delete()
        db.commit()
        return {
            "status": "success",
            "message": "All test groups, members, payments, and users were permanently cleared from the database."
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

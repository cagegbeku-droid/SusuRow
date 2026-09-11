import os
import traceback
from typing import Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Query, Request
from fastapi.responses import HTMLResponse, FileResponse, RedirectResponse
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
from routes.admin import router as admin_router

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
        ("users", "momo_account_name", "VARCHAR(120)"),
        ("users", "bank_name", "VARCHAR(100)"),
        ("users", "bank_account_number", "VARCHAR(50)"),
        ("users", "bank_branch", "VARCHAR(50)"),
        ("users", "auto_debit_enabled", "BOOLEAN DEFAULT FALSE"),
        ("users", "auto_debit_frequency", "VARCHAR(20) DEFAULT 'WEEKLY'"),
        ("users", "auto_debit_time", "VARCHAR(10) DEFAULT '08:00'"),
        ("users", "is_active", "BOOLEAN DEFAULT TRUE"),
        ("users", "is_admin", "BOOLEAN DEFAULT FALSE"),
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
app.include_router(admin_router)

@app.get("/")
def root():
    return {
        "app": "SusuRow API",
        "developer": "Coratech Global (coratechglobal.com)",
        "environment": "production",
        "status": "online",
        "version": "1.6.0",
        "currency": "GHS (Ghanaian Cedi GH₵)",
        "supported_momo": ["MTN Mobile Money", "Telecel Cash", "AT Money"]
    }

@app.get("/api/health")
def health():
    return {"status": "healthy"}

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

@app.get("/download/app")
def download_app():
    """Serves the latest SusuRow Android APK directly for instant mobile install."""
    apk_path = os.path.join(os.path.dirname(__file__), "static", "SusuRow.apk")
    if os.path.exists(apk_path):
        return FileResponse(
            path=apk_path,
            filename="SusuRow.apk",
            media_type="application/vnd.android.package-archive"
        )
    return HTMLResponse(
        """
        <!DOCTYPE html>
        <html>
        <head><title>SusuRow - Download App</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="font-family: sans-serif; text-align: center; padding: 40px 20px; background: #f8fafc;">
            <h2>SusuRow Android App</h2>
            <p>The APK file is being synced. Please check back in a few minutes or get it from the Google Play Store.</p>
        </body>
        </html>
        """,
        status_code=404
    )

@app.get("/admin")
def admin_portal_redirect():
    """Redirects to the internal executive management console."""
    return RedirectResponse(url="/?tab=admin")

@app.get("/join", response_class=HTMLResponse)
@app.get("/invite/{code}", response_class=HTMLResponse)
def web_join_landing(
    code: Optional[str] = None, 
    ref: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    """
    Public web landing page when users share group links via WhatsApp, SMS, or Telegram.
    Allows anyone (even without the app) to inspect the group details, copy the invite code,
    open via deep link in the app, or download the Android APK instantly.
    """
    invite_code = (code or "").strip()
    group = None
    if invite_code:
        group = db.query(models.SusuGroup).filter(models.SusuGroup.invite_code.ilike(invite_code)).first()

    group_name = group.name if group else "Susu Savings Circle"
    contribution = f"GH₵{group.contribution_amount:.2f}" if group else "GH₵100.00+"
    frequency = group.frequency.title() if group else "Weekly"
    total_pot = f"GH₵{group.total_pool:.2f}" if group else "Lump Sum Pot"
    members_count = group.members_count if group else 5
    enrolled_count = len(group.members) if group else 1
    spots_remaining = max(0, members_count - enrolled_count)
    is_full = group and (enrolled_count >= members_count)
    group_status = group.status if group else "RECRUITING"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Join {group_name} on SusuRow | Digital Ghanaian Susu</title>
    
    <!-- Open Graph for WhatsApp, Telegram, X preview cards -->
    <meta property="og:title" content="Join {group_name} on SusuRow" />
    <meta property="og:description" content="Rotate & save {contribution} {frequency} with zero loan interest. 100% automated Ghana Mobile Money payouts." />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="SusuRow Ghana" />
    <meta name="theme-color" content="#005B52" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }}
        body {{
            background: linear-gradient(145deg, #003630 0%, #005B52 50%, #022b26 100%);
            color: #0f172a;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px 16px;
        }}
        .container {{
            width: 100%;
            max-width: 480px;
            background: #ffffff;
            border-radius: 32px;
            box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.45);
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.2);
            animation: fadeIn 0.4s ease-out;
        }}
        @keyframes fadeIn {{
            from {{ opacity: 0; transform: translateY(14px); }}
            to {{ opacity: 1; transform: translateY(0); }}
        }}
        .header {{
            background: linear-gradient(135deg, #005B52 0%, #003e37 100%);
            padding: 32px 24px 24px;
            text-align: center;
            color: #ffffff;
            position: relative;
        }}
        .brand-badge {{
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(8px);
            padding: 6px 14px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #fef08a;
            margin-bottom: 16px;
            border: 1px solid rgba(254, 240, 138, 0.3);
        }}
        .title {{
            font-size: 24px;
            font-weight: 900;
            line-height: 1.25;
            letter-spacing: -0.5px;
            margin-bottom: 8px;
        }}
        .subtitle {{
            font-size: 13px;
            color: #d1fae5;
            line-height: 1.45;
        }}
        .body-card {{
            padding: 24px 20px;
        }}
        .circle-card {{
            background: #f8fafc;
            border: 1.5px solid #e2e8f0;
            border-radius: 24px;
            padding: 20px;
            margin-bottom: 20px;
        }}
        .circle-name {{
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 4px;
        }}
        .grid-stats {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin: 16px 0;
        }}
        .stat-box {{
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 12px;
        }}
        .stat-label {{
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }}
        .stat-value {{
            font-size: 15px;
            font-weight: 900;
            color: #0f172a;
        }}
        .code-banner {{
            background: #f1f5f9;
            border: 2px dashed #cbd5e1;
            border-radius: 18px;
            padding: 14px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 20px;
        }}
        .code-val {{
            font-family: monospace;
            font-size: 20px;
            font-weight: 900;
            letter-spacing: 1.5px;
            color: #005B52;
        }}
        .btn-copy {{
            background: #0f172a;
            color: #ffffff;
            font-size: 12px;
            font-weight: 700;
            border: none;
            padding: 8px 16px;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
        }}
        .btn-copy:hover {{
            background: #1e293b;
        }}
        .actions {{
            display: flex;
            flex-direction: column;
            gap: 12px;
        }}
        .btn-primary {{
            background: #005B52;
            color: #ffffff;
            text-decoration: none;
            font-size: 15px;
            font-weight: 800;
            padding: 16px 20px;
            border-radius: 18px;
            text-align: center;
            display: block;
            box-shadow: 0 10px 20px -5px rgba(0, 91, 82, 0.4);
            transition: all 0.2s;
        }}
        .btn-primary:hover {{
            background: #004740;
            transform: translateY(-1px);
        }}
        .btn-secondary {{
            background: #f8fafc;
            color: #0f172a;
            text-decoration: none;
            font-size: 14px;
            font-weight: 700;
            padding: 14px 20px;
            border-radius: 18px;
            text-align: center;
            display: block;
            border: 1.5px solid #cbd5e1;
            transition: all 0.2s;
        }}
        .btn-secondary:hover {{
            background: #f1f5f9;
        }}
        .steps {{
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }}
        .steps-title {{
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            margin-bottom: 12px;
        }}
        .step-item {{
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 10px;
            font-size: 13px;
            color: #334155;
            line-height: 1.4;
        }}
        .step-num {{
            background: #e2e8f0;
            color: #0f172a;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 800;
            shrink-0;
        }}
        .footer {{
            text-align: center;
            margin-top: 20px;
            font-size: 11px;
            color: #94a3b8;
        }}
        .momo-badges {{
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 8px;
        }}
        .badge-pill {{
            font-size: 10px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 6px;
        }}
        .badge-mtn {{ background: #fef08a; color: #854d0e; }}
        .badge-telecel {{ background: #fee2e2; color: #991b1b; }}
        .badge-at {{ background: #e0f2fe; color: #075985; }}
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <div class="brand-badge">🇬🇭 Ghana Digital Susu</div>
        <h1 class="title">You're Invited to Save</h1>
        <p class="subtitle">Join <strong>{group_name}</strong> on SusuRow to save and rotate money together with zero loan interest.</p>
    </div>

    <div class="body-card">
        <div class="circle-card">
            <div class="circle-name">{group_name}</div>
            <div style="font-size: 12px; color: #64748b; font-weight: 600;">
                {"🟢 Spots Available to Join" if not is_full else "🔒 Group is Currently Full"}
            </div>

            <div class="grid-stats">
                <div class="stat-box">
                    <div class="stat-label">Contribution</div>
                    <div class="stat-value">{contribution}</div>
                    <div style="font-size: 10px; color: #64748b; font-weight: 600; margin-top: 2px;">{frequency} Cycle</div>
                </div>

                <div class="stat-box">
                    <div class="stat-label">Target Lump Sum</div>
                    <div class="stat-value">{total_pot}</div>
                    <div style="font-size: 10px; color: #64748b; font-weight: 600; margin-top: 2px;">Paid to your MoMo</div>
                </div>

                <div class="stat-box">
                    <div class="stat-label">Cycle Size</div>
                    <div class="stat-value">{members_count} Savers</div>
                </div>

                <div class="stat-box">
                    <div class="stat-label">Spots Left</div>
                    <div class="stat-value" style="color: {'#16a34a' if spots_remaining > 0 else '#dc2626'}">{spots_remaining} Open</div>
                </div>
            </div>

            <!-- Group Invite Code -->
            <div class="code-banner">
                <div>
                    <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b;">Invite Code</div>
                    <div class="code-val" id="inviteCodeText">{invite_code or "SUSU-INVITE"}</div>
                </div>
                <button class="btn-copy" id="copyBtn" onclick="copyInviteCode()">Copy Code</button>
            </div>
        </div>

        <!-- Action CTAs -->
        <div class="actions">
            <a href="susurow://join?code={invite_code}" class="btn-primary" onclick="tryLaunchApp(event, '{invite_code}')">
                📲 Open in SusuRow App
            </a>

            <a href="/download/app" class="btn-secondary">
                ⬇️ Download Android App (Direct APK)
            </a>
        </div>

        <!-- 3 Step Instructions -->
        <div class="steps">
            <div class="steps-title">How to Join This Circle:</div>
            
            <div class="step-item">
                <div class="step-num">1</div>
                <div>Copy the invite code <strong>{invite_code or 'above'}</strong>.</div>
            </div>

            <div class="step-item">
                <div class="step-num">2</div>
                <div>Install or open the <strong>SusuRow</strong> app on your Android phone.</div>
            </div>

            <div class="step-item">
                <div class="step-num">3</div>
                <div>Tap <strong>"Have an invite code?"</strong>, paste <strong>{invite_code}</strong>, and start rotating!</div>
            </div>
        </div>

        <div class="footer">
            <div>Supported Mobile Money Networks:</div>
            <div class="momo-badges">
                <span class="badge-pill badge-mtn">MTN MoMo</span>
                <span class="badge-pill badge-telecel">Telecel Cash</span>
                <span class="badge-pill badge-at">AT Money</span>
            </div>
            <p style="margin-top: 12px;">© 2026 SusuRow Ghana. Bank-grade 256-bit automated escrow encryption.</p>
        </div>
    </div>
</div>

<script>
    function copyInviteCode() {{
        const code = document.getElementById('inviteCodeText').innerText.trim();
        if (navigator.clipboard) {{
            navigator.clipboard.writeText(code).then(() => {{
                const btn = document.getElementById('copyBtn');
                btn.innerText = '✓ Copied!';
                btn.style.background = '#16a34a';
                setTimeout(() => {{
                    btn.innerText = 'Copy Code';
                    btn.style.background = '#0f172a';
                }}, 2500);
            }});
        }}
    }}

    function tryLaunchApp(e, code) {{
        // Attempt deep linking. If the app is not installed, prompt direct APK download
        const start = Date.now();
        setTimeout(() => {{
            if (Date.now() - start < 2200) {{
                if (confirm('SusuRow app is not opened yet. Would you like to download the Android app APK directly?')) {{
                    window.location.href = '/download/app';
                }}
            }}
        }}, 1400);
    }}
</script>

</body>
</html>
    """
    return HTMLResponse(content=html_content)
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

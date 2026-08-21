import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models # Ensure all SQLAlchemy models are registered on Base.metadata
from routes.auth import router as auth_router
from routes.groups import router as groups_router
from routes.members import router as members_router
from routes.payments import router as payments_router
from routes.rotation import router as rotation_router
from routes.stats import router as stats_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema cleanly on startup
    try:
        Base.metadata.create_all(bind=engine)
        print("[Database]: Tables verified / created successfully.")
    except Exception as e:
        print(f"[Database Startup Notice]: {e}")
    yield

app = FastAPI(
    title="SusuRow API - Production Ghanaian ROSCA Platform",
    description="Production digital West African Susu rotational savings with Ghana Mobile Money settlement engine.",
    version="1.0.0",
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

@app.get("/")
def root():
    return {
        "app": "SusuRow API",
        "environment": "production",
        "description": "Production Digital Rotating Savings & Credit Association (ROSCA) for Ghana",
        "status": "online",
        "version": "1.0.0",
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

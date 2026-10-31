from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed_data import seed_database

# Import routers
from app.routers.dashboard import router as dashboard_router
from app.routers.products import router as products_router
from app.routers.inventory import router as inventory_router
from app.routers.orders import router as orders_router
from app.routers.payments import router as payments_router
from app.routers.transactions import router as transactions_router
from app.routers.customers import router as customers_router
from app.routers.campaigns import router as campaigns_router
from app.routers.analytics import router as analytics_router
from app.routers.brief import router as brief_router
from app.routers.assistant import router as assistant_router
from app.routers.audit_logs import router as audit_logs_router
from app.routers.settings import router as settings_router
from app.routers.notifications import router as notifications_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema and seed demo data if not already present
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db=db, force_reset=False)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-powered Merchant Business Copilot Backend API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow frontend on any port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Include routers
app.include_router(dashboard_router)
app.include_router(products_router)
app.include_router(inventory_router)
app.include_router(orders_router)
app.include_router(payments_router)
app.include_router(transactions_router)
app.include_router(customers_router)
app.include_router(campaigns_router)
app.include_router(analytics_router)
app.include_router(brief_router)
app.include_router(assistant_router)
app.include_router(audit_logs_router)
app.include_router(settings_router)
app.include_router(notifications_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "MerchantMitra API",
        "merchant": settings.DEMO_BUSINESS_NAME,
        "mode": "DEMO_SIMULATION"
    }

# Mount static frontend production build if available
frontend_dist_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api"):
            return None
        file_path = os.path.join(frontend_dist_path, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist_path, "index.html"))

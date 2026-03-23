from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base, SessionLocal
import app.models # Important: Import models before create_all so metadata is populated

# Create tables for SQLite (In production, use Alembic migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Dropship Admin API",
    description="Backend API for managing dropshipping products and parsing Wildberries.",
    version="1.0.0",
)

# Allow CORS for frontend (both local and Vercel)
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://dropship-tan.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def seed_demo_data():
    """Auto-seed demo data for cloud/serverless deployments where DB is ephemeral."""
    from app.models.product import Product
    from app.models.user import User
    from passlib.context import CryptContext

    db = SessionLocal()
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    try:
        from app.models.shop import Shop
        # Seed demo shop
        demo_shop = db.query(Shop).filter(Shop.name == "NRT Store").first()
        if not demo_shop:
            demo_shop = Shop(
                name="NRT Store",
                custom_shop_id="16493269",
                kaspi_token="fvblMh3EkBCHhR1AD...",
                percentage_rules='[{"min": 0, "max": 1000000, "percent": 15}]',
                delivery_price_rules='[{"min": 0, "max": 1000000, "price": 500}]',
                delivery_plus=3
            )
            db.add(demo_shop)
            db.commit()
            db.refresh(demo_shop)

        # Seed demo user
        if db.query(User).count() == 0:
            demo_user = User(
                email="admin@test.kz",
                hashed_password=pwd_context.hash("admin123"),
                shop_id=demo_shop.id,
                is_active=True,
            )
            db.add(demo_user)
            db.commit()

        # Seed demo products
        if db.query(Product).count() == 0:
            demo_products = [
                Product(sku="KZ-001", name="Наушники Sony WH-1000XM5", brand="Sony", wb_price=85000, kaspi_price=95000, mid_price=90000, delivery_cost=1500, stock=10),
                Product(sku="KZ-002", name="Смартфон Samsung Galaxy A54", brand="Samsung", wb_price=142000, kaspi_price=155000, mid_price=148000, delivery_cost=2000, stock=5),
                Product(sku="KZ-003", name="Ноутбук ASUS VivoBook 15", brand="ASUS", wb_price=320000, kaspi_price=349000, mid_price=334000, delivery_cost=3500, stock=3),
                Product(sku="KZ-004", name="Фитнес-браслет Xiaomi Band 8", brand="Xiaomi", wb_price=18500, kaspi_price=22000, mid_price=20000, delivery_cost=700, stock=25),
                Product(sku="KZ-005", name="Беспроводная колонка JBL Flip 6", brand="JBL", wb_price=42000, kaspi_price=49000, mid_price=45000, delivery_cost=1200, stock=8),
                Product(sku="KZ-006", name="Планшет iPad 10-го поколения", brand="Apple", wb_price=185000, kaspi_price=199000, mid_price=192000, delivery_cost=2500, stock=4),
                Product(sku="KZ-007", name="Умные часы Apple Watch SE 2", brand="Apple", wb_price=95000, kaspi_price=105000, mid_price=100000, delivery_cost=1800, stock=6),
                Product(sku="KZ-008", name="Клавиатура Logitech MX Keys", brand="Logitech", wb_price=35000, kaspi_price=42000, mid_price=38000, delivery_cost=900, stock=12),
                Product(sku="KZ-009", name="Мышь Logitech MX Master 3", brand="Logitech", wb_price=28000, kaspi_price=33000, mid_price=30000, delivery_cost=600, stock=15),
                Product(sku="KZ-010", name="Зарядное устройство Anker PowerCore 26800", brand="Anker", wb_price=16000, kaspi_price=19000, mid_price=17500, delivery_cost=500, stock=20),
            ]
            db.add_all(demo_products)
            db.commit()
    except Exception as e:
        print(f"Seed error: {e}")
    finally:
        db.close()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "API is running"}

from app.api import api_router
app.include_router(api_router, prefix="/api/v1")

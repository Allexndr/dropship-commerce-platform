from fastapi import APIRouter
from app.api.products import router as products_router
from app.api.feed import router as feed_router
from app.api.shops import router as shops_router
from app.api.users import router as users_router
from app.api.orders import router as orders_router

api_router = APIRouter()
api_router.include_router(products_router, prefix="/products", tags=["products"])
api_router.include_router(feed_router, prefix="/xml", tags=["feed"])
api_router.include_router(shops_router, prefix="/shops", tags=["shops"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(orders_router, prefix="/orders", tags=["orders"])

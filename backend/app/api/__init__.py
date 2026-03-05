from fastapi import APIRouter
from app.api.products import router as products_router
from app.api.feed import router as feed_router

api_router = APIRouter()
api_router.include_router(products_router, prefix="/products", tags=["products"])
api_router.include_router(feed_router, prefix="/xml", tags=["feed"])

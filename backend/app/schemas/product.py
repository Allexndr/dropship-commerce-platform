from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime

# --- WbLink Schemas ---
class WbLinkBase(BaseModel):
    source: str = "wb"
    external_id: str

class WbLinkCreate(WbLinkBase):
    pass

class WbLinkResponse(WbLinkBase):
    id: int
    product_sku: str
    price: float
    delivery_days: int
    stock_status: str
    quantity: int
    last_parsed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Product Schemas ---
class ProductBase(BaseModel):
    sku: str
    name: str # changed from model to name based on models.py
    brand: Optional[str] = "Unknown"
    kaspi_link: Optional[str] = None
    wb_price: float = 0.0
    kaspi_price: float = 0.0
    status: str = "active"

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    mid_price: float = 0.0
    delivery_cost: float = 0.0
    delivery_days: int = 0
    stock: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    links: List[WbLinkResponse] = []

    class Config:
        from_attributes = True

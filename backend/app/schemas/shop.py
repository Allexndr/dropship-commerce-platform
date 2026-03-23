from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ShopBase(BaseModel):
    name: str
    custom_shop_id: Optional[str] = None
    kaspi_token: Optional[str] = None
    percentage_rules: Optional[str] = "[]" # JSON string
    delivery_price_rules: Optional[str] = "[]" # JSON string
    delivery_plus: int = 0

class ShopCreate(ShopBase):
    pass

class ShopUpdate(BaseModel):
    name: Optional[str] = None
    custom_shop_id: Optional[str] = None
    kaspi_token: Optional[str] = None
    percentage_rules: Optional[str] = None
    delivery_price_rules: Optional[str] = None
    delivery_plus: Optional[int] = None

class ShopResponse(ShopBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

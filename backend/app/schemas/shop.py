from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ShopBase(BaseModel):
    name: str
    api_key: Optional[str] = None
    percent_markup: float = 0.0
    delivery_plus: int = 0
    delivery_price: float = 0.0

class ShopCreate(ShopBase):
    pass

class ShopResponse(ShopBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.schemas.shop import ShopResponse

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = "User"
    role: str = "seller"
    is_active: bool = True
    shop_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    shop: Optional[ShopResponse] = None

    class Config:
        from_attributes = True

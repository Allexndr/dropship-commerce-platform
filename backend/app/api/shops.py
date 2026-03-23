from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.shop import Shop
from app.schemas.shop import ShopCreate, ShopResponse, ShopUpdate

router = APIRouter()

@router.get("/me", response_model=ShopResponse)
def get_current_shop(db: Session = Depends(get_db)):
    # Fallback: return the first shop if no specific logic for current user
    shop = db.query(Shop).first()
    if not shop:
        # Create a default shop if none exists
        shop = Shop(name="Default Shop", percentage_rules="[]", delivery_price_rules="[]")
        db.add(shop)
        db.commit()
        db.refresh(shop)
    return shop

@router.patch("/me", response_model=ShopResponse)
def update_current_shop(shop_update: ShopUpdate, db: Session = Depends(get_db)):
    shop = db.query(Shop).first() # Fallback same as GET
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    update_data = shop_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(shop, key, value)
    
    db.commit()
    db.refresh(shop)
    return shop

@router.get("/", response_model=List[ShopResponse])
def read_shops(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    shops = db.query(Shop).offset(skip).limit(limit).all()
    return shops

@router.post("/", response_model=ShopResponse)
def create_shop(shop: ShopCreate, db: Session = Depends(get_db)):
    db_shop = db.query(Shop).filter(Shop.name == shop.name).first()
    if db_shop:
        raise HTTPException(status_code=400, detail="Shop already exists")
    
    db_shop = Shop(**shop.model_dump())
    db.add(db_shop)
    db.commit()
    db.refresh(db_shop)
    return db_shop

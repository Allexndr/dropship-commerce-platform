from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.shop import Shop
from app.schemas.shop import ShopCreate, ShopResponse

router = APIRouter()

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

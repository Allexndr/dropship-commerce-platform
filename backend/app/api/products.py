from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.product import Product
from app.models.wblink import WbLink
from app.models.shop import Shop
from app.schemas.product import ProductCreate, ProductResponse, WbLinkCreate, WbLinkResponse

router = APIRouter()

@router.get("/", response_model=List[ProductResponse])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = db.query(Product).offset(skip).limit(limit).all()
    # Temporarily we will pull shop settings dynamically if needed, 
    # but for now we just return the raw product records. 
    # The actual calculation of Price = PriceMid + (PriceMid * %) + DeliveryPrice
    # will be done by the frontend or by the background Celery task that updates products.
    return products

@router.post("/", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.sku == product.sku).first()
    if db_product:
        raise HTTPException(status_code=400, detail="SKU already registered")
    
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.post("/{sku}/links", response_model=WbLinkResponse)
def add_wblink_to_product(sku: str, link: WbLinkCreate, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.sku == sku).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    db_link = WbLink(**link.model_dump(), product_sku=sku)
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return db_link

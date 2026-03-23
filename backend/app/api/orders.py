from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.shop import Shop
from app.services.kaspi_service import KaspiAPIClient

router = APIRouter()

@router.get("/")
def get_kaspi_orders(
    shop_id: int, 
    state: str = "NEW", 
    db: Session = Depends(get_db)
):
    """
    Fetch orders from Kaspi for a specific shop.
    """
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop or not shop.api_key:
        raise HTTPException(status_code=400, detail="Shop not found or API Key missing")
    
    client = KaspiAPIClient(shop.api_key)
    orders = client.get_orders(state=state)
    
    # Process orders to include delivery address and entries if needed
    # For efficiency, we might want to do this on-demand or in background
    return {"orders": orders}

@router.get("/{order_id}/details")
def get_order_details(
    order_id: str, 
    shop_id: int, 
    db: Session = Depends(get_db)
):
    """
    Fetch full details for a specific order.
    """
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop or not shop.api_key:
        raise HTTPException(status_code=400, detail="Shop not found or API Key missing")
    
    client = KaspiAPIClient(shop.api_key)
    entries = client.get_order_entries(order_id)
    address = client.get_order_address(order_id)
    
    return {
        "order_id": order_id,
        "entries": entries,
        "address": address
    }

@router.post("/{order_id}/status")
def update_order_status(
    order_id: str, 
    shop_id: int, 
    new_state: str, 
    db: Session = Depends(get_db)
):
    """
    Update order status in Kaspi (e.g. to PICKUP).
    """
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop or not shop.api_key:
        raise HTTPException(status_code=400, detail="Shop not found or API Key missing")
    
    client = KaspiAPIClient(shop.api_key)
    success = client.change_order_state(order_id, new_state)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update order status in Kaspi")
        
    return {"status": "success", "new_state": new_state}

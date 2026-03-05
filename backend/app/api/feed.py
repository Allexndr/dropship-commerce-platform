from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from xml.etree.ElementTree import Element, SubElement, tostring
from datetime import datetime

from app.core.database import get_db
from app.models.product import Product
from app.models.wblink import WbLink
from app.services.tasks import trigger_all_active_links_update

router = APIRouter()

@router.post("/parse/trigger")
def trigger_parsing():
    """
    Manually trigger the background parsing for all active WB links.
    Returns immediately while Celery handles the work.
    """
    msg = trigger_all_active_links_update.delay()
    return {"status": "processing", "task_id": msg.id, "message": "Parsing jobs queued"}

@router.get("/feed", response_class=Response)
def generate_xml_feed(db: Session = Depends(get_db)):
    """
    Generates the Kaspi XML feed based on the database state.
    Only includes active products with active WB links.
    """
    # Create root element according to Kaspi specification
    kaspi_catalog = Element("kaspi_catalog", date=datetime.now().strftime("%Y-%m-%d %H:%M"))
    
    company = SubElement(kaspi_catalog, "company")
    company.text = "My Dropship Company"
    merchantid = SubElement(kaspi_catalog, "merchantid")
    merchantid.text = "1234567" # Placeholder
    
    offers = SubElement(kaspi_catalog, "offers")
    
    # Query all active products with their links
    db_products = db.query(Product).filter(Product.status == "active").all()
    
    for product in db_products:
        # Calculate price and status based on linked WB products
        # Logic: Find the link with the best (lowest) price that is in stock
        active_links = [link for link in product.links if link.stock_status == "ok"]
        
        if not active_links:
            # If no active links, skip this product or set availability=false
            continue
            
        # For prototype, just take the first active link's data
        # In a real scenario, this would apply pricing rules and find the highest margin/lowest delivery
        best_link = active_links[0]
        
        offer = SubElement(offers, "offer", sku=product.sku)
        model = SubElement(offer, "model")
        model.text = product.model
        brand = SubElement(offer, "brand")
        brand.text = product.brand or "Unknown"
        
        # Calculate final Kaspi Price (Placeholder logic: WB Price * 1.5)
        price_val = best_link.price * 1.5 if best_link.price > 0 else product.kaspi_price
        
        price = SubElement(offer, "price")
        price.text = str(int(price_val))
        
        avail = SubElement(offer, "availabilities")
        avail_item = SubElement(avail, "availability", 
                              available="yes", 
                              storeId="PP1", # Placeholder store ID
                              preOrder=str(best_link.delivery_days))
    
    # Generate XML string and return as 'application/xml'
    xml_str = tostring(kaspi_catalog, encoding="utf-8").decode("utf-8")
    # Add XML declaration
    final_xml = f'<?xml version="1.0" encoding="utf-8"?>\n{xml_str}'
    
    return Response(content=final_xml, media_type="application/xml")

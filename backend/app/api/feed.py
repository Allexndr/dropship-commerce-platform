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
    Manually trigger the background parsing for all active links.
    """
    msg = trigger_all_active_links_update.delay()
    return {"status": "processing", "task_id": msg.id, "message": "Parsing jobs queued"}

@router.get("/feed", response_class=Response)
def generate_xml_feed(db: Session = Depends(get_db)):
    """
    Generates the Kaspi XML feed based on the database state.
    """
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    kaspi_catalog = Element("kaspi_catalog", date=now_str)
    
    company = SubElement(kaspi_catalog, "company")
    company.text = "NRT Store"
    merchantid = SubElement(kaspi_catalog, "merchantid")
    merchantid.text = "16493269" # Merchant ID from ТЗ
    
    offers = SubElement(kaspi_catalog, "offers")
    
    db_products = db.query(Product).filter(Product.status == "active").all()
    
    for product in db_products:
        # Business Logic from ТЗ
        active_links = [l for l in product.links if l.price > 0 and l.stock_status == "active"]
        
        if not active_links:
            continue
            
        avg_price = sum(l.price for l in active_links) / len(active_links)
        max_delivery = max(l.delivery_days for l in active_links)
        
        # Default Settings
        markup = 0.15
        delivery_plus = 2
        delivery_price = 1500
        
        if product.shop:
            markup = product.shop.percent_markup / 100.0
            delivery_plus = product.shop.delivery_plus
            delivery_price = product.shop.delivery_price

        final_price = int(avg_price + (avg_price * markup) + delivery_price)
        final_delivery = max_delivery + delivery_plus

        offer = SubElement(offers, "offer", sku=product.sku)
        model = SubElement(offer, "model")
        model.text = product.name or product.model
        brand = SubElement(offer, "brand")
        brand.text = product.brand or "Unknown"
        
        price = SubElement(offer, "price")
        price.text = str(final_price)
        
        availabilities = SubElement(offer, "availabilities")
        SubElement(availabilities, "availability", 
                   available="yes", 
                   storeId="PP1", 
                   preOrder=str(final_delivery))
    
    xml_str = tostring(kaspi_catalog, encoding="utf-8").decode("utf-8")
    final_xml = f'<?xml version="1.0" encoding="utf-8"?>\n{xml_str}'
    
    return Response(content=final_xml, media_type="application/xml")

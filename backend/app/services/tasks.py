from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.product import Product
from app.models.wblink import WbLink
# Import the parser we created earlier (need to move it to backend/app/services)
from app.services.wb_parser import WBParser
from datetime import datetime

# Initialize parser with proxy support enabled by default
parser = WBParser(use_proxies=True)

@celery_app.task(bind=True, max_retries=3)
def update_wblink_data(self, link_id: int):
    """
    Background task to fetch latest data for a specific WB Link and update the DB.
    """
    db = SessionLocal()
    try:
        link = db.query(WbLink).filter(WbLink.id == link_id).first()
        if not link:
            return f"Link {link_id} not found."

        # Fetch data using the anti-ban parser
        # external_id is the WB nm_id
        result = parser.get_product_info(int(link.external_id))
        
        if result['status'] == 'success':
            # Update the database record for the link
            if result['price'] > 0:
                link.price = result['price']
            
            link.delivery_days = result['delivery_days']
            link.stock_status = result['stock_status']
            link.quantity = result['quantity']
            link.last_parsed_at = datetime.utcnow()
            
            # Recalculate Product formulas based on all links
            product = db.query(Product).filter(Product.sku == link.product_sku).first()
            if product:
                active_links = [l for l in product.links if l.price > 0 and l.stock_status != 'error'] # simplified logic for active
                if active_links:
                    product.mid_price = sum(l.price for l in active_links) / len(active_links)
                    
                    # DeliveryMID = preorder (срок доставки ВБ/Озон) + DeliveryPLUS
                    max_delivery_mp = max(l.delivery_days for l in active_links)
                    
                    # If product belongs to a shop, calculate final Kaspi price and delivery days
                    if product.shop:
                        import json
                        shop = product.shop
                        
                        # Get DeliveryPLUS
                        delivery_plus = shop.delivery_plus if shop.delivery_plus else 0
                        product.delivery_days = max_delivery_mp + delivery_plus
                        
                        # Find PERCENT from rules
                        markup_percent = 0.0
                        try:
                            perc_rules = json.loads(shop.percentage_rules or '[]')
                            for rule in perc_rules:
                                if rule['min'] <= product.mid_price <= rule['max']:
                                    markup_percent = float(rule['percent']) / 100.0
                                    break
                        except Exception as e:
                            print(f"Error parsing percentage rules: {e}")

                        # Find Delivery Price from rules
                        delivery_price = 0.0
                        try:
                            deliv_rules = json.loads(shop.delivery_price_rules or '[]')
                            for rule in deliv_rules:
                                if rule['min'] <= product.mid_price <= rule['max']:
                                    delivery_price = float(rule['price'])
                                    break
                        except Exception as e:
                            print(f"Error parsing delivery price rules: {e}")
                        
                        # Price = PriceMid + (PriceMid * ПРОЦЕНТ) + Delivery Price
                        product.kaspi_price = product.mid_price + (product.mid_price * markup_percent) + delivery_price
                    else:
                        # Fallback if no shop assigned
                        product.delivery_days = max_delivery_mp
                        product.kaspi_price = product.mid_price
            
            db.commit()
            return f"Successfully updated Link {link_id} (NM: {link.external_id})"
        else:
            # Handle parser failure (e.g., 404, ban)
            link.stock_status = "error"
            db.commit()
            err_msg = result.get('message', 'Unknown error during parsing')
            # Trigger celery retry mechanism
            raise self.retry(exc=Exception(err_msg), countdown=60) # Retry after 60s
            
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

@celery_app.task
def trigger_all_active_links_update():
    """
    Cron job task to queue updates for all active WB links.
    """
    db = SessionLocal()
    try:
        # Get links belonging to active products
        active_links = db.query(WbLink).join(Product).filter(Product.status == "active").all()
        for link in active_links:
            update_wblink_data.delay(link.id)
        return f"Queued {len(active_links)} links for update."
    finally:
        db.close()

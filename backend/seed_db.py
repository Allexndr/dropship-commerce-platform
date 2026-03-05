import time
from app.core.database import SessionLocal
from app.models.product import Product
from app.models.wblink import WbLink
from app.services.tasks import update_wblink_data
from app.core.database import engine, Base
import app.models

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Load real items
import json
try:
    with open('/tmp/real_items.json', 'r', encoding='utf-8') as f:
        real_items = json.load(f)
except Exception as e:
    print(f"Error loading real items: {e}")
    real_items = []

# Cleanup existing
db.query(WbLink).delete()
db.query(Product).delete()
db.commit()

for i, item in enumerate(real_items):
    sku = f"KASPI-{1000 + i}"
    nm_id = item['nm_id']
    
    # Create master Kaspi product
    product = Product(
        sku=sku,
        model=item['name'],
        brand=item['brand'],
        kaspi_price=item.get('price_initial', 15000) # Default if not provided
    )
    db.add(product)
    
    # Create mapped WB link
    wblink = WbLink(
        product_sku=sku,
        source="wb",
        external_id=str(nm_id),
        price=0,
        delivery_days=0,
        stock_status="unknown",
        quantity=0
    )
    db.add(wblink)

db.commit()


# Now trigger Celery task for each
all_links = db.query(WbLink).all()
for link in all_links:
    print(f"Queueing task for link {link.id} (NM: {link.external_id})...")
    update_wblink_data.delay(link.id)

print(f"Successfully seeded 10 products and queued {len(all_links)} Celery parsing tasks.")
db.close()

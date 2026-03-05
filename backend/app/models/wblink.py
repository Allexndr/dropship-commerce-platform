from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class WbLink(Base):
    """
    Represents a Wildberries NM_ID linked to a Kaspi SKU.
    """
    __tablename__ = "wb_links"

    id = Column(Integer, primary_key=True, index=True)
    product_sku = Column(String, ForeignKey("products.sku"), nullable=False)
    
    source = Column(String, default="wb") # "wb" or "ozon"
    external_id = Column(String, nullable=False, index=True) # WB nm_id or Ozon item_id
    
    # Data synced from parser
    price = Column(Float, default=0.0)
    delivery_days = Column(Integer, default=0)
    stock_status = Column(String, default="unknown") # "ok", "out_of_stock", "not_found"
    quantity = Column(Integer, default=0)
    
    last_parsed_at = Column(DateTime(timezone=True), nullable=True)

    product = relationship("Product", back_populates="links")

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Product(Base):
    """
    Represents a Kaspi SKU (The master product).
    """
    __tablename__ = "products"

    sku = Column(String, primary_key=True, index=True) # e.g. "1234567"
    name = Column(String, nullable=False)
    brand = Column(String, default="Unknown")
    kaspi_link = Column(String, nullable=True) # Link to Kaspi card
    wb_price = Column(Float, default=0.0) # Used for keeping track of WB prices directly sometimes
    kaspi_price = Column(Float, default=0.0) # Current selling price on Kaspi
    mid_price = Column(Float, default=0.0) # Calculated Price mid
    delivery_cost = Column(Float, default=0.0) # Fixed cost for delivery (just tracking)
    delivery_days = Column(Integer, default=0) # delivery_mid
    stock = Column(Integer, default=0) # quantity
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=True)
    
    status = Column(String, default="active") # "active", "archived", "error"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # One Kaspi Product can have multiple Wildberries/Ozon links
    links = relationship("WbLink", back_populates="product", cascade="all, delete-orphan")
    shop = relationship("Shop", back_populates="products")

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Product(Base):
    """
    Represents a Kaspi SKU (The master product).
    """
    __tablename__ = "products"

    sku = Column(String, primary_key=True, index=True) # e.g. "1234567"
    model = Column(String, nullable=False)
    brand = Column(String)
    kaspi_price = Column(Float, default=0.0) # Current selling price on Kaspi
    status = Column(String, default="active") # "active", "archived", "error"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # One Kaspi Product can have multiple Wildberries/Ozon links
    links = relationship("WbLink", back_populates="product", cascade="all, delete-orphan")

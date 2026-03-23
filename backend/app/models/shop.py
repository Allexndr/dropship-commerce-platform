from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Shop(Base):
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    custom_shop_id = Column(String, nullable=True) # Отображаемый ID магазина
    kaspi_token = Column(String, nullable=True)    # Kaspi API Token (X-Auth-Token)
    
    # Правила наценки (JSON массив объектов {"min": x, "max": y, "percent": z})
    percentage_rules = Column(String, nullable=True) 
    
    # Правила стоимости доставки (JSON массив объектов {"min": x, "max": y, "price": z})
    delivery_price_rules = Column(String, nullable=True)
    
    delivery_plus = Column(Integer, default=0)  # DeliveryPLUS (доп. дни к доставке)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    users = relationship("User", back_populates="shop")
    products = relationship("Product", back_populates="shop")

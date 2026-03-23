from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from passlib.context import CryptContext

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, PasswordChange

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.get("/", response_model=List[UserResponse])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user.password)
    user_data = user.model_dump()
    user_data.pop("password")
    
    db_user = User(**user_data, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/change-password")
def change_password(data: PasswordChange, db: Session = Depends(get_db)):
    # This is a simplified version without real Auth checks for now as per current state
    user = db.query(User).filter(User.role == "admin").first() 
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not pwd_context.verify(data.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    user.hashed_password = pwd_context.hash(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

@router.post("/reset-password")
def reset_password(email: str):
    # Mock password reset
    return {"message": f"Reset link sent to {email}"}

@router.get("/template")
def download_template():
    # Mock template download info
    return {"message": "Template .xlsx logic would go here"}

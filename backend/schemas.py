from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import JobStatus

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    access_token: str
    
    class Config:
        from_attributes = True

# Job schemas
class JobCreate(BaseModel):
    use_premium: bool = False

class JobResponse(BaseModel):
    id: str
    filename: str
    status: JobStatus
    use_premium: bool
    created_at: datetime
    processed_file_url: Optional[str] = None
    error_message: Optional[str] = None
    
    class Config:
        from_attributes = True

# Payment schemas
class PaymentCreate(BaseModel):
    amount: float
    currency: str = "usd"

class PaymentResponse(BaseModel):
    id: str
    amount: float
    currency: str
    status: str
    client_secret: str
    
    class Config:
        from_attributes = True

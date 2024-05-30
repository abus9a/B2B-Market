from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    company_name: Optional[str] = None
    password: str
    role: UserRole


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenRefresh(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    company_name: Optional[str]
    role: UserRole
    avatar_url: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

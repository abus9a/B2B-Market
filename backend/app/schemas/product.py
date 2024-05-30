from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    category: str = Field(..., min_length=2, max_length=100)
    price: float = Field(..., gt=0)
    stock: int = Field(..., ge=0)
    images: List[str] = []
    specs: Dict[str, Any] = {}


class ProductUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)
    images: Optional[List[str]] = None
    specs: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class SellerOut(BaseModel):
    id: int
    full_name: str
    company_name: Optional[str]

    model_config = {"from_attributes": True}


class ProductOut(BaseModel):
    id: int
    seller_id: int
    title: str
    description: str
    category: str
    price: float
    stock: int
    images: List[str]
    specs: Dict[str, Any]
    is_active: bool
    view_count: int
    inquiry_count: int
    created_at: datetime
    seller: Optional[SellerOut] = None

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    items: List[ProductOut]
    total: int
    page: int
    page_size: int
    pages: int

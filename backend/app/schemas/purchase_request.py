from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.models.purchase_request import RequestStatus


class PurchaseRequestCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., ge=1)
    message: Optional[str] = None


class QuoteUpdate(BaseModel):
    quoted_price: float = Field(..., gt=0)
    status: RequestStatus


class PurchaseRequestOut(BaseModel):
    id: int
    buyer_id: int
    seller_id: int
    product_id: int
    quantity: int
    message: Optional[str]
    quoted_price: Optional[float]
    status: RequestStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

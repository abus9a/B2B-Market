from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    product_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    id: int
    product_id: int
    reviewer_id: int
    rating: int
    comment: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

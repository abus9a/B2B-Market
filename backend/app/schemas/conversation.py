from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from app.schemas.user import UserOut


class MessageCreate(BaseModel):
    content: str


class MessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: int
    buyer_id: int
    seller_id: int
    created_at: datetime
    last_message_at: Optional[datetime]
    buyer: Optional[UserOut] = None
    seller: Optional[UserOut] = None
    last_message: Optional[MessageOut] = None
    unread_count: int = 0

    model_config = {"from_attributes": True}


class MessagePage(BaseModel):
    items: List[MessageOut]
    total: int
    page: int
    pages: int

from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.favorite import Favorite
    from app.models.review import Review
    from app.models.message import Message


class UserRole(str, enum.Enum):
    SELLER = "SELLER"
    BUYER = "BUYER"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    company_name: Mapped[Optional[str]] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    products: Mapped[List["Product"]] = relationship(back_populates="seller", lazy="select")
    favorites: Mapped[List["Favorite"]] = relationship(back_populates="user", lazy="select")
    reviews_given: Mapped[List["Review"]] = relationship(
        back_populates="reviewer", foreign_keys="Review.reviewer_id", lazy="select"
    )
    sent_messages: Mapped[List["Message"]] = relationship(
        back_populates="sender", foreign_keys="Message.sender_id", lazy="select"
    )

from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import JSON, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.price_snapshot import PriceSnapshot
    from app.models.favorite import Favorite
    from app.models.review import Review
    from app.models.purchase_request import PurchaseRequest


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    seller_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(100), index=True)
    price: Mapped[float] = mapped_column(Numeric(12, 2))
    stock: Mapped[int] = mapped_column(Integer, default=0)
    images: Mapped[list] = mapped_column(JSON, default=list)
    specs: Mapped[dict] = mapped_column(JSON, default=dict)
    is_active: Mapped[bool] = mapped_column(default=True)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    inquiry_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    seller: Mapped["User"] = relationship(back_populates="products")
    price_snapshots: Mapped[List["PriceSnapshot"]] = relationship(back_populates="product", lazy="select")
    favorites: Mapped[List["Favorite"]] = relationship(back_populates="product", lazy="select")
    reviews: Mapped[List["Review"]] = relationship(back_populates="product", lazy="select")
    purchase_requests: Mapped[List["PurchaseRequest"]] = relationship(back_populates="product", lazy="select")

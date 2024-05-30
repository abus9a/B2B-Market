from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_seller
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductCreate, ProductListResponse, ProductOut, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=ProductListResponse)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    seller_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Product).options(selectinload(Product.seller)).where(Product.is_active == True)

    if category:
        q = q.where(Product.category == category)
    if search:
        q = q.where(
            or_(Product.title.ilike(f"%{search}%"), Product.description.ilike(f"%{search}%"))
        )
    if min_price is not None:
        q = q.where(Product.price >= min_price)
    if max_price is not None:
        q = q.where(Product.price <= max_price)
    if seller_id:
        q = q.where(Product.seller_id == seller_id)

    total_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar_one()

    q = q.order_by(Product.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    items = result.scalars().all()

    return ProductListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=-(-total // page_size),
    )


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    body: ProductCreate,
    seller: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
):
    product = Product(**body.model_dump(), seller_id=seller.id)
    db.add(product)
    await db.commit()
    await db.refresh(product, ["seller"])
    return product


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).options(selectinload(Product.seller)).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.view_count += 1
    await db.commit()
    return product


@router.patch("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: int,
    body: ProductUpdate,
    seller: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).options(selectinload(Product.seller)).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product or product.seller_id != seller.id:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(product, field, value)

    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    seller: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product or product.seller_id != seller.id:
        raise HTTPException(status_code=404, detail="Product not found")

    await db.delete(product)
    await db.commit()

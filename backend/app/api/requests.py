from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.product import Product
from app.models.purchase_request import PurchaseRequest
from app.models.user import User
from app.schemas.purchase_request import PurchaseRequestCreate, PurchaseRequestOut, QuoteUpdate

router = APIRouter(prefix="/requests", tags=["requests"])


@router.post("", response_model=PurchaseRequestOut, status_code=status.HTTP_201_CREATED)
async def create_request(
    body: PurchaseRequestCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != "BUYER":
        raise HTTPException(status_code=403, detail="Only buyers can create requests")

    prod = await db.execute(select(Product).where(Product.id == body.product_id))
    product = prod.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    req = PurchaseRequest(
        buyer_id=user.id,
        seller_id=product.seller_id,
        **body.model_dump(),
    )
    db.add(req)
    product.inquiry_count += 1
    await db.commit()
    await db.refresh(req)
    return req


@router.get("", response_model=list[PurchaseRequestOut])
async def list_requests(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role == "SELLER":
        clause = PurchaseRequest.seller_id == user.id
    else:
        clause = PurchaseRequest.buyer_id == user.id

    result = await db.execute(
        select(PurchaseRequest).where(clause).order_by(PurchaseRequest.created_at.desc())
    )
    return result.scalars().all()


@router.patch("/{request_id}", response_model=PurchaseRequestOut)
async def update_request(
    request_id: int,
    body: QuoteUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(PurchaseRequest).where(PurchaseRequest.id == request_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if user.role == "SELLER" and req.seller_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if user.role == "BUYER" and req.buyer_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    req.quoted_price = body.quoted_price
    req.status = body.status
    await db.commit()
    await db.refresh(req)
    return req

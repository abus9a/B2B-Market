import statistics
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.price_snapshot import PriceSnapshot
from app.models.product import Product
from app.models.user import User
from app.schemas.analytics import (
    DealScore,
    HistogramBin,
    MarketAnalysis,
    MarketStats,
    PriceTrendPoint,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/market/{category}", response_model=MarketAnalysis)
async def market_analysis(
    category: str,
    product_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product.price).where(Product.category == category, Product.is_active == True)
    )
    prices = [float(r) for r in result.scalars().all()]

    if not prices:
        prices = [0.0]

    avg = statistics.mean(prices)
    median = statistics.median(prices)
    min_p = min(prices)
    max_p = max(prices)
    std = statistics.pstdev(prices) if len(prices) > 1 else 0.0

    bins = 10
    bin_width = (max_p - min_p) / bins if max_p > min_p else 1.0
    histogram = []
    for i in range(bins):
        start = min_p + i * bin_width
        end = start + bin_width
        count = sum(1 for p in prices if start <= p < end)
        histogram.append(HistogramBin(range_start=round(start, 2), range_end=round(end, 2), count=count))

    trend_result = await db.execute(
        select(
            func.date_trunc("day", PriceSnapshot.recorded_at).label("day"),
            func.avg(PriceSnapshot.price).label("avg_price"),
            func.count().label("cnt"),
        )
        .where(
            PriceSnapshot.category == category,
            PriceSnapshot.recorded_at >= datetime.now(timezone.utc) - timedelta(days=30),
        )
        .group_by("day")
        .order_by("day")
    )
    trend = [
        PriceTrendPoint(date=str(row.day.date()), avg_price=round(float(row.avg_price), 2), product_count=row.cnt)
        for row in trend_result
    ]

    deal_score = None
    if product_id:
        prod_result = await db.execute(select(Product.price).where(Product.id == product_id))
        prod_price_row = prod_result.scalar_one_or_none()
        if prod_price_row is not None:
            prod_price = float(prod_price_row)
            diff_pct = ((prod_price - avg) / avg * 100) if avg else 0.0
            score = max(0.0, min(100.0, 50 - diff_pct))
            if score >= 70:
                label = "Great Deal"
            elif score >= 40:
                label = "Fair Price"
            else:
                label = "Above Market"
            deal_score = DealScore(
                product_id=product_id,
                score=round(score, 1),
                label=label,
                market_avg=round(avg, 2),
                price_diff_pct=round(diff_pct, 1),
            )

    return MarketAnalysis(
        stats=MarketStats(
            category=category,
            avg_price=round(avg, 2),
            median_price=round(median, 2),
            min_price=round(min_p, 2),
            max_price=round(max_p, 2),
            std_dev=round(std, 2),
            product_count=len(prices),
        ),
        histogram=histogram,
        trend=trend,
        deal_score=deal_score,
    )


@router.get("/seller/dashboard")
async def seller_dashboard(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != "SELLER":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Sellers only")

    result = await db.execute(
        select(
            func.count(Product.id),
            func.sum(Product.view_count),
            func.sum(Product.inquiry_count),
        ).where(Product.seller_id == user.id)
    )
    row = result.one()

    top_result = await db.execute(
        select(Product.id, Product.title, Product.view_count, Product.price)
        .where(Product.seller_id == user.id)
        .order_by(Product.view_count.desc())
        .limit(5)
    )
    top = [{"id": r.id, "title": r.title, "views": r.view_count, "price": float(r.price)} for r in top_result]

    return {
        "total_products": row[0] or 0,
        "total_views": row[1] or 0,
        "total_inquiries": row[2] or 0,
        "top_products": top,
    }

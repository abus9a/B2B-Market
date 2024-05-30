from typing import List, Optional
from pydantic import BaseModel


class MarketStats(BaseModel):
    category: str
    avg_price: float
    median_price: float
    min_price: float
    max_price: float
    std_dev: float
    product_count: int


class HistogramBin(BaseModel):
    range_start: float
    range_end: float
    count: int


class PriceTrendPoint(BaseModel):
    date: str
    avg_price: float
    product_count: int


class DealScore(BaseModel):
    product_id: int
    score: float
    label: str
    market_avg: float
    price_diff_pct: float


class MarketAnalysis(BaseModel):
    stats: MarketStats
    histogram: List[HistogramBin]
    trend: List[PriceTrendPoint]
    deal_score: Optional[DealScore] = None


class SellerAnalytics(BaseModel):
    total_products: int
    total_views: int
    total_inquiries: int
    total_revenue: float
    top_products: List[dict]
    revenue_trend: List[dict]

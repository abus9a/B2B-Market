"""Seed script: creates sample users, products, price snapshots, conversations."""
import asyncio
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.conversation import Conversation
from app.models.favorite import Favorite
from app.models.message import Message
from app.models.price_snapshot import PriceSnapshot
from app.models.product import Product
from app.models.user import User, UserRole

CATEGORIES = ["Electronics", "Industrial", "Raw Materials", "Textiles", "Chemicals", "Packaging"]

SAMPLE_PRODUCTS = [
    ("Industrial Pump XP-2000", "Electronics", 4500),
    ("Steel Sheet 4mm", "Raw Materials", 120),
    ("Cotton Yarn Grade A", "Textiles", 85),
    ("HDPE Plastic Pellets", "Chemicals", 60),
    ("Corrugated Box 40x30x20", "Packaging", 15),
    ("CNC Router Bit Set", "Industrial", 340),
    ("Copper Wire 2.5mm", "Electronics", 250),
    ("Aluminium Ingot 99.7%", "Raw Materials", 2100),
    ("Polyester Fabric 150gsm", "Textiles", 45),
    ("Solvent Cleaner 20L", "Chemicals", 95),
    ("Bubble Wrap Roll 50m", "Packaging", 32),
    ("Industrial Fan 24\"", "Industrial", 780),
    ("PCB Assembly Board", "Electronics", 1200),
    ("Iron Rod 12mm", "Raw Materials", 89),
    ("Denim Fabric Blue", "Textiles", 68),
]


async def seed(db: AsyncSession):
    # Create sellers
    sellers = []
    for i in range(1, 4):
        seller = User(
            email=f"seller{i}@example.com",
            full_name=f"Seller Company {i}",
            company_name=f"Supplier Co. {i}",
            hashed_password=hash_password("password123"),
            role=UserRole.SELLER,
        )
        db.add(seller)
        sellers.append(seller)

    # Create buyers
    buyers = []
    for i in range(1, 4):
        buyer = User(
            email=f"buyer{i}@example.com",
            full_name=f"Buyer Corp {i}",
            company_name=f"Buyer Inc. {i}",
            hashed_password=hash_password("password123"),
            role=UserRole.BUYER,
        )
        db.add(buyer)
        buyers.append(buyer)

    await db.flush()

    # Create products
    products = []
    for idx, (title, category, base_price) in enumerate(SAMPLE_PRODUCTS):
        seller = sellers[idx % len(sellers)]
        price = base_price * (0.9 + random.random() * 0.2)
        product = Product(
            seller_id=seller.id,
            title=title,
            description=f"High quality {title.lower()} for B2B buyers. Minimum order 10 units.",
            category=category,
            price=round(price, 2),
            stock=random.randint(50, 500),
            images=["https://via.placeholder.com/400"],
            specs={"weight": f"{random.randint(1, 50)}kg", "origin": "Domestic"},
            view_count=random.randint(5, 200),
            inquiry_count=random.randint(0, 30),
        )
        db.add(product)
        products.append((product, category, base_price))

    await db.flush()

    # Price snapshots (30 days history)
    for product, category, base_price in products:
        for days_ago in range(30, 0, -1):
            snap_price = base_price * (0.85 + random.random() * 0.3)
            snap = PriceSnapshot(
                product_id=product.id,
                category=category,
                price=round(snap_price, 2),
                recorded_at=datetime.now(timezone.utc) - timedelta(days=days_ago),
            )
            db.add(snap)

    # Conversations and messages
    for buyer in buyers:
        for seller in sellers[:2]:
            conv = Conversation(buyer_id=buyer.id, seller_id=seller.id)
            db.add(conv)
            await db.flush()

            msgs = [
                (buyer.id, "Hello, I'm interested in your products. What are your bulk prices?"),
                (seller.id, "Hi! Thanks for reaching out. We offer 10% discount on orders over 100 units."),
                (buyer.id, "Great! Can you send a quote for 200 units of your top product?"),
                (seller.id, "Sure, I'll send a formal quote shortly. What delivery timeline do you need?"),
            ]
            last_ts = datetime.now(timezone.utc) - timedelta(hours=4)
            for sender_id, content in msgs:
                last_ts += timedelta(minutes=random.randint(2, 30))
                msg = Message(
                    conversation_id=conv.id,
                    sender_id=sender_id,
                    content=content,
                    created_at=last_ts,
                )
                db.add(msg)
            conv.last_message_at = last_ts

    # Favorites
    for buyer in buyers:
        for product, _, _ in random.sample(products, 3):
            fav = Favorite(user_id=buyer.id, product_id=product.id)
            db.add(fav)

    await db.commit()
    print("Seed complete!")
    print("Sellers: seller1@example.com, seller2@example.com, seller3@example.com (pw: password123)")
    print("Buyers: buyer1@example.com, buyer2@example.com, buyer3@example.com (pw: password123)")


async def main():
    async with AsyncSessionLocal() as db:
        # Skip if already seeded
        from sqlalchemy import text
        result = await db.execute(text("SELECT COUNT(*) FROM users"))
        count = result.scalar()
        if count and count > 0:
            print("Database already seeded, skipping.")
            return
        await seed(db)


if __name__ == "__main__":
    asyncio.run(main())

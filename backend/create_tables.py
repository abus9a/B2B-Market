"""One-shot script to create all tables directly, without alembic."""
import asyncio
from app.core.database import Base, engine
import app.models  # registers all models


async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print("All tables created successfully.")


if __name__ == "__main__":
    asyncio.run(main())

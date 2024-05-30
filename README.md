# B2B Marketplace

A full-stack B2B marketplace connecting **Sellers** and **Buyers** with real-time chat, market analytics, and purchase request management.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| Backend | Python FastAPI, SQLAlchemy 2.0 async |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Real-time | Socket.IO |
| Auth | JWT (access + refresh tokens) |

## Quick Start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

App available at **http://localhost:3000**

Seed users are created automatically:
- Sellers: `seller1@example.com`, `seller2@example.com`, `seller3@example.com`
- Buyers: `buyer1@example.com`, `buyer2@example.com`, `buyer3@example.com`
- Password for all: `password123`

## Local Development

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Start Postgres + Redis (e.g. via Docker)
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=b2b_marketplace postgres:16-alpine
docker run -d -p 6379:6379 redis:7-alpine

# Run migrations
alembic upgrade head

# Seed data
python seed.py

# Start server
uvicorn app.main:asgi_app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend at **http://localhost:3000**, API docs at **http://localhost:8000/docs**

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers (auth, products, chat, analytics...)
│   │   ├── core/         # Config, database, security, dependencies
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   ├── sockets/      # Socket.IO event handlers
│   │   └── main.py       # FastAPI app + Socket.IO mount
│   ├── alembic/          # DB migrations
│   └── seed.py           # Sample data
├── frontend/
│   ├── app/              # Next.js App Router pages
│   │   ├── (auth)/       # Login / Register
│   │   └── (dashboard)/  # All authenticated pages
│   ├── components/       # React components
│   │   ├── ui/           # shadcn primitives
│   │   ├── products/     # Product cards, filters, form
│   │   ├── chat/         # Chat inbox + window
│   │   ├── market/       # Market analysis charts
│   │   └── layout/       # Navbar
│   ├── hooks/            # useAuth, useSocket
│   ├── lib/              # api.ts, socket.ts, utils.ts
│   └── store/            # Zustand (auth, chat)
├── docker-compose.yml
└── .env.example
```

## Features

### Seller
- Dashboard with views/inquiries stats and top products
- Product CRUD (title, description, category, price, stock, images, specs)
- Market analytics: price comparison, distribution histogram, 30-day trend
- Respond to buyer messages via real-time chat
- Manage incoming purchase requests / quotes

### Buyer
- Browse/search/filter products with pagination
- Product detail pages with full market analysis + deal score
- Send quote requests with quantity and message
- Wishlist (add/remove favorites)
- Real-time chat with sellers (typing indicators, read receipts, unread badges)
- Leave reviews/ratings

### Real-time Chat
- Socket.IO with room-per-conversation model
- Typing indicators
- Read receipts (✓ / ✓✓)
- Online presence
- Paginated message history
- Unread message counts in sidebar

### Market Analysis
- Per-category stats: avg, median, min, max, std dev
- Price distribution histogram (Recharts BarChart)
- 30-day price trend line chart
- Deal Score (0–100): rates whether a listing is a "Great Deal", "Fair Price", or "Above Market"

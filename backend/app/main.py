import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, products, conversations, analytics, requests, reviews, favorites
from app.core.config import settings
from app.sockets.chat import sio

app = FastAPI(title=settings.APP_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # wildcard origins require credentials=False; Bearer tokens work fine
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(requests.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(favorites.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# Mount Socket.IO as ASGI sub-app
socket_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path="/socket.io")

# Export for uvicorn
asgi_app = socket_app

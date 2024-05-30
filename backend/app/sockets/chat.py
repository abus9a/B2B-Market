from datetime import datetime, timezone
from typing import Dict, Optional, Set

import socketio
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import decode_token
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)

online_users: Dict[int, Set[str]] = {}


async def _authenticate(token: str) -> Optional[User]:
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        user_id = int(payload["sub"])
    except Exception:
        return None

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()


@sio.event
async def connect(sid: str, environ: dict, auth: Optional[dict]):
    token = (auth or {}).get("token")
    if not token:
        return False

    user = await _authenticate(token)
    if not user:
        return False

    await sio.save_session(sid, {"user_id": user.id, "role": user.role})

    if user.id not in online_users:
        online_users[user.id] = set()
    online_users[user.id].add(sid)

    # Join personal room so recipient always receives messages
    await sio.enter_room(sid, f"user_{user.id}")

    # Auto-join all existing conversation rooms
    async with AsyncSessionLocal() as db:
        if user.role == "SELLER":
            clause = Conversation.seller_id == user.id
        else:
            clause = Conversation.buyer_id == user.id
        result = await db.execute(select(Conversation.id).where(clause))
        for conv_id in result.scalars().all():
            await sio.enter_room(sid, f"conv_{conv_id}")

    await sio.emit("online_status", {"user_id": user.id, "online": True}, skip_sid=sid)
    return True


@sio.event
async def disconnect(sid: str):
    session = await sio.get_session(sid)
    if not session:
        return

    user_id = session["user_id"]
    if user_id in online_users:
        online_users[user_id].discard(sid)
        if not online_users[user_id]:
            del online_users[user_id]
            await sio.emit("online_status", {"user_id": user_id, "online": False})


@sio.event
async def join_conversation(sid: str, data: dict):
    session = await sio.get_session(sid)
    user_id = session["user_id"]
    conv_id = data.get("conversation_id")

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
        conv = result.scalar_one_or_none()
        if not conv or user_id not in (conv.buyer_id, conv.seller_id):
            return

    await sio.enter_room(sid, f"conv_{conv_id}")


@sio.event
async def leave_conversation(sid: str, data: dict):
    conv_id = data.get("conversation_id")
    await sio.leave_room(sid, f"conv_{conv_id}")


@sio.event
async def send_message(sid: str, data: dict):
    session = await sio.get_session(sid)
    user_id = session["user_id"]
    conv_id = data.get("conversation_id")
    content = data.get("content", "").strip()

    if not content or not conv_id:
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
        conv = result.scalar_one_or_none()
        if not conv or user_id not in (conv.buyer_id, conv.seller_id):
            return

        msg = Message(conversation_id=conv_id, sender_id=user_id, content=content)
        db.add(msg)
        conv.last_message_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(msg)

        recipient_id = conv.seller_id if user_id == conv.buyer_id else conv.buyer_id

    msg_data = {
        "id": msg.id,
        "conversation_id": conv_id,
        "sender_id": user_id,
        "content": content,
        "is_read": False,
        "created_at": msg.created_at.isoformat(),
    }

    # Broadcast to everyone in the conversation room
    await sio.emit("new_message", msg_data, room=f"conv_{conv_id}")

    # Also emit to recipient's personal room in case they're not in the conv room yet
    await sio.emit("new_message", msg_data, room=f"user_{recipient_id}", skip_sid=sid)


@sio.event
async def typing(sid: str, data: dict):
    session = await sio.get_session(sid)
    user_id = session["user_id"]
    conv_id = data.get("conversation_id")
    await sio.emit(
        "typing",
        {"user_id": user_id, "conversation_id": conv_id, "is_typing": data.get("is_typing", False)},
        room=f"conv_{conv_id}",
        skip_sid=sid,
    )


@sio.event
async def mark_read(sid: str, data: dict):
    session = await sio.get_session(sid)
    user_id = session["user_id"]
    conv_id = data.get("conversation_id")

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Message).where(
                Message.conversation_id == conv_id,
                Message.sender_id != user_id,
                Message.is_read == False,
            )
        )
        for m in result.scalars().all():
            m.is_read = True
        await db.commit()

    await sio.emit(
        "messages_read",
        {"conversation_id": conv_id, "reader_id": user_id},
        room=f"conv_{conv_id}",
        skip_sid=sid,
    )

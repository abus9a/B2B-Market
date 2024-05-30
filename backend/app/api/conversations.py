from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.schemas.conversation import ConversationOut, MessageCreate, MessageOut, MessagePage

router = APIRouter(prefix="/conversations", tags=["chat"])


async def _get_or_create_conversation(buyer_id: int, seller_id: int, db: AsyncSession) -> Conversation:
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.buyer), selectinload(Conversation.seller))
        .where(Conversation.buyer_id == buyer_id, Conversation.seller_id == seller_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        conv = Conversation(buyer_id=buyer_id, seller_id=seller_id)
        db.add(conv)
        await db.commit()
        await db.refresh(conv, ["buyer", "seller"])
    return conv


@router.get("", response_model=list)
async def list_conversations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role == "SELLER":
        filter_clause = Conversation.seller_id == user.id
    else:
        filter_clause = Conversation.buyer_id == user.id

    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.buyer), selectinload(Conversation.seller))
        .where(filter_clause)
        .order_by(Conversation.last_message_at.desc().nullslast())
    )
    conversations = result.scalars().all()

    out = []
    for conv in conversations:
        last_msg_result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        last_msg = last_msg_result.scalar_one_or_none()

        unread_result = await db.execute(
            select(func.count())
            .select_from(Message)
            .where(Message.conversation_id == conv.id, Message.sender_id != user.id, Message.is_read == False)
        )
        unread_count = unread_result.scalar_one()

        conv_out = ConversationOut.model_validate(conv)
        conv_out.last_message = MessageOut.model_validate(last_msg) if last_msg else None
        conv_out.unread_count = unread_count
        out.append(conv_out.model_dump())

    return out


@router.post("/with-seller/{seller_id}", response_model=ConversationOut)
async def start_conversation(
    seller_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != "BUYER":
        raise HTTPException(status_code=403, detail="Only buyers can initiate conversations")

    seller_result = await db.execute(select(User).where(User.id == seller_id, User.role == "SELLER"))
    if not seller_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Seller not found")

    conv = await _get_or_create_conversation(user.id, seller_id, db)
    return ConversationOut.model_validate(conv)


@router.get("/{conversation_id}/messages", response_model=MessagePage)
async def get_messages(
    conversation_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv_result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = conv_result.scalar_one_or_none()
    if not conv or user.id not in (conv.buyer_id, conv.seller_id):
        raise HTTPException(status_code=404, detail="Conversation not found")

    total_result = await db.execute(
        select(func.count()).select_from(Message).where(Message.conversation_id == conversation_id)
    )
    total = total_result.scalar_one()

    msgs_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    messages = list(reversed(msgs_result.scalars().all()))

    for msg in messages:
        if msg.sender_id != user.id and not msg.is_read:
            msg.is_read = True
    await db.commit()

    return MessagePage(
        items=messages,
        total=total,
        page=page,
        pages=-(-total // page_size),
    )


@router.post("/{conversation_id}/messages", response_model=MessageOut)
async def send_message(
    conversation_id: int,
    body: MessageCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv_result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = conv_result.scalar_one_or_none()
    if not conv or user.id not in (conv.buyer_id, conv.seller_id):
        raise HTTPException(status_code=404, detail="Conversation not found")

    msg = Message(conversation_id=conversation_id, sender_id=user.id, content=body.content)
    db.add(msg)
    conv.last_message_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(msg)

    return msg

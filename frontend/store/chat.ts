"use client";
import { create } from "zustand";

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: number;
  buyer_id: number;
  seller_id: number;
  unread_count: number;
  last_message: Message | null;
  buyer: { id: number; full_name: string } | null;
  seller: { id: number; full_name: string } | null;
}

interface TypingState {
  [conversationId: number]: Set<number>;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: number | null;
  messages: Record<number, Message[]>;
  typing: TypingState;
  onlineUsers: Set<number>;
  setConversations: (convs: Conversation[]) => void;
  setActiveConversation: (id: number | null) => void;
  addMessage: (msg: Message) => void;
  setMessages: (convId: number, msgs: Message[]) => void;
  setTyping: (convId: number, userId: number, isTyping: boolean) => void;
  setUserOnline: (userId: number, online: boolean) => void;
  markRead: (convId: number, userId: number) => void;
  incrementUnread: (convId: number) => void;
  clearUnread: (convId: number) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  typing: {},
  onlineUsers: new Set(),

  setConversations: (convs) => set({ conversations: convs }),
  setActiveConversation: (id) => set({ activeConversationId: id }),

  addMessage: (msg) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [msg.conversation_id]: [...(state.messages[msg.conversation_id] || []), msg],
      },
    })),

  setMessages: (convId, msgs) =>
    set((state) => ({ messages: { ...state.messages, [convId]: msgs } })),

  setTyping: (convId, userId, isTyping) =>
    set((state) => {
      const current = new Set(state.typing[convId] || []);
      if (isTyping) current.add(userId);
      else current.delete(userId);
      return { typing: { ...state.typing, [convId]: current } };
    }),

  setUserOnline: (userId, online) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      if (online) next.add(userId);
      else next.delete(userId);
      return { onlineUsers: next };
    }),

  markRead: (convId, _userId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [convId]: (state.messages[convId] || []).map((m) => ({ ...m, is_read: true })),
      },
    })),

  incrementUnread: (convId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === convId ? { ...c, unread_count: c.unread_count + 1 } : c
      ),
    })),

  clearUnread: (convId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === convId ? { ...c, unread_count: 0 } : c
      ),
    })),
}));

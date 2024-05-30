"use client";
import { useEffect, useRef } from "react";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { useChatStore } from "@/store/chat";
import { useAuthStore } from "@/store/auth";
import { chatApi } from "@/lib/api";

export function useSocket() {
  const user = useAuthStore((s) => s.user);
  const { addMessage, setTyping, setUserOnline, markRead, incrementUnread, setConversations } =
    useChatStore();

  // Ref so event handlers always see the current activeConversationId without stale closure
  const activeConvIdRef = useRef<number | null>(null);
  useChatStore.subscribe((state) => {
    activeConvIdRef.current = state.activeConversationId;
  });

  // Ref to current conversation IDs so we can detect unknown conversations
  const knownConvIdsRef = useRef<Set<number>>(new Set());
  useChatStore.subscribe((state) => {
    knownConvIdsRef.current = new Set(state.conversations.map((c) => c.id));
  });

  useEffect(() => {
    if (!user) return;

    const socket = connectSocket();

    const handleNewMessage = async (msg: any) => {
      addMessage(msg);

      // If this conversation isn't in our list yet, refresh the list
      if (!knownConvIdsRef.current.has(msg.conversation_id)) {
        try {
          const { data } = await chatApi.list();
          setConversations(data);
        } catch {}
      }

      // Increment unread only when not actively viewing that conversation
      if (msg.conversation_id !== activeConvIdRef.current) {
        incrementUnread(msg.conversation_id);
      }
    };

    const handleTyping = ({ user_id, conversation_id, is_typing }: any) => {
      setTyping(conversation_id, user_id, is_typing);
    };

    const handleOnlineStatus = ({ user_id, online }: any) => {
      setUserOnline(user_id, online);
    };

    const handleMessagesRead = ({ conversation_id, reader_id }: any) => {
      markRead(conversation_id, reader_id);
    };

    socket.on("new_message", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("online_status", handleOnlineStatus);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("online_status", handleOnlineStatus);
      socket.off("messages_read", handleMessagesRead);
      disconnectSocket();
    };
  }, [user]);
}

"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/store/auth";
import { useChatStore } from "@/store/chat";
import { chatApi } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";

interface ChatWindowProps {
  conversationId: number;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const user = useAuthStore((s) => s.user);
  const { messages, setMessages, clearUnread, typing, conversations } = useChatStore();
  const [input, setInput] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<NodeJS.Timeout>();

  const conv = conversations.find(c => c.id === conversationId);
  const other = user?.role === "SELLER" ? conv?.buyer : conv?.seller;
  const convMessages = messages[conversationId] || [];
  const typingUsers = typing[conversationId];
  const isOtherTyping = other && typingUsers?.has(other.id);

  useEffect(() => {
    const socket = connectSocket();
    socket.emit("join_conversation", { conversation_id: conversationId });

    chatApi.messages(conversationId, { page: 1, page_size: 30 }).then(({ data }) => {
      setMessages(conversationId, data.items);
      setHasMore(data.page < data.pages);
      setPage(1);
    });
    clearUnread(conversationId);

    return () => {
      socket.emit("leave_conversation", { conversation_id: conversationId });
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convMessages.length]);

  const loadMore = async () => {
    setLoading(true);
    const nextPage = page + 1;
    const { data } = await chatApi.messages(conversationId, { page: nextPage, page_size: 30 });
    setMessages(conversationId, [...data.items, ...convMessages]);
    setHasMore(nextPage < data.pages);
    setPage(nextPage);
    setLoading(false);
  };

  const handleTyping = useCallback(() => {
    const socket = connectSocket();
    socket.emit("typing", { conversation_id: conversationId, is_typing: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("typing", { conversation_id: conversationId, is_typing: false });
    }, 1500);
  }, [conversationId]);

  const send = async () => {
    if (!input.trim()) return;
    const socket = connectSocket();
    socket.emit("send_message", { conversation_id: conversationId, content: input.trim() });
    socket.emit("typing", { conversation_id: conversationId, is_typing: false });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm">
          {other?.full_name?.[0] || "?"}
        </div>
        <span className="font-medium">{other?.full_name || "Unknown"}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {hasMore && (
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={loadMore} disabled={loading}>
              {loading ? "Loading..." : "Load earlier messages"}
            </Button>
          </div>
        )}
        {convMessages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">Start the conversation</p>
        )}
        {convMessages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-2 text-sm",
                  isMine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                )}
              >
                <p>{msg.content}</p>
                <p className={cn("text-xs mt-1", isMine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {formatRelativeTime(msg.created_at)}
                  {isMine && <span className="ml-1">{msg.is_read ? "✓✓" : "✓"}</span>}
                </p>
              </div>
            </div>
          );
        })}
        {isOtherTyping && (
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <span className="animate-pulse">●</span>
            <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>●</span>
            <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>●</span>
            <span className="ml-1">{other?.full_name} is typing...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-4 flex gap-2">
        <Input
          value={input}
          onChange={e => { setInput(e.target.value); handleTyping(); }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button size="icon" onClick={send} disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

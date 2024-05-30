"use client";
import { useAuthStore } from "@/store/auth";
import { useChatStore } from "@/store/chat";
import { formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

interface ChatInboxProps {
  onSelect: (conversationId: number) => void;
  selectedId?: number;
}

export function ChatInbox({ onSelect, selectedId }: ChatInboxProps) {
  const user = useAuthStore((s) => s.user);
  const conversations = useChatStore((s) => s.conversations);
  const onlineUsers = useChatStore((s) => s.onlineUsers);

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
        <MessageSquare className="h-10 w-10 mb-2" />
        <p className="text-sm">No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y overflow-y-auto">
      {conversations.map((conv) => {
        const other = user?.role === "SELLER" ? conv.buyer : conv.seller;
        const isOnline = other && onlineUsers.has(other.id);
        const isSelected = selectedId === conv.id;

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
              isSelected && "bg-muted"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {other?.full_name?.[0] || "?"}
                  </div>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-background" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{other?.full_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {conv.last_message?.content || "No messages yet"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {conv.last_message && (
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(conv.last_message.created_at)}
                  </span>
                )}
                {conv.unread_count > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 p-0 flex items-center justify-center text-xs">
                    {conv.unread_count}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

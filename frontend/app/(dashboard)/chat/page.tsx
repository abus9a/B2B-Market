"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChatInbox } from "@/components/chat/ChatInbox";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { chatApi } from "@/lib/api";
import { useChatStore } from "@/store/chat";

function ChatPageInner() {
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get("conv");

  const [selectedConvId, setSelectedConvId] = useState<number | null>(
    initialConvId ? parseInt(initialConvId) : null
  );
  const setConversations = useChatStore((s) => s.setConversations);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  // Reload conversation list fresh every time this page mounts
  useEffect(() => {
    chatApi.list().then(({ data }) => setConversations(data)).catch(() => {});
  }, []);

  const handleSelect = (id: number) => {
    setSelectedConvId(id);
    setActiveConversation(id);
  };

  // Sync activeConversation with current selection
  useEffect(() => {
    setActiveConversation(selectedConvId);
    return () => setActiveConversation(null);
  }, [selectedConvId]);

  return (
    <div className="h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      <div className="flex gap-4 h-[calc(100%-4rem)]">
        <Card className="w-80 flex-shrink-0 overflow-hidden flex flex-col">
          <div className="p-4 border-b font-medium text-sm">Conversations</div>
          <div className="flex-1 overflow-y-auto">
            <ChatInbox onSelect={handleSelect} selectedId={selectedConvId ?? undefined} />
          </div>
        </Card>
        <Card className="flex-1 overflow-hidden flex flex-col">
          {selectedConvId ? (
            <ChatWindow conversationId={selectedConvId} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-3" />
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  );
}

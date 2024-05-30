"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { Navbar } from "@/components/layout/Navbar";
import { chatApi } from "@/lib/api";
import { useChatStore } from "@/store/chat";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuth();
  const router = useRouter();
  const setConversations = useChatStore((s) => s.setConversations);

  useSocket();

  useEffect(() => {
    if (!initialized) return;
    if (!user) router.replace("/login");
  }, [user, initialized, router]);

  useEffect(() => {
    if (user) {
      chatApi.list().then(({ data }) => setConversations(data)).catch(() => {});
    }
  }, [user, setConversations]);

  if (!initialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

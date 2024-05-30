"use client";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useChatStore } from "@/store/chat";
import { MessageSquare, Package, BarChart3, Heart, ClipboardList, LogOut, Store } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuthStore();
  const conversations = useChatStore((s) => s.conversations);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  if (!user) return null;

  const isSeller = user.role === "SELLER";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href={isSeller ? "/seller/dashboard" : "/buyer/browse"} className="flex items-center gap-2 font-bold text-lg">
          <Store className="h-5 w-5 text-primary" />
          B2B Market
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {isSeller ? (
            <>
              <Link href="/seller/dashboard">
                <Button variant="ghost" size="sm"><BarChart3 className="h-4 w-4 mr-2" />Dashboard</Button>
              </Link>
              <Link href="/seller/products">
                <Button variant="ghost" size="sm"><Package className="h-4 w-4 mr-2" />Products</Button>
              </Link>
              <Link href="/seller/analytics">
                <Button variant="ghost" size="sm"><BarChart3 className="h-4 w-4 mr-2" />Analytics</Button>
              </Link>
              <Link href="/chat" className="relative">
                <Button variant="ghost" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />Messages
                  {totalUnread > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {totalUnread}
                    </Badge>
                  )}
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/buyer/browse">
                <Button variant="ghost" size="sm"><Package className="h-4 w-4 mr-2" />Browse</Button>
              </Link>
              <Link href="/buyer/wishlist">
                <Button variant="ghost" size="sm"><Heart className="h-4 w-4 mr-2" />Wishlist</Button>
              </Link>
              <Link href="/buyer/requests">
                <Button variant="ghost" size="sm"><ClipboardList className="h-4 w-4 mr-2" />Requests</Button>
              </Link>
            </>
          )}
          {!isSeller && (
            <Link href="/chat" className="relative">
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />Chat
                {totalUnread > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {totalUnread}
                  </Badge>
                )}
              </Button>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden md:block">{user.full_name}</span>
          <Badge variant={isSeller ? "default" : "secondary"}>{user.role}</Badge>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

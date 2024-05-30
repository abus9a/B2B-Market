"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";

export function useAuth() {
  const { user, loading, initialized, fetchMe, login, register, logout } = useAuthStore();

  useEffect(() => {
    if (!initialized) fetchMe();
  }, [initialized, fetchMe]);

  return { user, loading, initialized, login, register, logout };
}

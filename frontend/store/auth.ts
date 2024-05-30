"use client";
import { create } from "zustand";
import Cookies from "js-cookie";
import { authApi } from "@/lib/api";

interface User {
  id: number;
  email: string;
  full_name: string;
  company_name: string | null;
  role: "SELLER" | "BUYER";
  avatar_url: string | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: object) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  fetchMe: async () => {
    try {
      const { data } = await authApi.me();
      set({ user: data, initialized: true });
    } catch {
      set({ user: null, initialized: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await authApi.login({ email, password });
      Cookies.set("access_token", data.access_token, { expires: 1 / 48 });
      Cookies.set("refresh_token", data.refresh_token, { expires: 7 });
      const me = await authApi.me();
      set({ user: me.data, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  register: async (formData) => {
    set({ loading: true });
    try {
      const { data } = await authApi.register(formData);
      Cookies.set("access_token", data.access_token, { expires: 1 / 48 });
      Cookies.set("refresh_token", data.refresh_token, { expires: 7 });
      const me = await authApi.me();
      set({ user: me.data, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  logout: () => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    set({ user: null });
    window.location.href = "/login";
  },
}));

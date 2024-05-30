import axios from "axios";
import Cookies from "js-cookie";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = Cookies.get("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, { refresh_token: refresh });
          Cookies.set("access_token", data.access_token, { expires: 1 / 48 });
          Cookies.set("refresh_token", data.refresh_token, { expires: 7 });
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data: object) => api.post("/auth/register", data),
  login: (data: object) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

// Products
export const productsApi = {
  list: (params?: object) => api.get("/products", { params }),
  get: (id: number) => api.get(`/products/${id}`),
  create: (data: object) => api.post("/products", data),
  update: (id: number, data: object) => api.patch(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

// Conversations
export const chatApi = {
  list: () => api.get("/conversations"),
  start: (sellerId: number) => api.post(`/conversations/with-seller/${sellerId}`),
  messages: (convId: number, params?: object) => api.get(`/conversations/${convId}/messages`, { params }),
  send: (convId: number, content: string) => api.post(`/conversations/${convId}/messages`, { content }),
};

// Analytics
export const analyticsApi = {
  market: (category: string, productId?: number) =>
    api.get(`/analytics/market/${category}`, { params: { product_id: productId } }),
  sellerDashboard: () => api.get("/analytics/seller/dashboard"),
};

// Requests
export const requestsApi = {
  list: () => api.get("/requests"),
  create: (data: object) => api.post("/requests", data),
  update: (id: number, data: object) => api.patch(`/requests/${id}`, data),
};

// Reviews
export const reviewsApi = {
  forProduct: (productId: number) => api.get(`/reviews/product/${productId}`),
  create: (data: object) => api.post("/reviews", data),
};

// Favorites
export const favoritesApi = {
  list: () => api.get("/favorites"),
  add: (productId: number) => api.post(`/favorites/${productId}`),
  remove: (productId: number) => api.delete(`/favorites/${productId}`),
};

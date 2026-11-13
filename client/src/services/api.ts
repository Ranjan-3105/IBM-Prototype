import axios from "axios";

export const TOKEN_KEY = "sb_token";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const isAuthCall =
      String(err.config?.url ?? "").startsWith("/auth/login") ||
      String(err.config?.url ?? "").startsWith("/auth/register");

    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY);
      if (!location.pathname.startsWith("/login")) location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

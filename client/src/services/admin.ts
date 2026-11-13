import api from "./api";
import type { AdminStats } from "@/types";

export const adminApi = {
  stats: () => api.get<AdminStats>("/admin/stats").then((r) => r.data),
};

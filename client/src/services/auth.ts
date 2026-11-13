import api from "./api";
import type { OrgType, SessionUser, User } from "@/types";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: "SEEKER" | "ORGANISATION";
  orgType?: OrgType;
}

export const authApi = {
  login: (email: string, password: string) => api.post<{ token: string; user: SessionUser }>("/auth/login", { email, password }).then((r) => r.data),
  register: (input: RegisterInput) => api.post<{ token: string; user: SessionUser }>("/auth/register", input).then((r) => r.data),
  me: () => api.get<User>("/auth/me").then((r) => r.data),
  logout: () => api.post<{ ok: boolean; message: string }>("/auth/logout").then((r) => r.data),
};


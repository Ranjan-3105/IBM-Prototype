import api from "./api";
import type { ExtractResponse, User } from "@/types";

export type ProfileUpdate = Partial<Omit<User, "_id" | "email" | "role" | "stats" | "skills" | "location">> & {
  skills?: { skill: string; level: number; source?: "SELF" | "AI_EXTRACTED" }[];
  location?: { coordinates: [number, number] };
};

export const usersApi = {
  me: () => api.get<User>("/users/me").then((r) => r.data),
  update: (body: ProfileUpdate) => api.put<User>("/users/me", body).then((r) => r.data),
  extractSkills: (text: string) => api.post<ExtractResponse>("/users/me/extract-skills", { text }).then((r) => r.data),
};

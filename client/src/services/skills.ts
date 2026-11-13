import api from "./api";
import type { Skill } from "@/types";

export const skillsApi = {
  all: () => api.get<Skill[]>("/skills").then((r) => r.data),
};

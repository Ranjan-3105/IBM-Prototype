import api from "./api";
import type { AssistantResponse, GapResponse, MatchesResponse } from "@/types";

export const matchesApi = {
  mine: (limit = 10) => api.get<MatchesResponse>("/matches/me", { params: { limit } }).then((r) => r.data),
  gap: (opportunityId: string) => api.get<GapResponse>(`/matches/gap/${opportunityId}`).then((r) => r.data),
  nextOpportunity: (text: string, useSavedProfile = true) =>
    api.post<AssistantResponse>("/assistant/next-opportunity", { text, useSavedProfile }).then((r) => r.data),
};

import api from "./api";
import type { Evidence, EvidenceKind } from "@/types";

export interface EvidenceInput {
  title: string;
  kind: EvidenceKind;
  url?: string;
  description?: string;
  skills: string[];
}

export const evidenceApi = {
  mine: () => api.get<Evidence[]>("/evidence/me").then((r) => r.data),
  create: (body: EvidenceInput) => api.post<Evidence>("/evidence", body).then((r) => r.data),
  remove: (id: string) => api.delete(`/evidence/${id}`),
  endorse: (id: string) => api.post<Evidence>(`/evidence/${id}/endorse`).then((r) => r.data),
};

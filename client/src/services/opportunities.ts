import api from "./api";
import type { AccessTag, Applicant, CompKind, Opportunity, OppType, RequiredSkill } from "@/types";

export interface OpportunityInput {
  title: string;
  description: string;
  type: OppType;
  requiredSkills: RequiredSkill[];
  isRemote: boolean;
  area?: string;
  location?: { coordinates: [number, number] };
  hoursPerWeek: number;
  compensation: { kind: CompKind; amount?: number };
  accessibilityProvided: AccessTag[];
  deadline?: string;
}

export interface OpportunityQuery {
  type?: OppType;
  remote?: "true" | "false";
  near?: string;
  km?: number;
  q?: string;
  skill?: string;
}

export const opportunitiesApi = {
  list: (q: OpportunityQuery = {}) => api.get<Opportunity[]>("/opportunities", { params: q }).then((r) => r.data),
  mine: () => api.get<Opportunity[]>("/opportunities/mine").then((r) => r.data),
  get: (id: string) => api.get<Opportunity>(`/opportunities/${id}`).then((r) => r.data),
  create: (body: OpportunityInput) => api.post<Opportunity>("/opportunities", body).then((r) => r.data),
  update: (id: string, body: Partial<OpportunityInput> & { status?: "OPEN" | "CLOSED" }) => api.patch<Opportunity>(`/opportunities/${id}`, body).then((r) => r.data),
  applicants: (id: string) => api.get<Applicant[]>(`/opportunities/${id}/applications`).then((r) => r.data),
};

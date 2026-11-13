import api from "./api";
import type { Application, AppStatus } from "@/types";

export const applicationsApi = {
  apply: (opportunityId: string, message = "") => api.post<Application>("/applications", { opportunityId, message }).then((r) => r.data),
  mine: () => api.get<Application[]>("/applications/me").then((r) => r.data),
  setStatus: (id: string, status: Exclude<AppStatus, "APPLIED">) => api.patch<Application>(`/applications/${id}/status`, { status }).then((r) => r.data),
};

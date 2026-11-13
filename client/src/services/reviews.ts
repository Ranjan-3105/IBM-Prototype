import api from "./api";

export const reviewsApi = {
  create: (body: { applicationId: string; rating: number; comment: string; verifiedSkills: string[] }) => api.post("/reviews", body).then((r) => r.data),
};

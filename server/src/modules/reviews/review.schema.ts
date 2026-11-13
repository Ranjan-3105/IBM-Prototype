import { z } from "zod";

export const CreateReviewSchema = z.object({
  applicationId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).default(""),
  verifiedSkills: z.array(z.string().trim().min(1)).max(15).default([]),
});

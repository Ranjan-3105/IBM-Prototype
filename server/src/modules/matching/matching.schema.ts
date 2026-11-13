import { z } from "zod";

export const MatchesQuery = z.object({ limit: z.coerce.number().int().min(1).max(50).default(10) });
export const GapParams = z.object({ opportunityId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id") });

import { z } from "zod";

export const NextOpportunitySchema = z.object({
  text: z.string().trim().min(15, "Tell us a bit more (at least one sentence)").max(3000),
  /** Merge with the saved profile (location, accessibility, existing skills). Default true. */
  useSavedProfile: z.boolean().default(true),
});

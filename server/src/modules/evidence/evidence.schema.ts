import { z } from "zod";
import { EVIDENCE_KINDS } from "../common/constants";

export const CreateEvidenceSchema = z.object({
  title: z.string().trim().min(2).max(120),
  kind: z.enum(EVIDENCE_KINDS),
  url: z.union([z.url(), z.literal("")]).optional(),
  description: z.string().trim().max(2000).optional(),
  skills: z.array(z.string().trim().min(1)).min(1, "Tag at least one skill").max(15),
});
export const IdParam = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id") });

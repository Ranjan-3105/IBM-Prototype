import { z } from "zod";
import { SKILL_CATEGORIES } from "../common/constants";

export const SkillQuerySchema = z.object({ q: z.string().trim().max(50).optional() });

export const CreateSkillSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, "slug: lowercase letters, digits and dashes"),
  name: z.string().trim().min(1).max(60),
  category: z.enum(SKILL_CATEGORIES).default("OTHER"),
  aliases: z.array(z.string().trim().min(1)).default([]),
});

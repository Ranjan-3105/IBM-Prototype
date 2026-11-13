import { z } from "zod";
import { ACCESS_TAGS, COMP_KINDS, OPP_TYPES } from "../common/constants";

const lngLat = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);

const base = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
  type: z.enum(OPP_TYPES),
  requiredSkills: z
    .array(
      z.object({
        skill: z.string().trim().min(1),
        minLevel: z.number().int().min(1).max(5).default(2),
        mandatory: z.boolean().default(false),
      })
    )
    .min(1, "Add at least one skill")
    .max(15),
  isRemote: z.boolean().default(false),
  area: z.string().trim().max(80).optional(),
  location: z.object({ coordinates: lngLat }).optional(),
  hoursPerWeek: z.number().min(1).max(60),
  compensation: z.object({
    kind: z.enum(COMP_KINDS),
    amount: z.number().min(0).max(10_000_000).optional(),
  }),
  accessibilityProvided: z.array(z.enum(ACCESS_TAGS)).default([]),
  deadline: z.coerce.date().optional(),
});

export const CreateOpportunitySchema = base;
export const UpdateOpportunitySchema = base
  .partial()
  .extend({ status: z.enum(["OPEN", "CLOSED"]).optional() })
  .strict();

const boolish = z
  .enum(["true", "false"])
  .transform((v) => v === "true")
  .optional();

export const ListOpportunitiesQuery = z.object({
  type: z.enum(OPP_TYPES).optional(),
  remote: boolish,
  near: z.string().optional(), // "lng,lat"
  km: z.coerce.number().min(1).max(200).default(10),
  q: z.string().trim().max(80).optional(),
  skill: z.string().trim().max(40).optional(),
  status: z.enum(["OPEN", "CLOSED", "ALL"]).default("OPEN"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

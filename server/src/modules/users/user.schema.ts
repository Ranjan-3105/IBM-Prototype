import { z } from "zod";
import { ACCESS_TAGS, OPP_TYPES, ORG_TYPES } from "../common/constants";

const lngLat = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);
const optionalUrl = z.union([z.string().url(), z.literal("")]).optional();

/** Seeker profile update — fields allowed for SEEKER role only. */
export const UpdateSeekerProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    headline: z.string().trim().max(140),
    bio: z.string().trim().max(2000),
    photoUrl: optionalUrl,
    education: z.string().trim().max(100),
    college: z.string().trim().max(120),
    locationName: z.string().trim().max(120),
    portfolioUrl: optionalUrl,
    githubUrl: optionalUrl,
    linkedinUrl: optionalUrl,
    skills: z
      .array(
        z.object({
          skill: z.string().trim().min(1),
          level: z.number().int().min(1).max(5),
          // ENDORSED can only be granted by an organisation — never self-granted
          source: z.enum(["SELF", "AI_EXTRACTED"]).optional(),
        })
      )
      .max(60),
    availability: z.object({
      hoursPerWeek: z.number().min(0).max(80),
      remoteOnly: z.boolean(),
      maxTravelKm: z.number().min(1).max(200),
    }),
    preferences: z.object({
      types: z.array(z.enum(OPP_TYPES)),
      paidOnly: z.boolean(),
      workMode: z.enum(["REMOTE", "ONSITE", "HYBRID"]).optional(),
    }),
    accessibilityNeeds: z.array(z.enum(ACCESS_TAGS)),
    area: z.string().trim().max(80),
    city: z.string().trim().max(80),
    location: z.object({ coordinates: lngLat }),
  })
  .partial()
  .strict();

/** Organisation profile update — `verified` is excluded; it is server-only. */
export const UpdateOrgProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(2000),
    orgType: z.enum(ORG_TYPES),
    logoUrl: optionalUrl,
    website: optionalUrl,
    contactEmail: z.string().email().optional().or(z.literal("")),
    locationName: z.string().trim().max(120),
    area: z.string().trim().max(80),
    city: z.string().trim().max(80),
    location: z.object({ coordinates: lngLat }),
  })
  .partial()
  .strict();

/** Legacy combined schema — kept for the existing PUT /api/users/me route until it is replaced. */
export const UpdateMeSchema = UpdateSeekerProfileSchema;

export const ExtractSkillsSchema = z.object({ text: z.string().trim().min(10).max(5000) });

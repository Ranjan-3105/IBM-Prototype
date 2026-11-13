export const ROLES = ["SEEKER", "ORGANISATION", "ADMIN"] as const;
export const OPP_TYPES = ["INTERNSHIP", "PART_TIME", "FREELANCE", "VOLUNTEER", "COMMUNITY_PROJECT"] as const;
export const COMP_KINDS = ["PAID", "STIPEND", "UNPAID"] as const;
export const ACCESS_TAGS = [
  "WHEELCHAIR_ACCESS",
  "SCREEN_READER_FRIENDLY",
  "SIGN_LANGUAGE",
  "FLEXIBLE_HOURS",
  "QUIET_WORKSPACE",
] as const;
export const APP_STATUS = ["APPLIED", "SHORTLISTED", "ACCEPTED", "REJECTED", "COMPLETED"] as const;
export const ORG_TYPES = ["NGO", "SMALL_BUSINESS", "COMMUNITY", "OTHER"] as const;
export const SKILL_SOURCES = ["SELF", "AI_EXTRACTED", "ENDORSED"] as const;
export const SKILL_CATEGORIES = ["FRONTEND", "BACKEND", "DATA", "DESIGN", "MARKETING", "SOFT", "COMMUNITY", "OTHER"] as const;
export const EVIDENCE_KINDS = ["PROJECT", "GITHUB", "PORTFOLIO", "CERTIFICATE", "WORK_SAMPLE"] as const;

export type Role = (typeof ROLES)[number];
export type OppType = (typeof OPP_TYPES)[number];
export type AppStatus = (typeof APP_STATUS)[number];

/** Default location: Bhubaneswar city centre, [lng, lat]. */
export const BBSR: [number, number] = [85.8245, 20.2961];

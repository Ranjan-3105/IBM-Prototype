export const OPP_TYPES = ["INTERNSHIP", "PART_TIME", "FREELANCE", "VOLUNTEER", "COMMUNITY_PROJECT"] as const;
export const COMP_KINDS = ["PAID", "STIPEND", "UNPAID"] as const;
export const ACCESS_TAGS = ["WHEELCHAIR_ACCESS", "SCREEN_READER_FRIENDLY", "SIGN_LANGUAGE", "FLEXIBLE_HOURS", "QUIET_WORKSPACE"] as const;
export const APP_STATUS = ["APPLIED", "SHORTLISTED", "ACCEPTED", "REJECTED", "COMPLETED"] as const;
export const ORG_TYPES = ["NGO", "SMALL_BUSINESS", "COMMUNITY", "OTHER"] as const;
export const EVIDENCE_KINDS = ["PROJECT", "GITHUB", "PORTFOLIO", "CERTIFICATE", "WORK_SAMPLE"] as const;

export type Role = "SEEKER" | "ORGANISATION" | "ADMIN";
export type OppType = (typeof OPP_TYPES)[number];
export type CompKind = (typeof COMP_KINDS)[number];
export type AccessTag = (typeof ACCESS_TAGS)[number];
export type AppStatus = (typeof APP_STATUS)[number];
export type OrgType = (typeof ORG_TYPES)[number];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type SkillSource = "SELF" | "AI_EXTRACTED" | "ENDORSED";

export const ACCESS_LABELS: Record<AccessTag, string> = {
  WHEELCHAIR_ACCESS: "Wheelchair access",
  SCREEN_READER_FRIENDLY: "Screen-reader friendly",
  SIGN_LANGUAGE: "Sign language",
  FLEXIBLE_HOURS: "Flexible hours",
  QUIET_WORKSPACE: "Quiet workspace",
};

/** Bhubaneswar localities used for the location picker, [lng, lat]. */
export const AREAS: Record<string, [number, number]> = {
  Patia: [85.818, 20.354],
  Infocity: [85.809, 20.338],
  Chandrasekharpur: [85.82, 20.33],
  "Jaydev Vihar": [85.818, 20.3],
  Nayapalli: [85.813, 20.293],
  "Saheed Nagar": [85.844, 20.29],
  Rasulgarh: [85.86, 20.295],
  "Unit 4": [85.84, 20.27],
  "Old Town": [85.835, 20.24],
  Khandagiri: [85.78, 20.256],
};

export interface Skill {
  _id: string;
  slug: string;
  name: string;
  category: string;
  aliases: string[];
}

export interface UserSkill {
  skill: string;
  level: number;
  source: SkillSource;
}

export interface GeoPoint {
  type?: "Point";
  coordinates: [number, number];
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  headline?: string;
  bio?: string;
  skills: UserSkill[];
  availability?: { hoursPerWeek: number; remoteOnly: boolean; maxTravelKm: number };
  accessibilityNeeds: AccessTag[];
  preferences?: { types: OppType[]; paidOnly: boolean };
  orgType?: OrgType;
  website?: string;
  city?: string;
  area?: string;
  location?: GeoPoint;
  stats?: { profileStrength: number; evidenceScore: number; evidenceCount: number; endorsedSkills: number } | null;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface OrgSummary {
  _id: string;
  name: string;
  orgType?: OrgType;
  area?: string;
  website?: string;
}

export interface RequiredSkill {
  skill: string;
  minLevel: number;
  mandatory: boolean;
}

export interface Opportunity {
  _id: string;
  organisation: OrgSummary | string;
  title: string;
  description: string;
  type: OppType;
  requiredSkills: RequiredSkill[];
  isRemote: boolean;
  area?: string;
  location?: GeoPoint;
  hoursPerWeek: number;
  compensation: { kind: CompKind; amount?: number };
  accessibilityProvided: AccessTag[];
  status: "OPEN" | "CLOSED";
  deadline?: string;
  createdAt: string;
  applicantCount?: number;
  pendingCount?: number;
}

export interface Breakdown {
  S: number;
  A: number;
  L: number;
  E: number;
  P: number;
}

export interface MissingSkill {
  skill: string;
  needed: number;
  have: number;
  mandatory: boolean;
}

export interface MatchResult {
  opportunityId: string;
  eligible: boolean;
  blockers: string[];
  score: number;
  breakdown: Breakdown;
  matchedSkills: string[];
  missingSkills: MissingSkill[];
  distanceKm: number | null;
}

export interface RankedMatch extends MatchResult {
  opportunity: Opportunity;
  explanation?: string;
  explanationSource?: "AI" | "TEMPLATE";
}

export interface MatchesResponse {
  matches: RankedMatch[];
  nearMisses: RankedMatch[];
  evaluated: number;
  eligibleCount: number;
  keywordBaseline: number;
  ms: number;
}

export interface GapResponse {
  opportunity: Opportunity;
  result: MatchResult;
  alternatives: { opportunityId: string; title: string; score: number; type: OppType; isRemote: boolean }[];
  analysis: { summary: string; learnNext: { skill: string; why: string; firstStep: string }[]; source: "AI" | "TEMPLATE" };
}

export interface ExtractedSkill {
  skill: string;
  name: string;
  level: number;
  evidence: string | null;
}

export interface ExtractResponse {
  skills: ExtractedSkill[];
  unknown: string[];
  hoursPerWeek: number | null;
  remoteOnly: boolean | null;
  preferredTypes: OppType[];
  source: "AI" | "FALLBACK";
}

export interface AssistantResponse {
  profile: {
    skills: (UserSkill & { name: string; evidence: string | null })[];
    extracted: ExtractedSkill[];
    hoursPerWeek: number;
    remoteOnly: boolean;
    preferredTypes: OppType[];
    source: "AI" | "FALLBACK";
  };
  top3: RankedMatch[];
  nearMisses: (MatchResult & { opportunity: { _id: string; title: string; type: OppType } })[];
  nextStep: { skill: string | null; name: string; text: string; unlocks: string[] };
  evaluated: number;
  ms: number;
}

export interface Evidence {
  _id: string;
  user: string;
  title: string;
  kind: EvidenceKind;
  url?: string;
  description?: string;
  skills: string[];
  endorsedBy?: OrgSummary | string;
  endorsedAt?: string;
  createdAt: string;
}

export interface Application {
  _id: string;
  opportunity: Opportunity;
  applicant: string;
  matchScore: number;
  breakdown?: Breakdown;
  message: string;
  status: AppStatus;
  history: { status: AppStatus; at: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Applicant {
  _id: string;
  opportunity: string;
  applicant: Pick<User, "_id" | "name" | "email" | "headline" | "area" | "skills" | "availability" | "accessibilityNeeds"> | null;
  matchScore: number;
  message: string;
  status: AppStatus;
  history: { status: AppStatus; at: string }[];
  evidence: Evidence[];
  match: MatchResult | null;
  review: { rating: number; comment: string; verifiedSkills: string[] } | null;
  createdAt: string;
}

export interface AdminStats {
  users: Record<string, number>;
  opportunities: { byType: Record<string, number>; byStatus: Record<string, number> };
  applications: Record<string, number>;
  matching: {
    seekers: number;
    openOpportunities: number;
    pairsEvaluated: number;
    evalMs: number;
    matchRate: number;
    keywordMatchRate: number;
    avgEligiblePerSeeker: number;
    avgKeywordPerSeeker: number;
  };
  topDemand: { skill: string; name: string; demand: number; supply: number }[];
  aiEnabled: boolean;
}

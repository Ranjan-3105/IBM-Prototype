# SkillBridge API contract

Base URL: `/api` · JSON only · auth via `Authorization: Bearer <JWT>` (7-day expiry).
Errors always look like `{ "message": string, "issues"?: ZodIssue[] }` with a matching status
(400 validation, 401 no/invalid token, 403 wrong role or not owner, 404, 409 duplicate, 500).

| Method | Endpoint | Role | Body / query | Response |
|---|---|---|---|---|
| GET | `/health` | public | — | `{ ok, ai: "gemini" \| "fallback", uptime, timestamp }` (liveness) |
| GET | `/ready` | public | — | `{ ok, db: "connected" \| "disconnected", ai, uptime, timestamp }` (readiness; 200 if connected, 503 if not) |
| POST | `/auth/register` | public | `{ name, email, password(≥8), role: SEEKER\|ORGANISATION, orgType? }` (orgType required for orgs) | `201 { token, user: { id, name, email, role } }` |
| POST | `/auth/login` | public | `{ email, password }` | `{ token, user }` |
| POST | `/auth/logout` | public | — | `{ ok, message, stateless: true }` (stateless logout instruction) |
| GET | `/auth/me` | any | — | `User` (never includes passwordHash) |
| GET | `/users/me` | any | — | `User & { stats: { profileStrength, evidenceScore, evidenceCount, endorsedSkills } \| null }` |
| PUT | `/users/me` | any | partial seeker profile body (see PATCH /users/me) | same as GET — legacy, still supported |
| PATCH | `/users/me` | SEEKER | partial `{ name, headline, bio, photoUrl, education, college, locationName, portfolioUrl, githubUrl, linkedinUrl, skills[{skill, level 1–5, source?: SELF\|AI_EXTRACTED}], availability{hoursPerWeek, remoteOnly, maxTravelKm}, preferences{types[], paidOnly, workMode?: REMOTE\|ONSITE\|HYBRID}, accessibilityNeeds[], area, city, location{coordinates:[lng,lat]} }` | same as GET. Skills are normalised to slugs; unknown skills → 400. ENDORSED status preserved. `verified` is rejected (strict schema). |
| POST | `/users/me/skills` | SEEKER | `{ skill, level 1–5, source?: SELF\|AI_EXTRACTED }` | `201` updated User profile. 400 unknown skill, 409 duplicate. |
| PATCH | `/users/me/skills/:slug` | SEEKER | `{ level?, source? }` | updated User profile. 404 if slug not in profile. Cannot change ENDORSED source. |
| DELETE | `/users/me/skills/:slug` | SEEKER | — | `204`. 404 if slug not in profile. |
| POST | `/users/me/extract-skills` | SEEKER | `{ text }` | `{ skills[{skill, name, level, evidence}], unknown[], hoursPerWeek, remoteOnly, preferredTypes[], source: AI\|FALLBACK }` — suggestions only, nothing saved |
| GET | `/organisations/me` | ORGANISATION | — | `User` (org profile; `verified` is read-only) |
| PATCH | `/organisations/me` | ORGANISATION | partial `{ name, description, orgType, logoUrl, website, contactEmail, locationName, area, city, location{coordinates:[lng,lat]} }` | updated User. `verified` is rejected (strict schema). |
| GET | `/skills?q=` | public | `q` optional | `Skill[]` (catalogue / autocomplete) |
| POST | `/skills` | ADMIN | `{ slug, name, category, aliases[] }` | `201 Skill` (refreshes normalisation cache) |
| POST | `/evidence` | SEEKER | `{ title, kind, url?, description?, skills[] }` | `201 Evidence` |
| GET | `/evidence/me` | SEEKER | — | `Evidence[]` (endorsedBy populated) |
| DELETE | `/evidence/:id` | SEEKER (owner) | — | `204` |
| POST | `/evidence/:id/endorse` | ORGANISATION | — | `Evidence`. Allowed only if the evidence owner has an ACCEPTED/COMPLETED application to one of this org's opportunities. Marks the evidence's skills ENDORSED on the seeker. |
| POST | `/opportunities` | ORGANISATION | `{ title, description, type, requiredSkills[{skill, minLevel, mandatory}], isRemote, area?, location?{coordinates}, hoursPerWeek, compensation{kind, amount?}, accessibilityProvided[], deadline? }` | `201 Opportunity` (location defaults to the org's) |
| GET | `/opportunities?type=&remote=&near=lng,lat&km=&q=&skill=&status=` | public | geo filter uses `$geoWithin + $centerSphere`, remote roles always included | `Opportunity[]` (organisation populated) |
| GET | `/opportunities/mine` | ORGANISATION | — | `Opportunity & { applicantCount, pendingCount }[]` |
| GET | `/opportunities/:id` | public | — | `Opportunity` |
| PATCH | `/opportunities/:id` | ORGANISATION (owner) | partial create body + `status: OPEN\|CLOSED` | `Opportunity` |
| GET | `/opportunities/:id/applications` | ORGANISATION (owner) | — | applicants ranked by **live** match score: `{ ...Application, applicant, evidence[], match: MatchResult, review }[]` |
| GET | `/matches/me?limit=10` | SEEKER | — | `{ matches: (MatchResult & { opportunity, explanation, explanationSource })[], nearMisses[], evaluated, eligibleCount, keywordBaseline, ms }` |
| GET | `/matches/gap/:opportunityId` | SEEKER | — | `{ opportunity, result: MatchResult, alternatives[{opportunityId, title, score, type, isRemote}], analysis: { summary, learnNext[{skill, why, firstStep}], source } }` |
| POST | `/assistant/next-opportunity` | SEEKER | `{ text, useSavedProfile?: boolean = true }` | `{ profile{skills[], extracted[], hoursPerWeek, remoteOnly, preferredTypes, source}, top3[], nearMisses[], nextStep{skill, name, text, unlocks[]}, evaluated, ms }` |
| POST | `/applications` | SEEKER | `{ opportunityId, message? }` | `201 Application` with `matchScore` + `breakdown` snapshot. 409 if already applied, 400 if closed. |
| GET | `/applications/me` | SEEKER | — | `Application[]` (opportunity + organisation populated) |
| PATCH | `/applications/:id/status` | ORGANISATION (owner) | `{ status: SHORTLISTED\|ACCEPTED\|REJECTED\|COMPLETED }` | `Application`. Allowed transitions: APPLIED→SHORTLISTED/ACCEPTED/REJECTED, SHORTLISTED→ACCEPTED/REJECTED, ACCEPTED→COMPLETED/REJECTED. History is appended. |
| POST | `/reviews` | ORGANISATION (owner) | `{ applicationId, rating 1–5, comment?, verifiedSkills[] }` | `201 Review`. Application must be ACCEPTED/COMPLETED; one review per application; verified skills become ENDORSED. |
| GET | `/reviews/me` | SEEKER | — | reviews about me |
| GET | `/admin/stats` | ADMIN | — | `{ users, opportunities{byType, byStatus}, applications, matching{seekers, openOpportunities, pairsEvaluated, evalMs, matchRate, keywordMatchRate, avgEligiblePerSeeker, avgKeywordPerSeeker}, topDemand[{skill, name, demand, supply}], aiEnabled }` |

## MatchResult

```ts
{
  opportunityId: string;
  eligible: boolean;          // passed every hard filter
  blockers: string[];         // why not eligible
  score: number;              // 0–100, M = 0.40S + 0.20A + 0.15L + 0.15E + 0.10P
  breakdown: { S; A; L; E; P }; // each 0–100
  matchedSkills: string[];    // slugs
  missingSkills: { skill; needed; have; mandatory }[];
  distanceKm: number | null;
}
```

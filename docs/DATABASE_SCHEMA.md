# SkillBridge database schema (MongoDB + Mongoose)

Seven collections. Locations are GeoJSON points `[lng, lat]` (default: Bhubaneswar `[85.8245, 20.2961]`).
Skills are always stored as catalogue **slugs**.

| Collection | Key fields | Indexes |
|---|---|---|
| **users** | `name`, `email` (unique, lowercase), `passwordHash` (select:false, stripped from JSON), `role` SEEKER/ORGANISATION/ADMIN, `headline`, `bio`, `photoUrl`, `education`, `college`, `locationName`, `portfolioUrl`, `githubUrl`, `linkedinUrl` (all optional strings — seeker), `skills[{skill, level 1–5, source SELF/AI_EXTRACTED/ENDORSED}]`, `availability{hoursPerWeek, remoteOnly, maxTravelKm}`, `accessibilityNeeds[]`, `preferences{types[], paidOnly, workMode REMOTE/ONSITE/HYBRID}`, `orgType`, `website`, `description`, `logoUrl`, `contactEmail` (org), `verified` (boolean, default false — read-only via public API, managed by admin workflows only), `city`, `area`, `location` | `email` unique, `location` 2dsphere |
| **skills** | `slug` (unique), `name`, `category`, `aliases[]` | `slug` unique |
| **opportunities** | `organisation`→User, `title`, `description`, `type`, `requiredSkills[{skill, minLevel, mandatory}]`, `isRemote`, `area`, `location`, `hoursPerWeek`, `compensation{kind PAID/STIPEND/UNPAID, amount}`, `accessibilityProvided[]`, `status` OPEN/CLOSED, `deadline` | `location` 2dsphere, `{status, type}`, `organisation` |
| **applications** | `opportunity`, `applicant`, `matchScore` + `breakdown` (snapshot at apply time), `message`, `status`, `history[{status, at}]` | `{opportunity, applicant}` unique |
| **skillevidences** | `user`, `title`, `kind` PROJECT/GITHUB/PORTFOLIO/CERTIFICATE/WORK_SAMPLE, `url`, `description`, `skills[]`, `endorsedBy`→User, `endorsedAt` | `user` |
| **matches** (cache) | `user`, `opportunity`, `score`, `breakdown`, `matchedSkills`, `missingSkills`, `explanation`, `explanationSource` AI/TEMPLATE, `fingerprint`, `computedAt` | `{user, opportunity}` unique |
| **reviews** | `application` (unique), `reviewer`, `reviewee`, `rating 1–5`, `comment`, `verifiedSkills[]` | `application` unique, `reviewee` |

The **matches** collection only caches explanations. Scores are always recomputed by `engine.ts`;
the cache is reused only while the `fingerprint` (score, breakdown, skills, distance, title) is unchanged.

Constants live in `server/src/modules/common/constants.ts`; the skill catalogue (42 skills with aliases)
in `server/src/modules/skills/catalogue.ts`. The catalogue is auto-inserted on server start if the
collection is empty.

> **Organisation verification** (`verified` field) defaults to `false` on registration and can only
> be set to `true` by an ADMIN. It is intentionally excluded from the `PATCH /api/organisations/me`
> schema (Zod `.strict()` rejects it with 400 if supplied by the client).

# SkillBridge architecture

```
React (Vite + TS, Tailwind v4)  ── REST/JSON + JWT ──►  Express 5 + TS (modular monolith)  ──►  MongoDB
  seeker · organisation · admin                         auth users skills evidence opportunities
  dashboards + assistant                                matching applications reviews assistant admin
                                                        services/ai.service.ts ──► Gemini (optional)
```

## Server layout

`server/src/modules/<name>/` holds `<name>.model.ts`, `.schema.ts` (zod), `.service.ts`,
`.controller.ts` and `.routes.ts`. Controllers validate input with zod and call services; services
throw `HttpError(status, msg)`; `middleware/errorHandler.ts` turns zod, cast, duplicate-key and
HttpErrors into `{ message, issues? }`. Express 5 forwards async errors automatically.

## Hybrid matching (the core rule: the LLM never decides who matches)

`modules/matching/engine.ts` is pure TypeScript with no I/O:

1. **Hard filters** → `blockers[]`: hours < 50% of required, on-site vs remote-only, distance >
   `maxTravelKm` (haversine), paid-only vs unpaid, unmet accessibility need on an on-site role,
   missing mandatory skill.
2. **Weighted score** `M = 0.40·S + 0.20·A + 0.15·L + 0.15·E + 0.10·P`
   - S: skill coverage, mandatory skills weighted ×2, partial credit `have/minLevel`
   - A: `min(hours / required, 1)`
   - L: 100 if remote, else `1 − distance/maxKm` (50 when location unknown)
   - E: share of required skills backed by evidence or an ENDORSED skill
   - P: type preference (20/40/60) + accessibility fit (0/40)
3. **Explanation**: `ai.service.explainMatch` receives the finished `MatchResult` and only phrases it.

`matching.service.rankForSeeker` evaluates every open opportunity, returns eligible matches, near
misses (ineligible but S ≥ 50), a keyword-only baseline count and the measured time in ms.

## AI service (Gemini via `@google/genai`)

| Function | Fallback when the key is missing, the call times out or returns invalid JSON |
|---|---|
| `extractProfile` (structured JSON, zod-validated) | deterministic catalogue/alias scanner with clause-level level hints, hours/day→week and remote detection |
| `explainMatch` (12 s timeout) | template sentence built from the same facts |
| `analyseGap` (structured JSON) | template summary + "build one small project" first steps |

`GEMINI_API_KEY` is optional: without it the app runs end to end on the fallbacks.

## Client layout

`client/src`: `pages/{auth,seeker,organisation,shared,admin}`, `components/{ui,common,dashboard,opportunities,profile}`,
`services/*` (one axios module per API area), `hooks/` (useAuth, useMe, useSkills, useMatches, useApplications),
`context/AuthContext.tsx`, `routes/index.tsx` (lazy-loaded pages behind `ProtectedRoute`).
`components/ui` holds shadcn-style components (button, card, input, select, badge, progress, dialog, …)
written by hand on top of Tailwind v4 + class-variance-authority, so no registry access is needed.

## Security

- bcrypt (10 rounds) + JWT; `requireAuth` / `requireRole` on every protected route.
- Ownership checks in services (an organisation can't read or change another org's opportunities or applicants).
- `passwordHash` is `select:false` and stripped in `toJSON`.
- Secrets only in `server/.env`; the client only knows `VITE_API_URL`.

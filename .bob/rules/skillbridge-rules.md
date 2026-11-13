# SkillBridge project rules

## Architecture
- Modular monolith. Server modules live in server/src/modules/<name>/ with
  <name>.model.ts, <name>.schema.ts (zod), <name>.service.ts,
  <name>.controller.ts, <name>.routes.ts.
- No microservices, Docker, Redis, Kafka, vector DBs, WebSockets or extra AI providers.
- Do not add new npm packages without stating why in the plan.

## TypeScript
- strict mode on both client and server. No `any` unless justified in a comment.
- Server emits CommonJS: tsconfig uses "module"/"moduleResolution": "NodeNext" with
  package.json "type": "commonjs" (TypeScript 7 removed moduleResolution "Node").
  Imports stay extensionless. Do not add "type": "module".

## API
- All routes are prefixed with /api. JSON only. Follow docs/API_CONTRACT.md exactly.
- Validate every request body/query/params with zod in the controller.
- Errors: { "message": string, "issues"?: [...] } with correct HTTP status codes.
  Throw HttpError(status, message) from services.

## Matching
- Matching scores are computed ONLY by server/src/modules/matching/engine.ts.
- The LLM may extract, explain and suggest — it must never compute or override a score.
- Every AI call must have a timeout and a deterministic fallback.

## Skills
- Skills are always stored as catalogue slugs (e.g. "react", "nodejs", "mongodb").
  Normalise any free-text skill with utils/skills.ts before saving.

## Security
- Secrets only in server/.env. Never put API keys in the client.
- Never return passwordHash. Check roles with requireRole() and ownership in services.

## Frontend
- Use components from @/components/ui. Use TanStack Query for server data.
- Every page must be responsive (mobile + desktop) and have loading, empty and error states.

## Process
- Implement one vertical slice at a time and run the build after each change.
- Never silently delete existing functionality.
- After each feature, append a short entry to docs/IBM_BOB_USAGE.md.
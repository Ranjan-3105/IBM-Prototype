# SkillBridge — Opportunity without barriers

Skill-based opportunity matching for students, local workers, NGOs and small businesses in **Bhubaneswar**.
Hackathon category **02 – More Opportunity, Greater Together** · MERN + TypeScript.

- **Skill DNA**: skills from free text (Gemini, with an offline fallback), levels, evidence and endorsements
- **Explainable matching**: deterministic hard filters plus `M = 0.40S + 0.20A + 0.15L + 0.15E + 0.10P`; the AI only explains
- **Gap Analyzer**: what you have, what's missing, what to learn next, and what you already qualify for
- **Your Next Opportunity**: one sentence → skill profile, top 3 matches and one next step
- **Organisations** post opportunities (location/remote, hours, pay, accessibility), see applicants ranked by match, accept, endorse and review
- **Admin** stats: match rate, matching speed, skills in demand vs supply

The full build guide is in [`docs/BUILD_GUIDE.md`](docs/BUILD_GUIDE.md). Architecture, API contract, schema and
test report are in [`docs/`](docs).

## Run it locally (Windows PowerShell)

Requires Node.js 22+ and a MongoDB connection string (Atlas free tier or local `mongodb://127.0.0.1:27017/skillbridge`).

```powershell
# 1. API
cd server
npm install
copy .env.example .env      # then edit MONGODB_URI, JWT_SECRET (32+ chars), optional GEMINI_API_KEY
npm run seed                # Bhubaneswar demo data (wipes the SkillBridge collections)
npm run dev                 # http://localhost:5000/api/health

# 2. Client (second terminal)
cd client
npm install
copy .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm run dev                 # http://localhost:5173
```

Without `GEMINI_API_KEY` every AI feature uses its deterministic fallback, so the whole demo still works.

### Demo accounts (password `Demo@1234`)

| Role | Email |
|---|---|
| Seeker (student) | `student@demo.skillbridge` |
| Organisation (NGO) | `ngo@demo.skillbridge` |
| Admin | `admin@demo.skillbridge` |
| Seeker (wheelchair user) | `sourav@demo.skillbridge` |

Other seeded logins: `priya@` (remote-only), `manoj@` (paid-only local worker), `sneha@` (designer), `ankit@`, `lipsa@`,
and organisations `green@`, `cafe@`, `boutique@`, `club@`, `library@`, `events@`, `sahaya@` — all `@demo.skillbridge`.

## Scripts

| Where | Command | What |
|---|---|---|
| server | `npm run dev` / `build` / `start` | dev with tsx watch / compile to `dist` / run compiled |
| server | `npm run seed` | reset and seed demo data |
| server | `npm test` | vitest unit tests for the matching engine, normalisation and AI fallbacks |
| client | `npm run dev` / `build` / `lint` | Vite dev server / type-check + production build / ESLint |

## Deploy

- **API → Render**: root `server`, build `npm install --include=dev && npm run build`, start `npm start`,
  env `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `CLIENT_URL=https://<app>.vercel.app`.
- **Client → Vercel**: root `client`, preset Vite, env `VITE_API_URL=https://<api>.onrender.com/api`
  (`client/vercel.json` already has the SPA rewrite).
- **Atlas**: allow `0.0.0.0/0` under Network Access. Run `npm run seed` once against the production URI.

## Notes on deviations from the build guide

- `server/tsconfig.json` uses `"module"/"moduleResolution": "NodeNext"` instead of `CommonJS`/`Node`:
  TypeScript 7 (pinned in package.json) removed `moduleResolution: "Node"`. Output is still CommonJS
  because `package.json` has `"type": "commonjs"`, and imports stay extensionless.
- `GEMINI_API_KEY` is optional (the guide made it required) so the app runs fully on fallbacks.
  `extractProfile` also gets a deterministic fallback, which the guide left without one.
- `components/ui` holds hand-written shadcn-style components rather than CLI-generated ones. You can still
  run `npx shadcn@latest add …` later; the `@/` alias is configured in both tsconfigs.
- Extra, small additions: `/opportunities` browse page with geo filter, organisation profile page,
  `DELETE /evidence/:id`, `GET /reviews/me`, `POST /skills` (admin).

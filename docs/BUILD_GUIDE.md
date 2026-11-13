# SkillBridge — Opportunity without barriers

> **Step-by-step construction guide (README)**
> Hackathon category **02 – More Opportunity, Greater Together** · Stack **MERN + TypeScript** · Built with **IBM Bob**

This README sets out the final plan from our planning discussion and turns it into a build order you can follow from an empty folder to a deployed demo. Earlier options in that discussion (CivicLens, FastAPI, Spring Boot / Spring AI) were dropped. **This document covers only the final choice: SkillBridge on MERN + TypeScript.**

---

## Table of contents

0. [What we are building (and why it wins)](#0-what-we-are-building)
1. [Final stack and versions](#1-final-stack)
2. [Architecture](#2-architecture)
3. [Prerequisites and accounts](#3-prerequisites)
4. [Step 1 – Create the repository](#step-1--create-the-repository)
5. [Step 2 – Set up IBM Bob before writing code](#step-2--set-up-ibm-bob-before-writing-code)
6. [Step 3 – Backend scaffold (Express + TypeScript)](#step-3--backend-scaffold-express--typescript)
7. [Step 4 – Database models (MongoDB + Mongoose)](#step-4--database-models-mongodb--mongoose)
8. [Step 5 – Authentication and roles](#step-5--authentication-and-roles)
9. [Step 6 – Core modules and API contract](#step-6--core-modules-and-api-contract)
10. [Step 7 – The Matching Engine (hybrid scoring)](#step-7--the-matching-engine-hybrid-scoring)
11. [Step 8 – AI service (Gemini): skill extraction, explanations, gap analysis](#step-8--ai-service-gemini)
12. [Step 9 – Frontend scaffold (React + Vite + Tailwind + shadcn/ui)](#step-9--frontend-scaffold)
13. [Step 10 – Frontend pages and flows](#step-10--frontend-pages-and-flows)
14. [Step 11 – Seed demo data (Bhubaneswar)](#step-11--seed-demo-data-bhubaneswar)
15. [Step 12 – Integration, testing and Bob review](#step-12--integration-testing-and-bob-review)
16. [Step 13 – Deployment (Render + Vercel + Atlas)](#step-13--deployment)
17. [Step 14 – Demo script for the judges](#step-14--demo-script-for-the-judges)
18. [IBM Bob workflow — all prompts in one place](#ibm-bob-workflow--all-prompts)
19. [5-day schedule and MVP scope](#5-day-schedule-and-mvp-scope)
20. [Troubleshooting](#troubleshooting)

---

## 0. What we are building

**SkillBridge connects students, local workers, NGOs and small businesses.** People list what they can *actually do*, when they are available, where they are and what they need for access. The platform then matches them with internships, part-time work, freelance gigs, volunteering and community projects.

**The core idea:** we don't only ask what experience someone has. We work out what they can do, what they want to do, and which opportunities they can realistically reach.

### The problem in one picture

| Person | What they have | Why normal job portals fail them |
|---|---|---|
| College student | React, Java, UI skills; no work experience | Filtered out by "experience required" |
| Local NGO | Needs a simple website, no budget | Can't afford recruitment; never posts on job sites |
| Small business | Needs social media help a few hours/week | The work is informal and never reaches job platforms |

### The five features

| # | Feature | What it does |
|---|---|---|
| 1 | **Skill DNA** | A skill profile built from technologies, projects, certificates and demonstrated work. AI pulls skills out of free text, GitHub and portfolio descriptions. |
| 2 | **Opportunity Intelligence Engine** | Hybrid matching on skills, availability, location and accessibility, with a plain-English explanation of each match. |
| 3 | **Opportunity Gap Analyzer** ⭐ | Instead of "Not eligible", it shows what you already have, what's missing, what to learn next and which other roles you already qualify for. |
| 4 | **Local Opportunity Discovery** | NGOs and businesses post opportunities with location/remote status, skills, hours, pay or voluntary status, and accessibility provided. |
| 5 | **Proof of Ability** | Projects, GitHub links and work samples, plus endorsements from organisations, so the profile has a trust layer beyond self-declared skills. |

**Signature demo feature: "Your Next Opportunity".** A user types a sentence such as *"I'm a 2nd-year engineering student, I know Java, React and basic SQL, I can work 2 hours a day, I prefer remote work and I have no experience."* SkillBridge then returns:

- an extracted skill profile,
- the top 3 matching opportunities with match percentages,
- one concrete next step.

### How this maps to the judging criteria

| Criterion | How SkillBridge scores |
|---|---|
| Completeness & Feasibility | A full journey works end to end: profile → match → explanation → apply → organisation reviews |
| Creativity & Innovation | Skill-based (not resume-based) matching, the Gap Analyzer, the "Your Next Opportunity" assistant, accessibility as a first-class constraint |
| Design & Usability | Clean shadcn/ui interface, role-based dashboards, mobile-responsive layout |
| Effectiveness & Efficiency | Deterministic scoring is fast and explainable, and the LLM is only used where it adds value. Show measured numbers in the demo, such as matching time and match counts. |

**Focus:** college students, NGOs and small businesses in **Bhubaneswar**. A city-focused prototype with realistic seed data is more convincing than an empty nationwide portal.

---

## 1. Final stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | **React + Vite + TypeScript** | Fast dev server, no SSR complexity (Next.js isn't needed here) |
| Styling / UI | **Tailwind CSS v4 + shadcn/ui** | Polished components quickly |
| Routing / data | **React Router + TanStack Query + Axios** | Routing, plus server-state caching |
| Forms | **react-hook-form + zod** | Typed validation |
| Backend | **Node.js + Express + TypeScript** | Minimal boilerplate, modular monolith |
| Validation | **Zod** | One validation library for API input and for AI output |
| Database | **MongoDB Atlas + Mongoose** | Flexible profiles; GeoJSON + `2dsphere` index for "near me" searches |
| Auth | **JWT + bcryptjs** | Simple role-based auth |
| AI | **Gemini API via `@google/genai`** | Skill extraction, match explanations, gap analysis (structured JSON output) |
| Media (optional) | **Cloudinary** | Portfolio attachments (stretch goal; start with links) |
| Deployment | **Vercel** (client) + **Render** (server) + **Atlas** (DB) | Free tiers, little setup |
| Dev partner | **IBM Bob** | Planning, implementation, testing, review |

**Use TypeScript on both sides.** Bob will generate and edit code across the client and server, and types catch the mismatches early.

**Deliberately NOT in scope:** microservices, Docker, Redis, Kafka, a vector database, WebSockets/chat, payments, multiple AI providers or complex recommendation models.

---

## 2. Architecture

```
┌────────────────────────────────────────────────────────────┐
│ React (Vite + TS)                                          │
│ Seeker dashboard · Organisation dashboard · Admin · Assistant│
└───────────────▲───────────────────────────┬────────────────┘
                │      REST / JSON + JWT     │
┌───────────────┴───────────────────────────▼────────────────┐
│ Express + Node.js (TypeScript) — modular monolith           │
│                                                            │
│ auth │ users │ skills │ evidence │ opportunities │         │
│ matching │ applications │ reviews │ assistant │ admin       │
│                                                            │
│ services/ai.service.ts  ──────────────► Gemini API          │
└───────────────┬────────────────────────────────────────────┘
                │ Mongoose
        ┌───────▼────────┐
        │ MongoDB Atlas  │  (2dsphere geo index)
        └────────────────┘
```

### The key design rule: hybrid matching

**The LLM never decides who matches.** Matching runs in three steps:

1. **Hard filters (deterministic).** These drop any opportunity that breaks an essential constraint: availability, location or remote-only, pay preference, required accessibility, or a missing mandatory skill.
2. **Weighted score (deterministic):**

   **M = 0.40·S + 0.20·A + 0.15·L + 0.15·E + 0.10·P** (each part is scored 0–100)

   | Symbol | Meaning |
   |---|---|
   | S | Skill compatibility |
   | A | Availability compatibility |
   | L | Location compatibility |
   | E | Experience / evidence compatibility |
   | P | Preference and accessibility compatibility |

3. **AI explanation.** The LLM receives the *already computed* breakdown and explains it in plain language: why it fits, which skills match, what's missing and how to improve.

This keeps matching fast, consistent and explainable. If the AI API fails during judging, matching still works and a template explanation is used instead.

---

## 3. Prerequisites

Install these on your machine first (Windows PowerShell commands are used below):

| Tool | Version | Check |
|---|---|---|
| Node.js | 22 LTS | `node -v` |
| npm | comes with Node | `npm -v` |
| Git | any recent | `git --version` |
| VS Code | optional | — |
| IBM Bob IDE | latest | open it and sign in |

Create these accounts (all have free tiers):

1. **MongoDB Atlas.** Create a free cluster and a database user. Under *Network Access*, allow your IP (or `0.0.0.0/0` for the hackathon). Copy the connection string.
2. **Google AI Studio.** Create a Gemini API key.
3. **Render** (backend hosting) and **Vercel** (frontend hosting), both via GitHub login.
4. **GitHub.** Create an empty repo called `skillbridge`.
5. *(Optional)* **Cloudinary**, if you add file uploads later.

---

## Step 1 – Create the repository

```powershell
mkdir skillbridge
cd skillbridge
mkdir client, server, docs
git init
```

Create `.gitignore` in the root:

```gitignore
node_modules/
dist/
.env
.env.*
!.env.example
*.log
.DS_Store
```

Create empty doc files that Bob will fill in during planning:

```powershell
New-Item docs/ARCHITECTURE.md, docs/API_CONTRACT.md, docs/DATABASE_SCHEMA.md, docs/IBM_BOB_USAGE.md -ItemType File
```

Target folder structure (fill it in over the next steps):

```
skillbridge/
├── client/                     # React + Vite + TS
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── ui/             # shadcn/ui generated components
│       │   ├── common/         # Navbar, ProtectedRoute, EmptyState…
│       │   ├── dashboard/      # StatCard, charts
│       │   ├── opportunities/  # OpportunityCard, MatchBadge, GapPanel
│       │   └── profile/        # SkillEditor, EvidenceList
│       ├── pages/
│       │   ├── auth/           # Login, Register
│       │   ├── seeker/         # Dashboard, Profile, Matches, Applications, Assistant
│       │   ├── organisation/   # Dashboard, PostOpportunity, Applicants
│       │   └── shared/         # Landing, OpportunityDetails, NotFound
│       ├── services/           # api.ts, auth.ts, opportunities.ts, matches.ts…
│       ├── hooks/              # useAuth, useMatches…
│       ├── context/            # AuthContext
│       ├── types/              # shared TS types
│       ├── layouts/            # AppLayout, AuthLayout
│       ├── routes/             # router config
│       ├── lib/utils.ts        # shadcn helper
│       ├── App.tsx
│       └── main.tsx
│
├── server/                     # Express + TS
│   ├── src/
│   │   ├── config/             # env.ts, db.ts
│   │   ├── middleware/         # auth.ts, errorHandler.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── skills/
│   │   │   ├── evidence/
│   │   │   ├── opportunities/
│   │   │   ├── matching/       # engine.ts, matching.service.ts, routes
│   │   │   ├── applications/
│   │   │   ├── reviews/
│   │   │   ├── assistant/
│   │   │   └── admin/
│   │   ├── services/           # ai.service.ts, storage.service.ts (optional)
│   │   ├── utils/              # geo.ts, skills.ts, timeout.ts
│   │   ├── scripts/seed.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tsconfig.json
│   └── package.json
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_CONTRACT.md
│   ├── DATABASE_SCHEMA.md
│   └── IBM_BOB_USAGE.md
├── .bob/                       # created by Bob's /init + our rules
├── AGENTS.md                   # created by Bob's /init
└── README.md
```

Each backend module owns its **model, schema (zod), service, controller and routes**. Don't build one giant controller.

```powershell
git add .
git commit -m "chore: initial repository structure"
```

---

## Step 2 – Set up IBM Bob before writing code

Bob is our **development partner**, not the AI inside the product. Gemini powers SkillBridge's intelligence. Bob helps us *build* SkillBridge.

1. Open the `skillbridge` folder in **IBM Bob IDE**.
2. Open the Bob chat panel (**Ctrl + Alt + B** on Windows, **Option + Command + B** on macOS).
3. Run:

   ```
   /init
   ```

   Bob scans the repo and creates `AGENTS.md` (the main project context) plus mode-specific files such as `.bob/rules-plan/AGENTS-plan.md`, `.bob/rules-code/AGENTS-code.md` and `.bob/rules-ask/AGENTS-ask.md`. **Re-run `/init` after each major milestone** so Bob's context stays current.

4. Add our own project rules. Create `.bob/rules/skillbridge-rules.md`:

   ```markdown
   # SkillBridge project rules

   ## Architecture
   - Modular monolith. Server modules live in server/src/modules/<name>/ with
     <name>.model.ts, <name>.schema.ts (zod), <name>.service.ts,
     <name>.controller.ts, <name>.routes.ts.
   - No microservices, Docker, Redis, Kafka, vector DBs, WebSockets or extra AI providers.
   - Do not add new npm packages without stating why in the plan.

   ## TypeScript
   - strict mode on both client and server. No `any` unless justified in a comment.
   - Server uses CommonJS output (see tsconfig). Do not switch module systems.

   ## API
   - All routes are prefixed with /api. JSON only. Follow docs/API_CONTRACT.md exactly.
   - Validate every request body/query with zod in the controller.
   - Errors: { "message": string, "issues"?: [...] } with correct HTTP status codes.

   ## Matching
   - Matching scores are computed ONLY by server/src/modules/matching/engine.ts.
   - The LLM may extract, explain and suggest — it must never compute or override a score.
   - Every AI call must have a timeout and a deterministic fallback.

   ## Skills
   - Skills are always stored as catalogue slugs (e.g. "react", "nodejs", "mongodb").
     Normalise any free-text skill with utils/skills.ts before saving.

   ## Security
   - Secrets only in server/.env. Never put API keys in the client.
   - Never return passwordHash. Check roles with requireRole() on protected routes.

   ## Frontend
   - Use shadcn/ui components from @/components/ui. Use TanStack Query for server data.
   - Every page must be responsive (mobile + desktop) and have loading, empty and error states.

   ## Process
   - Implement one vertical slice at a time and run the build after each change.
   - Never silently delete existing functionality.
   - After each feature, append a short entry to docs/IBM_BOB_USAGE.md.
   ```

5. *(Optional, good for judging)* Create a custom **QA Reviewer** mode: Bob Settings → **Modes** → **+**. Use:
   - **Name:** QA Reviewer · **Slug:** `qa-reviewer`
   - **Role definition:** *"You are a senior QA and security reviewer for a MERN + TypeScript app. You find bugs, missing validation, auth gaps and broken edge cases, and you write tests. You do not add features."*

   Bob saves project modes in `.bob/custom_modes.yaml`. Commit it.

6. Switch to **Plan mode** and paste **Prompt P1** (see [IBM Bob workflow](#ibm-bob-workflow--all-prompts)). Review the plan, then let Bob write it into `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md` and `docs/DATABASE_SCHEMA.md`. Edit anything that contradicts this README. **Freeze the API contract before any parallel work starts.**

7. Start `docs/IBM_BOB_USAGE.md` (the judges' evidence trail):

   ```markdown
   # How we used IBM Bob

   | # | Date | Mode | Task | Prompt (short) | Outcome / what we changed | Commit |
   |---|------|------|------|----------------|---------------------------|--------|
   | 1 | Day 1 | Plan | Architecture & API contract | P1 | Plan accepted; removed X, added Y | abc123 |
   ```

```powershell
git add .
git commit -m "docs: Bob /init context, project rules and approved architecture"
```

---

## Step 3 – Backend scaffold (Express + TypeScript)

```powershell
cd server
npm init -y

npm install express mongoose dotenv cors bcryptjs jsonwebtoken zod @google/genai
npm install -D typescript tsx @types/node @types/express @types/cors @types/jsonwebtoken @types/bcryptjs
```

> `npm install express` now installs **Express 5**. It forwards errors from `async` route handlers to the error middleware automatically, so you don't need `express-async-errors`.

### `server/tsconfig.json`

Don't rely on the `npx tsc --init` defaults. Recent TypeScript versions generate a config that switches on ESM/NodeNext rules, which then require `.js` extensions on every import. **Replace the whole file with this:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

**Do not** add `"type": "module"` to `server/package.json`.

### `server/package.json` scripts

```json
"scripts": {
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "seed": "tsx src/scripts/seed.ts"
}
```

### `server/.env` (never commit) and `server/.env.example` (commit)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/skillbridge?retryWrites=true&w=majority
JWT_SECRET=<at least 32 random characters>
GEMINI_API_KEY=<your key>
# Use a current Flash-class model from https://ai.google.dev/gemini-api/docs/models
GEMINI_MODEL=gemini-2.5-flash
CLIENT_URL=http://localhost:5173
```

> Model names change often. Check the Gemini models page and set `GEMINI_MODEL` to a current fast model that supports structured (JSON) output. The code reads it from `.env`, so switching models needs no code change.

### `src/config/env.ts`: validated environment

```ts
import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 chars"),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  CLIENT_URL: z.string().default("http://localhost:5173"),
});

export const env = EnvSchema.parse(process.env);
```

### `src/config/db.ts`

```ts
import mongoose from "mongoose";

export async function connectDB(uri: string) {
  await mongoose.connect(uri);
  console.log("✅ MongoDB connected");
}
```

### `src/middleware/errorHandler.ts`

```ts
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ message: "Validation failed", issues: err.issues });
    return;
  }
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
}
```

### `src/app.ts`

```ts
import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./modules/auth/auth.routes";
// import further module routes here as you build them

export const app = express();

app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/skills", skillRoutes);
// app.use("/api/evidence", evidenceRoutes);
// app.use("/api/opportunities", opportunityRoutes);
// app.use("/api/matches", matchingRoutes);
// app.use("/api/applications", applicationRoutes);
// app.use("/api/reviews", reviewRoutes);
// app.use("/api/assistant", assistantRoutes);
// app.use("/api/admin", adminRoutes);

app.use(errorHandler);
```

### `src/server.ts`

```ts
import { app } from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";

connectDB(env.MONGODB_URI)
  .then(() => app.listen(env.PORT, () => console.log(`🚀 API on http://localhost:${env.PORT}`)))
  .catch((err) => {
    console.error("Failed to start:", err);
    process.exit(1);
  });
```

**Checkpoint:** run `npm run dev`, then open `http://localhost:5000/api/health`. You should see `{"ok":true}`.

```powershell
git add . ; git commit -m "feat(server): express + ts scaffold with env validation"
```

---

## Step 4 – Database models (MongoDB + Mongoose)

Seven collections: **Users, Skills, Opportunities, Applications, SkillEvidence, Matches, Reviews**.

Shared constants (`src/modules/common/constants.ts`):

```ts
export const ROLES = ["SEEKER", "ORGANISATION", "ADMIN"] as const;
export const OPP_TYPES = ["INTERNSHIP", "PART_TIME", "FREELANCE", "VOLUNTEER", "COMMUNITY_PROJECT"] as const;
export const COMP_KINDS = ["PAID", "STIPEND", "UNPAID"] as const;
export const ACCESS_TAGS = ["WHEELCHAIR_ACCESS", "SCREEN_READER_FRIENDLY", "SIGN_LANGUAGE", "FLEXIBLE_HOURS", "QUIET_WORKSPACE"] as const;
export const APP_STATUS = ["APPLIED", "SHORTLISTED", "ACCEPTED", "REJECTED", "COMPLETED"] as const;
```

### `users/user.model.ts`

```ts
import { Schema, model, InferSchemaType } from "mongoose";
import { ROLES, OPP_TYPES, ACCESS_TAGS } from "../common/constants";

const pointSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [85.8245, 20.2961] }, // [lng, lat] — Bhubaneswar
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "SEEKER" },

    // seeker fields
    headline: String,
    bio: String,
    skills: [
      {
        _id: false,
        skill: { type: String, required: true },          // catalogue slug
        level: { type: Number, min: 1, max: 5, default: 2 },
        source: { type: String, enum: ["SELF", "AI_EXTRACTED", "ENDORSED"], default: "SELF" },
      },
    ],
    availability: {
      hoursPerWeek: { type: Number, default: 10 },
      remoteOnly: { type: Boolean, default: false },
      maxTravelKm: { type: Number, default: 15 },
    },
    accessibilityNeeds: [{ type: String, enum: ACCESS_TAGS }],
    preferences: {
      types: [{ type: String, enum: OPP_TYPES }],
      paidOnly: { type: Boolean, default: false },
    },

    // organisation fields
    orgType: { type: String, enum: ["NGO", "SMALL_BUSINESS", "COMMUNITY", "OTHER"] },
    website: String,

    city: { type: String, default: "Bhubaneswar" },
    location: { type: pointSchema, default: () => ({}) },
  },
  { timestamps: true }
);

userSchema.index({ location: "2dsphere" });

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
```

### `opportunities/opportunity.model.ts`

```ts
import { Schema, model, Types } from "mongoose";
import { OPP_TYPES, COMP_KINDS, ACCESS_TAGS } from "../common/constants";

const opportunitySchema = new Schema(
  {
    organisation: { type: Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: OPP_TYPES, required: true },
    requiredSkills: [
      {
        _id: false,
        skill: { type: String, required: true },          // catalogue slug
        minLevel: { type: Number, min: 1, max: 5, default: 2 },
        mandatory: { type: Boolean, default: false },
      },
    ],
    isRemote: { type: Boolean, default: false },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [85.8245, 20.2961] },
    },
    hoursPerWeek: { type: Number, required: true },
    compensation: {
      kind: { type: String, enum: COMP_KINDS, default: "UNPAID" },
      amount: Number, // INR per month (optional)
    },
    accessibilityProvided: [{ type: String, enum: ACCESS_TAGS }],
    status: { type: String, enum: ["OPEN", "CLOSED"], default: "OPEN" },
    deadline: Date,
  },
  { timestamps: true }
);

opportunitySchema.index({ location: "2dsphere" });
opportunitySchema.index({ status: 1, type: 1 });

export const Opportunity = model("Opportunity", opportunitySchema);
```

### Other models (short specs, so Bob can generate them in Agent mode)

| Collection | Fields |
|---|---|
| **Skill** | `slug` (unique, e.g. `react`), `name` (`React`), `category` (`FRONTEND`, `BACKEND`, `DATA`, `DESIGN`, `MARKETING`, `SOFT`…), `aliases: string[]` (e.g. `["reactjs"]`) |
| **SkillEvidence** | `user`, `title`, `kind` (`PROJECT`, `GITHUB`, `PORTFOLIO`, `CERTIFICATE`, `WORK_SAMPLE`), `url`, `description`, `skills: string[]` (slugs), `endorsedBy?: ObjectId` (organisation), `endorsedAt?` |
| **Application** | `opportunity`, `applicant`, `matchScore` (snapshot), `message`, `status` (`APP_STATUS`), `history: [{ status, at }]`; unique index on `{ opportunity, applicant }` |
| **Match** (cache) | `user`, `opportunity`, `score`, `breakdown {S,A,L,E,P}`, `matchedSkills`, `missingSkills`, `explanation`, `computedAt`; unique index on `{ user, opportunity }` |
| **Review** | `application`, `reviewer`, `reviewee`, `rating 1–5`, `comment`, `verifiedSkills: string[]`. A verified skill upgrades that skill's `source` to `ENDORSED`. |

### `utils/skills.ts`: skill normalisation (important)

"React.js", "ReactJS" and "React" must all become the same slug, or matching will be unreliable.

```ts
import { Skill } from "../modules/skills/skill.model";

const toKey = (raw: string) => raw.toLowerCase().replace(/[\s.\-_]/g, "");

let cache: Map<string, string> | null = null;

export async function loadSkillIndex() {
  const all = await Skill.find({}, { slug: 1, name: 1, aliases: 1 }).lean();
  cache = new Map();
  for (const s of all) {
    cache.set(toKey(s.slug), s.slug);
    cache.set(toKey(s.name), s.slug);
    for (const a of s.aliases ?? []) cache.set(toKey(a), s.slug);
  }
  return cache;
}

/** Returns the catalogue slug, or null if unknown. */
export async function normaliseSkill(raw: string): Promise<string | null> {
  const index = cache ?? (await loadSkillIndex());
  return index.get(toKey(raw)) ?? null;
}
```

Call `loadSkillIndex()` again whenever a skill is added to the catalogue.

```powershell
git add . ; git commit -m "feat(server): mongoose models and skill normalisation"
```

---

## Step 5 – Authentication and roles

Roles: **SEEKER** (students and local workers), **ORGANISATION** (NGOs and small businesses), **ADMIN**.

### `middleware/auth.ts`

```ts
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type Role = "SEEKER" | "ORGANISATION" | "ADMIN";
export interface AuthUser { id: string; role: Role }

declare global {
  namespace Express {
    interface Request { user?: AuthUser }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorised" });
    return;
  }
  try {
    req.user = jwt.verify(header.slice(7), env.JWT_SECRET) as unknown as AuthUser;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  };

export const signToken = (u: AuthUser) =>
  jwt.sign(u, env.JWT_SECRET, { expiresIn: "7d" });
```

### `modules/auth/auth.routes.ts`

```ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../users/user.model";
import { requireAuth, signToken, type Role } from "../../middleware/auth";

const router = Router();

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
  role: z.enum(["SEEKER", "ORGANISATION"]),
  orgType: z.enum(["NGO", "SMALL_BUSINESS", "COMMUNITY", "OTHER"]).optional(),
});
const LoginSchema = z.object({ email: z.email(), password: z.string().min(1) });

router.post("/register", async (req, res) => {
  const { password, ...data } = RegisterSchema.parse(req.body);
  if (await User.exists({ email: data.email })) {
    res.status(409).json({ message: "Email already registered" });
    return;
  }
  const user = await User.create({ ...data, passwordHash: await bcrypt.hash(password, 10) });
  const token = signToken({ id: user.id, role: user.role as Role });
  res.status(201).json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

router.post("/login", async (req, res) => {
  const { email, password } = LoginSchema.parse(req.body);
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }
  const token = signToken({ id: user.id, role: user.role as Role });
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

router.get("/me", requireAuth, async (req, res) => {
  res.json(await User.findById(req.user!.id));
});

export default router;
```

**Checkpoint (Postman or Thunder Client):** register a seeker, log in, then call `GET /api/auth/me` with `Authorization: Bearer <token>`.

---

## Step 6 – Core modules and API contract

Freeze this table in `docs/API_CONTRACT.md` before splitting work. Bob (or teammates) then build each module against it.

| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | Register a seeker or organisation |
| POST | `/api/auth/login` | public | Log in, returns JWT |
| GET | `/api/auth/me` | any | Current user |
| GET | `/api/users/me` · PUT `/api/users/me` | any | Read/update profile (skills, availability, location, accessibility, preferences) |
| POST | `/api/users/me/extract-skills` | SEEKER | **AI:** free text or bio → *suggested* skills (the user confirms before saving) |
| GET | `/api/skills?q=` | any | Skill catalogue / autocomplete |
| POST | `/api/evidence` · GET `/api/evidence/me` | SEEKER | Add/list proof of ability (project, GitHub, portfolio…) |
| POST | `/api/evidence/:id/endorse` | ORGANISATION | Endorse evidence after verified work |
| POST | `/api/opportunities` | ORGANISATION | Publish an opportunity |
| GET | `/api/opportunities?type=&remote=&near=lng,lat&km=` | any | Browse/search, with geo filter via `$near` |
| GET | `/api/opportunities/mine` | ORGANISATION | My posted opportunities |
| GET | `/api/opportunities/:id` · PATCH `/api/opportunities/:id` | any / owner | Details / edit or close |
| GET | `/api/matches/me?limit=10` | SEEKER | **Ranked matches + AI explanations** |
| GET | `/api/matches/gap/:opportunityId` | SEEKER | **Opportunity Gap Analyzer** for one opportunity |
| POST | `/api/assistant/next-opportunity` | SEEKER | **"Your Next Opportunity":** free text → profile + top 3 + next step |
| POST | `/api/applications` | SEEKER | Apply (stores a score snapshot) |
| GET | `/api/applications/me` | SEEKER | My applications and their status |
| GET | `/api/opportunities/:id/applications` | ORGANISATION (owner) | Applicants ranked by match score |
| PATCH | `/api/applications/:id/status` | ORGANISATION (owner) | Shortlist / accept / reject / complete |
| POST | `/api/reviews` | ORGANISATION | Review completed work and verify skills |
| GET | `/api/admin/stats` | ADMIN | Counts, match-rate, top skills in demand |

Geo search example (inside the opportunities service):

```ts
const [lng, lat] = String(req.query.near).split(",").map(Number);
const km = Number(req.query.km ?? 10);
Opportunity.find({
  status: "OPEN",
  $or: [
    { isRemote: true },
    { location: { $geoWithin: { $centerSphere: [[lng, lat], km / 6378.1] } } },
  ],
});
```

> Use `$geoWithin` + `$centerSphere` (not `$near`) when combining it with `$or`, because MongoDB does not allow `$near` inside `$or`.

Build order: **users → skills → opportunities → matching → applications → evidence → reviews → assistant → admin.** Commit after each module.

---

## Step 7 – The Matching Engine (hybrid scoring)

This is the heart of the product. It is plain, deterministic TypeScript, so it is fast and testable.

### `utils/geo.ts`

```ts
/** Distance in km between two [lng, lat] points. */
export function haversineKm([lng1, lat1]: number[], [lng2, lat2]: number[]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}
```

### `modules/matching/engine.ts`

```ts
import { haversineKm } from "../../utils/geo";

export const WEIGHTS = { S: 0.4, A: 0.2, L: 0.15, E: 0.15, P: 0.1 } as const;

export interface SeekerProfile {
  skills: { skill: string; level: number; source?: string }[];
  location?: { coordinates: number[] };
  availability?: { hoursPerWeek?: number; remoteOnly?: boolean; maxTravelKm?: number };
  accessibilityNeeds?: string[];
  preferences?: { types?: string[]; paidOnly?: boolean };
}

export interface OpportunityLike {
  _id: unknown;
  type: string;
  requiredSkills: { skill: string; minLevel: number; mandatory: boolean }[];
  isRemote: boolean;
  location?: { coordinates: number[] };
  hoursPerWeek: number;
  compensation: { kind: string };
  accessibilityProvided?: string[];
}

export interface MissingSkill { skill: string; needed: number; have: number; mandatory: boolean }

export interface MatchResult {
  opportunityId: string;
  eligible: boolean;               // passed all hard filters
  blockers: string[];              // why not eligible (used by the Gap Analyzer)
  score: number;                   // 0–100
  breakdown: { S: number; A: number; L: number; E: number; P: number };
  matchedSkills: string[];
  missingSkills: MissingSkill[];
  distanceKm: number | null;
}

const r = (n: number) => Math.round(n);

export function evaluate(
  seeker: SeekerProfile,
  opp: OpportunityLike,
  evidencedSkills: Set<string> = new Set()
): MatchResult {
  const blockers: string[] = [];
  const mySkills = new Map(seeker.skills.map((s) => [s.skill, s]));
  const hours = seeker.availability?.hoursPerWeek ?? 0;
  const maxKm = seeker.availability?.maxTravelKm ?? 15;
  const distanceKm =
    !opp.isRemote && seeker.location && opp.location
      ? haversineKm(seeker.location.coordinates, opp.location.coordinates)
      : null;

  // ── Step 1: hard filters ─────────────────────────────────────────────
  if (hours < opp.hoursPerWeek * 0.5)
    blockers.push(`Needs ~${opp.hoursPerWeek} h/week; you have ${hours} h`);

  if (!opp.isRemote) {
    if (seeker.availability?.remoteOnly) blockers.push("On-site role; you prefer remote only");
    else if (distanceKm !== null && distanceKm > maxKm)
      blockers.push(`${distanceKm.toFixed(1)} km away (your limit: ${maxKm} km)`);
  }

  if (seeker.preferences?.paidOnly && opp.compensation.kind === "UNPAID")
    blockers.push("Unpaid role; you are looking for paid work");

  const provided = new Set(opp.accessibilityProvided ?? []);
  const unmetAccess = (seeker.accessibilityNeeds ?? []).filter((n) => !provided.has(n));
  if (!opp.isRemote && unmetAccess.length)
    blockers.push(`Accessibility not provided: ${unmetAccess.join(", ")}`);

  // ── Step 2: weighted score ───────────────────────────────────────────
  let wTotal = 0, wGot = 0;
  const matchedSkills: string[] = [];
  const missingSkills: MissingSkill[] = [];

  for (const req of opp.requiredSkills) {
    const w = req.mandatory ? 2 : 1;
    const have = mySkills.get(req.skill)?.level ?? 0;
    wTotal += w;
    wGot += w * Math.min(have / req.minLevel, 1);
    if (have >= req.minLevel) matchedSkills.push(req.skill);
    else missingSkills.push({ skill: req.skill, needed: req.minLevel, have, mandatory: req.mandatory });
    if (req.mandatory && have === 0) blockers.push(`Missing mandatory skill: ${req.skill}`);
  }

  const S = wTotal ? (100 * wGot) / wTotal : 100;
  const A = opp.hoursPerWeek ? 100 * Math.min(hours / opp.hoursPerWeek, 1) : 100;
  const L = opp.isRemote ? 100 : distanceKm === null ? 50 : 100 * Math.max(0, 1 - distanceKm / maxKm);

  const evidenced = opp.requiredSkills.filter(
    (q) => evidencedSkills.has(q.skill) || mySkills.get(q.skill)?.source === "ENDORSED"
  ).length;
  const E = opp.requiredSkills.length ? (100 * evidenced) / opp.requiredSkills.length : 100;

  const prefTypes = seeker.preferences?.types ?? [];
  const typeFit = prefTypes.length === 0 ? 40 : prefTypes.includes(opp.type) ? 60 : 20;
  const accessFit = opp.isRemote || unmetAccess.length === 0 ? 40 : 0;
  const P = typeFit + accessFit;

  const score = r(WEIGHTS.S * S + WEIGHTS.A * A + WEIGHTS.L * L + WEIGHTS.E * E + WEIGHTS.P * P);

  return {
    opportunityId: String(opp._id),
    eligible: blockers.length === 0,
    blockers,
    score,
    breakdown: { S: r(S), A: r(A), L: r(L), E: r(E), P: r(P) },
    matchedSkills,
    missingSkills,
    distanceKm: distanceKm === null ? null : Number(distanceKm.toFixed(1)),
  };
}
```

### `modules/matching/matching.service.ts` (outline)

```ts
export async function rankForSeeker(userId: string, limit = 10) {
  const seeker = await User.findById(userId).lean();
  const opps = await Opportunity.find({ status: "OPEN" }).lean();
  const evidence = await SkillEvidence.find({ user: userId }).lean();
  const evidenced = new Set(evidence.flatMap((e) => e.skills));

  const t0 = performance.now();
  const results = opps.map((o) => evaluate(seeker!, o, evidenced));
  const ms = performance.now() - t0;               // ← show this number in the demo

  const matches = results.filter((m) => m.eligible).sort((a, b) => b.score - a.score).slice(0, limit);
  const nearMisses = results
    .filter((m) => !m.eligible && m.breakdown.S >= 50)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return { matches, nearMisses, evaluated: opps.length, ms };
}
```

- `GET /api/matches/me` returns `matches`, each with an AI explanation (Step 8), cached in the `Match` collection. Recompute when the profile or opportunity changes.
- The **Gap Analyzer** uses `missingSkills` + `blockers` for one opportunity, plus the user's other eligible matches as "alternatives you already qualify for".

### Unit tests (ask Bob to write them)

```powershell
npm install -D vitest
```

Add `"test": "vitest run"` to the scripts. Test cases to cover:

- A remote-only seeker never sees on-site roles.
- A missing mandatory skill → `eligible: false` and the blocker lists the skill.
- An unmet accessibility need on an on-site role → blocked; the same role set to remote → allowed.
- A perfect seeker → score close to 100. Weights sum to 1.
- `"React.js"`, `"ReactJS"` and `"react"` normalise to the same slug.

```powershell
git add . ; git commit -m "feat(matching): deterministic hybrid matching engine + tests"
```

---

## Step 8 – AI service (Gemini)

The AI does three jobs. **None of them computes scores.**

| Function | Input | Output |
|---|---|---|
| `extractProfile` | Free text (bio, project description, "Your Next Opportunity" sentence) + skill catalogue | Skills with level + evidence phrase, hours/week, remote preference, preferred types |
| `explainMatch` | A computed `MatchResult` + opportunity title | 2–3 sentence plain-English explanation |
| `analyseGap` | `missingSkills` + `blockers` + alternatives | Summary + "learn next" list with concrete first steps |

### `utils/timeout.ts`

```ts
export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`AI timeout after ${ms}ms`)), ms)),
  ]);
}
```

### `services/ai.service.ts`

```ts
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { env } from "../config/env";
import { withTimeout } from "../utils/timeout";
import { OPP_TYPES } from "../modules/common/constants";
import type { MatchResult } from "../modules/matching/engine";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

/** Calls Gemini with a JSON schema and validates the reply with the same zod schema. */
async function generateJson<T extends z.ZodType>(schema: T, prompt: string, ms = 15000): Promise<z.infer<T>> {
  const res = await withTimeout(
    ai.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(schema),
        temperature: 0.2,
      },
    }),
    ms
  );
  return schema.parse(JSON.parse(res.text ?? ""));
}

async function generateText(prompt: string, ms = 12000): Promise<string> {
  const res = await withTimeout(
    ai.models.generateContent({ model: env.GEMINI_MODEL, contents: prompt, config: { temperature: 0.4 } }),
    ms
  );
  return (res.text ?? "").trim();
}

// ── 1. Skill DNA extraction ──────────────────────────────────────────────
export const ExtractedProfile = z.object({
  skills: z.array(
    z.object({
      name: z.string(),
      level: z.number().int().min(1).max(5),
      evidence: z.string(),
    })
  ),
  hoursPerWeek: z.number().nullable(),
  remoteOnly: z.boolean().nullable(),
  preferredTypes: z.array(z.enum(OPP_TYPES)),
});

export async function extractProfile(text: string, catalogue: string[]) {
  return generateJson(
    ExtractedProfile,
    `You extract a skill profile for an opportunity-matching platform.
Use skill names from this catalogue whenever possible: ${catalogue.join(", ")}.
Level scale: 1 = heard of it, 2 = beginner, 3 = can build small things alone, 4 = strong, 5 = expert.
Be conservative: with no evidence of real use, choose level 2 or lower.
"evidence" must be a short phrase copied from the text. Do not invent skills.
Convert daily hours to hours per week. Use null when something is not stated.

TEXT:
"""${text}"""`
  );
}

// ── 2. Match explanation ─────────────────────────────────────────────────
export async function explainMatch(m: MatchResult, opportunityTitle: string) {
  try {
    return await generateText(
      `Explain to a student/job-seeker, in 2–3 friendly sentences, why "${opportunityTitle}" fits them.
Use ONLY these computed facts; do not change the score:
${JSON.stringify(m)}
Mention matched skills, one missing skill (if any) and one way to improve.`
    );
  } catch {
    return fallbackExplanation(m, opportunityTitle); // deterministic fallback
  }
}

export function fallbackExplanation(m: MatchResult, title: string) {
  const has = m.matchedSkills.join(", ") || "some of the required skills";
  const gap = m.missingSkills[0];
  return `${title} is a ${m.score}% match. You already have ${has}.` +
    (gap ? ` Improving ${gap.skill} (to level ${gap.needed}) would make you a stronger candidate.` : "");
}

// ── 3. Opportunity Gap Analyzer ──────────────────────────────────────────
export const GapAnalysis = z.object({
  summary: z.string(),
  learnNext: z.array(z.object({ skill: z.string(), why: z.string(), firstStep: z.string() })).max(3),
});

export async function analyseGap(input: {
  title: string; matchedSkills: string[]; missingSkills: MatchResult["missingSkills"];
  blockers: string[]; alternatives: { title: string; score: number }[];
}) {
  try {
    return await generateJson(
      GapAnalysis,
      `A user does not fully qualify for "${input.title}". Using ONLY these facts:
${JSON.stringify(input)}
Write an encouraging one-paragraph summary (what they have, what's missing, which alternatives they
already qualify for), then up to 3 skills to learn next with a concrete, free first step each.`
    );
  } catch {
    return {
      summary: `You match on ${input.matchedSkills.join(", ") || "part of this role"}. Missing: ${
        input.missingSkills.map((s) => s.skill).join(", ") || "none"}.`,
      learnNext: input.missingSkills.slice(0, 3).map((s) => ({
        skill: s.skill,
        why: s.mandatory ? "Mandatory for this role" : "Raises your match score",
        firstStep: `Build one small project using ${s.skill} and add it as evidence.`,
      })),
    };
  }
}
```

**Rules applied here:**

- The API key lives only on the server.
- Every call has a timeout.
- Every AI response is validated with zod.
- Every feature has a deterministic fallback, so the demo survives an API outage or rate limit.

### "Your Next Opportunity" (`POST /api/assistant/next-opportunity`)

1. `extractProfile(text, catalogueSlugs)` → normalise each skill with `normaliseSkill()` and drop unknown skills.
2. Build a temporary `SeekerProfile` (merged with the saved profile if the user has one).
3. Run `evaluate()` on all open opportunities → keep the top 3 eligible.
4. Pick the most common missing skill across the top results and the near misses → **"Your next step"**.
5. Return `{ profile, top3: [...with explanations], nextStep }`. Offer a **"Save to my profile"** button (skills saved with `source: "AI_EXTRACTED"`).

```powershell
git add . ; git commit -m "feat(ai): gemini skill extraction, explanations and gap analysis with fallbacks"
```

---

## Step 9 – Frontend scaffold

```powershell
cd ../client
npm create vite@latest . -- --template react-ts
npm install

npm install react-router-dom axios @tanstack/react-query lucide-react
npm install react-hook-form zod @hookform/resolvers
npm install recharts
npm install tailwindcss @tailwindcss/vite
npm install -D @types/node
```

### Tailwind v4 (no `tailwind.config.js` needed)

Replace **everything** in `src/index.css` with:

```css
@import "tailwindcss";
```

### `vite.config.ts`

```ts
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

### Path alias: add it to **both** `tsconfig.json` and `tsconfig.app.json`

Inside `"compilerOptions"` of each file:

```json
"paths": { "@/*": ["./src/*"] }
```

(In `tsconfig.json`, add a `"compilerOptions": { ... }` block next to the existing `"files"`/`"references"`. The shadcn CLI reads the alias from there.)

### shadcn/ui

```powershell
npx shadcn@latest init
npx shadcn@latest add button card input label textarea badge select tabs progress dialog sonner avatar dropdown-menu separator skeleton checkbox slider
```

### `client/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

### `src/services/api.ts`

```ts
import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sb_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("sb_token");
      if (!location.pathname.startsWith("/login")) location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
```

### `src/main.tsx`

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
```

### Auth plumbing (have Bob generate it from this spec)

- **`context/AuthContext.tsx`:** holds `user`, `token`, `login()`, `register()`, `logout()`. Stores the token in `localStorage("sb_token")` and loads `/auth/me` on start.
- **`components/common/ProtectedRoute.tsx`:** `<ProtectedRoute roles={["SEEKER"]}>`. Redirects to `/login` when signed out and to the user's own dashboard on a role mismatch.

**Checkpoint:** run `npm run dev` → `http://localhost:5173` shows a styled shadcn `Button`.

```powershell
git add . ; git commit -m "feat(client): vite + tailwind v4 + shadcn + query + axios scaffold"
```

---

## Step 10 – Frontend pages and flows

### Routes

| Path | Page | Role |
|---|---|---|
| `/` | Landing: the problem, how it works, "Try Your Next Opportunity" call to action | public |
| `/login`, `/register` | Auth (role picker: *I'm looking for opportunities* / *I'm an organisation*) | public |
| `/seeker` | Dashboard: top matches, profile-strength meter, application status | SEEKER |
| `/seeker/profile` | Skill DNA editor (skills + level sliders, "Extract from text" button), availability, location, accessibility, preferences, evidence | SEEKER |
| `/seeker/matches` | Ranked match cards: score badge, S/A/L/E/P bars, AI explanation, Apply, "See gap" | SEEKER |
| `/seeker/gap/:id` | **Gap Analyzer**: have ✅ / missing ❌ / learn next / alternatives | SEEKER |
| `/seeker/assistant` | **Your Next Opportunity**: text box → profile chips, top 3, next step, "Save to profile" | SEEKER |
| `/seeker/applications` | My applications + status timeline | SEEKER |
| `/org` | Org dashboard: my opportunities, applicant counts | ORGANISATION |
| `/org/new` | Post opportunity: skills (catalogue autocomplete + min level + mandatory), hours, pay, remote/location, accessibility provided | ORGANISATION |
| `/org/opportunities/:id/applicants` | Applicants ranked by match score + breakdown; shortlist/accept/reject; endorse evidence | ORGANISATION |
| `/opportunities/:id` | Public opportunity details | any |
| `/admin` | Stats: users, opportunities, match rate, top in-demand skills (Recharts) | ADMIN |

### UI building blocks

- **`MatchBadge`:** a coloured % badge (≥80 green, 60–79 amber, <60 grey).
- **`ScoreBreakdown`:** five small `Progress` bars labelled Skills / Availability / Location / Evidence / Fit.
- **`GapPanel`:** two columns (have / missing), then "learn next" cards with first steps.
- **`SkillChip`:** skill name + level dots + ✔ when endorsed.
- Every list needs **loading (`Skeleton`)**, **empty** and **error** states. Toasts (`sonner`) for actions.
- Design: one accent colour, generous whitespace, cards, readable 16px base text, mobile-first. Use accessible labels and focus states, since accessibility is part of our pitch.

```powershell
git add . ; git commit -m "feat(client): seeker, organisation and admin flows"
```

---

## Step 11 – Seed demo data (Bhubaneswar)

`server/src/scripts/seed.ts` should create:

- **~40 skills** with aliases (react/reactjs, nodejs/node, mongodb/mongo, javascript/js, figma, canva, social-media, content-writing, excel, python, java, sql, photography, teaching, odia-translation, event-management, communication…).
- **Organisations (6–8):** e.g. 2 NGOs (education, environment), 2 small businesses (café, boutique), a college tech club, a community library.
- **Opportunities (20–30):** a mix of types, paid/unpaid, remote/on-site. Spread them over real Bhubaneswar coordinates, for example:
  - Patia ≈ `[85.8180, 20.3540]`
  - Saheed Nagar ≈ `[85.8440, 20.2900]`
  - Khandagiri ≈ `[85.7800, 20.2560]`
  - Old Town ≈ `[85.8350, 20.2400]`

  Include at least one opportunity with `accessibilityProvided`.
- **Seekers (6–8)** with different situations: a student with no experience, a remote-only student, a wheelchair user, a part-time local worker, a designer with a portfolio…
- **Demo accounts** (print them on the login page for judges):

  | Role | Email | Password |
  |---|---|---|
  | Seeker | `student@demo.skillbridge` | `Demo@1234` |
  | Organisation | `ngo@demo.skillbridge` | `Demo@1234` |
  | Admin | `admin@demo.skillbridge` | `Demo@1234` |

Script skeleton:

```ts
import { connectDB } from "../config/db";
import { env } from "../config/env";
import mongoose from "mongoose";
// import models…

async function main() {
  await connectDB(env.MONGODB_URI);
  await Promise.all([/* Model.deleteMany({}) for each collection */]);
  // insert skills → orgs → opportunities → seekers → evidence → a few applications
  console.log("🌱 Seed complete");
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
```

```powershell
cd server
npm run seed
```

---

## Step 12 – Integration, testing and Bob review

1. Run both apps (two terminals): `cd server; npm run dev` and `cd client; npm run dev`.
2. Walk the **golden journey** by hand:

   > Student creates a profile → NGO publishes an opportunity → SkillBridge finds the match → student reads the explanation → student applies → NGO reviews and accepts → NGO endorses the skill → the student's Evidence score goes up.

3. Switch Bob to **Ask/Agent** (or your **QA Reviewer** mode) and run **Prompt P6**. Fix the critical findings first.
4. Run `npm run build` in **both** `client` and `server`. Fix every TypeScript error before deploying.
5. Run `npm test` (server).
6. Re-run `/init` in Bob so `AGENTS.md` reflects the finished code. Update `docs/IBM_BOB_USAGE.md`.

---

## Step 13 – Deployment

### MongoDB Atlas

Under *Network Access*, add `0.0.0.0/0` (Render IPs change). Use the same connection string as in local `.env`.

### Backend → Render (Web Service)

| Setting | Value |
|---|---|
| Root directory | `server` |
| Build command | `npm install --include=dev && npm run build` |
| Start command | `npm start` |
| Environment variables | `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `CLIENT_URL=https://<your-app>.vercel.app` |

(`--include=dev` makes sure `typescript` is installed for the build step. Render sets `PORT` itself, and our env schema reads it.)

Run the seed once against the production DB: from your machine, temporarily point `.env` at the production URI and run `npm run seed`.

### Frontend → Vercel

| Setting | Value |
|---|---|
| Root directory | `client` |
| Framework preset | Vite |
| Environment variable | `VITE_API_URL=https://<your-api>.onrender.com/api` |

Add `client/vercel.json` so page refreshes on routes like `/seeker/matches` don't 404:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

> Free Render services sleep when idle. Open the API URL ~1 minute before judging to wake it.

---

## Step 14 – Demo script for the judges

**Total time: about 5 minutes.** Practise it twice.

1. **Problem (30 s):** the three-person story (student, NGO, small business). Say plainly that job portals filter people out by resume.
2. **Your Next Opportunity (60 s):** paste the student sentence → profile chips appear → top 3 matches with % → "Your next step: …".
3. **Explainability (45 s):** open a match and show the S/A/L/E/P breakdown and the AI explanation. Point out that *the score is deterministic and the AI only explains it.*
4. **Gap Analyzer (45 s):** open a near miss (e.g. a MERN role where the student lacks MongoDB) → have / missing / learn next / alternatives.
5. **Organisation side (60 s):** the NGO posts an opportunity (with accessibility provided) → sees applicants ranked by match → accepts → endorses a skill.
6. **Accessibility (20 s):** log in as the wheelchair-user seeker. On-site roles without access are filtered out, and remote/accessible ones remain.
7. **Efficiency, with measured numbers (20 s):** show "N opportunities evaluated in X ms" from the matching service. Show how many matches were found versus a keyword-only filter on the same seed data. *Present these as prototype measurements, not real-world impact claims.*
8. **IBM Bob (40 s):** show `docs/IBM_BOB_USAGE.md`, the `.bob/rules` file, and a 30-second screen recording of Bob going Plan → Agent → tests on one feature.

**Fallback:** if the Gemini API fails, explanations and the gap analysis switch to their deterministic templates automatically, and the demo continues.

---

## IBM Bob workflow — all prompts

Use Bob **phase by phase**. Never ask it to generate the whole app in one prompt. After each phase: review the diff → run the build/tests → commit → log it in `docs/IBM_BOB_USAGE.md`.

| Phase | Bob mode | Goal |
|---|---|---|
| P1 Architecture | **Plan** | Schema, API contract, module boundaries, matching algorithm, page map |
| P2 Backend core | **Agent** | Auth, users, skills, opportunities, applications |
| P3 Matching intelligence | **Agent** | Engine + tests, AI service, Gap Analyzer, assistant |
| P4 Frontend | **Agent** | Seeker, organisation and admin UIs against the frozen contract |
| P5 Integration | **Agent** | Wire everything, seed data, fix integration bugs |
| P6 Review | **Ask + Agent** (or QA Reviewer mode) | Security, edge cases, tests, final report |

### P1 – Architecture (Plan mode)

```text
We are building SkillBridge, an AI-powered opportunity matching platform for students,
local workers, NGOs and small businesses in Bhubaneswar.

Technology: React + Vite + TypeScript, Tailwind v4 + shadcn/ui, TanStack Query,
Node.js + Express 5 + TypeScript (CommonJS), MongoDB Atlas + Mongoose, Zod, JWT,
Gemini API via @google/genai.

Core features:
1. User profiles and skill portfolios ("Skill DNA").
2. Organisation opportunity publishing (location/remote, skills with min level and
   mandatory flag, hours, compensation, accessibility provided).
3. AI-assisted skill extraction from free text.
4. Hybrid matching: deterministic hard filters + weighted score
   M = 0.40S + 0.20A + 0.15L + 0.15E + 0.10P, then AI explanations.
5. Opportunity Gap Analyzer.
6. Applications and status tracking.
7. Skill evidence and organisation endorsements.
8. "Your Next Opportunity" assistant (free text -> profile -> top 3 -> next step).

Read README.md and .bob/rules/skillbridge-rules.md first. Then prepare:
- Implementation plan with milestones
- Modular architecture (server/src/modules/<name>)
- Mongoose schemas for Users, Skills, Opportunities, Applications, SkillEvidence, Matches, Reviews
- REST API contract (methods, paths, roles, request/response JSON)
- Security design (JWT, roles, validation, secrets)
- Matching algorithm details and edge cases
- Frontend page and component structure

Prioritise a working MVP within a short hackathon deadline.
Avoid microservices, unnecessary packages, vector databases and overengineering.
Do not implement anything until the architecture and API contract are reviewed.
Write the approved result to docs/ARCHITECTURE.md, docs/API_CONTRACT.md and docs/DATABASE_SCHEMA.md.
```

### P2 – Backend core (Agent mode)

```text
Implement the backend following docs/API_CONTRACT.md and docs/DATABASE_SCHEMA.md.
Start in this order, one module at a time:
1. users (GET/PUT /api/users/me)
2. skills (catalogue + GET /api/skills?q=) and utils/skills.ts normalisation
3. opportunities (CRUD for ORGANISATION owners, browse with type/remote/geo filters
   using $geoWithin + $centerSphere)
4. applications (apply, my applications, applicants for owner, status updates with history)

For each module create model, zod schema, service, controller and routes, and mount
them in app.ts. Use requireAuth/requireRole. Validate every input with zod.
After each module run `npm run build` and fix all TypeScript errors.
Do not implement matching or AI yet.
```

### P3 – Matching intelligence (Agent mode)

```text
Implement server/src/modules/matching using the engine described in README Step 7
(hard filters, weighted score, matched/missing skills, blockers, distance).
Then:
1. matching.service.ts: rankForSeeker() returning matches, nearMisses, evaluated, ms.
2. GET /api/matches/me with explanations from ai.service.explainMatch, cached in the Match collection.
3. GET /api/matches/gap/:opportunityId using ai.service.analyseGap and the user's eligible alternatives.
4. POST /api/users/me/extract-skills and POST /api/assistant/next-opportunity
   using ai.service.extractProfile + normaliseSkill.
Rules: the LLM must never compute or modify scores; every AI call has a timeout,
zod validation of the response and a deterministic fallback; no API keys in responses or logs.
Write vitest unit tests for the engine (remote-only, mandatory skill missing,
accessibility blocking, perfect match, skill alias normalisation) and run them.
```

### P4 – Frontend (Agent mode)

```text
Build the SkillBridge frontend in client/ using React, TypeScript, Vite, Tailwind v4,
shadcn/ui, TanStack Query, react-hook-form + zod and the axios instance in src/services/api.ts.
Implement AuthContext and ProtectedRoute, then the pages listed in README Step 10
(landing, auth, seeker dashboard/profile/matches/gap/assistant/applications,
organisation dashboard/new opportunity/applicants, opportunity details, admin stats).
Components: MatchBadge, ScoreBreakdown (S/A/L/E/P progress bars), GapPanel, SkillChip, OpportunityCard.
Design a clean, professional, accessible civic-tech look: one accent colour, cards,
mobile-first responsive layouts, visible focus states, aria labels.
Every data view needs loading, empty and error states.
Integrate with the real backend endpoints in docs/API_CONTRACT.md — no mock APIs.
Run `npm run build` and fix all errors.
```

### P5 – Integration (Agent mode)

```text
Write server/src/scripts/seed.ts as described in README Step 11 (Bhubaneswar skills, organisations,
opportunities with real coordinates, varied seekers including remote-only and
accessibility-needs users, evidence, demo accounts). Run it.
Then test the golden journey end to end: seeker profile -> organisation posts opportunity ->
match appears with explanation -> seeker applies -> organisation accepts and endorses a skill ->
seeker's evidence score increases. Fix every integration bug you find. Show measured
"opportunities evaluated in X ms" on the seeker matches page.
```

### P6 – Final review (Ask + Agent / QA Reviewer)

```text
Perform an end-to-end review of SkillBridge. Check:
- API/frontend contract mismatches
- Authentication, role checks and ownership checks (an org must not edit another org's data)
- Input validation and error responses
- passwordHash or secrets ever leaking in responses/logs
- AI response validation, timeouts and fallbacks
- Matching edge cases (no skills, no location, zero hours, empty requiredSkills)
- Skill normalisation consistency
- MongoDB indexes (2dsphere, unique application per user/opportunity)
- Responsive UI and accessibility basics
Run all builds and tests. Fix critical defects, list the remaining issues by severity,
and write a short testing report to docs/TEST_REPORT.md.
Do not silently remove existing functionality.
```

### Using Bob in parallel (subagents or teammates)

Only split work **after** P1 has frozen the API contract. Suggested split:

| Agent / person | Owns | Must not touch |
|---|---|---|
| Backend | `server/src/modules/*` (except matching), models | `client/`, `engine.ts` |
| AI / matching | `modules/matching`, `services/ai.service.ts`, tests | auth, UI |
| Frontend | `client/src/**` | `server/` |
| QA | tests, `docs/TEST_REPORT.md` | feature code (reports only) |

Shared files (`app.ts`, `constants.ts`, `docs/API_CONTRACT.md`) are changed by one person only. Integrate and test incrementally.

---

## 5-day schedule and MVP scope

| Day | Deliverable | Bob phase |
|---|---|---|
| **1** | Repo, Bob `/init` + rules, approved architecture, server scaffold, auth, models, profiles | P1, P2 (start) |
| **2** | Opportunities (create, browse, geo), applications API, client scaffold, auth pages | P2, P4 (start) |
| **3** | Matching engine + tests, AI service, match explanations, skill extraction | P3 |
| **4** | Gap Analyzer, assistant, seeker/org dashboards, applicants view, seed data | P4, P5 |
| **5** | Review + fixes, deployment, polish, demo rehearsal, Bob evidence write-up | P6 |

**Less than 5 days?** Cut evidence/reviews and admin. Keep the golden journey + Gap Analyzer + assistant, and use seed data.

| Feature | Priority |
|---|---|
| Seeker & organisation registration | Must have |
| Skill profile creation | Must have |
| Opportunity publishing | Must have |
| AI-assisted matching + explanations | Must have |
| Application tracking | Must have |
| Opportunity Gap Analyzer | High |
| "Your Next Opportunity" assistant | High |
| Skill evidence / endorsements | High |
| Location-based discovery | High |
| Admin stats | Nice to have |
| Chat/messaging, payments, complex recommendation models | Later (out of scope) |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `MongooseServerSelectionError` / timeout | Atlas → Network Access → add your IP (or `0.0.0.0/0`). Check the user/password in the URI (URL-encode special characters). |
| `Relative import paths need explicit file extensions` / ESM errors on the server | You kept the `tsc --init` defaults or added `"type": "module"`. Use the exact `tsconfig.json` from Step 3 and remove `"type"` from `package.json`. |
| Server crashes on start with a zod error | A required `.env` variable is missing, or `JWT_SECRET` is shorter than 32 characters. |
| CORS error in the browser | `CLIENT_URL` on the server must exactly match the frontend origin (no trailing slash). |
| shadcn: *"No import alias found"* | Add `"paths": { "@/*": ["./src/*"] }` to **both** `tsconfig.json` and `tsconfig.app.json`. |
| Tailwind classes not applying | `src/index.css` must contain `@import "tailwindcss";` and `vite.config.ts` must include `tailwindcss()`. |
| Gemini 429 / quota / model-not-found | Check `GEMINI_MODEL` against the current models page. The fallbacks keep the app working while you fix it. |
| AI returns invalid JSON → zod error | Keep `responseMimeType: "application/json"` + `responseJsonSchema`, lower the temperature, simplify the schema. The fallback catches the rest. |
| Same skill counted twice ("React" vs "ReactJS") | Always save skills through `normaliseSkill()`. Add the missing alias to the Skill catalogue. |
| `$near is not allowed inside $or` | Use `$geoWithin` + `$centerSphere` (Step 6). |
| Vercel page refresh gives 404 | Add `client/vercel.json` with the SPA rewrite (Step 13). |
| First request on Render is very slow | The free tier sleeps. Wake it before the demo. |
| Render build: `tsc: not found` | Use the build command `npm install --include=dev && npm run build`. |

---

### Golden rule

> First lock the project structure, schemas and API contract. Then build and test **one vertical feature at a time**. A polished journey that works end to end beats fifteen half-working features.

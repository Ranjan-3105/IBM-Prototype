import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { app } from "../src/app";
import { User } from "../src/modules/users/user.model";
import { signToken } from "../src/middleware/auth";
import type { Role } from "../src/modules/common/constants";

// ---------------------------------------------------------------------------
// In-memory user store (mirrors the auth.test.ts pattern)
// ---------------------------------------------------------------------------
interface StoredUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  orgType?: string;
  headline?: string;
  bio?: string;
  photoUrl?: string;
  education?: string;
  college?: string;
  locationName?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  description?: string;
  logoUrl?: string;
  contactEmail?: string;
  website?: string;
  verified?: boolean;
  skills: Array<{ skill: string; level: number; source: string }>;
  availability?: { hoursPerWeek: number; remoteOnly: boolean; maxTravelKm: number };
  preferences?: { types: string[]; paidOnly: boolean; workMode?: string };
  area?: string;
  city?: string;
  location?: { type: string; coordinates: [number, number] };
  toJSON(): Record<string, unknown>;
  set(key: string | Record<string, unknown>, val?: unknown): void;
  save(): Promise<void>;
}

describe("Milestone 3: Profiles & Skills Management", () => {
  let server: Server;
  let baseUrl: string;

  const memoryDb = new Map<string, StoredUser>();
  let idCounter = 100;

  function makeUser(overrides: Partial<StoredUser>): StoredUser {
    const id = `user_${idCounter++}`;
    const doc: StoredUser = {
      _id: id,
      id,
      name: "Test User",
      email: `test_${id}@demo.skillbridge`,
      passwordHash: "hash",
      role: "SEEKER",
      skills: [],
      verified: false,
      ...overrides,
      toJSON() {
        const { passwordHash: _p, ...rest } = this;
        return { ...rest };
      },
      set(keyOrObj: string | Record<string, unknown>, val?: unknown) {
        if (typeof keyOrObj === "string") {
          (this as Record<string, unknown>)[keyOrObj] = val;
        } else {
          Object.assign(this, keyOrObj);
        }
      },
      async save() {
        memoryDb.set(this.id, this);
      },
    };
    memoryDb.set(id, doc);
    return doc;
  }

  // Tokens
  let seekerToken: string;
  let seekerUserId: string;
  let orgToken: string;
  let orgUserId: string;

  beforeAll(async () => {
    // Create seeker
    const seeker = makeUser({ role: "SEEKER", name: "Alice Seeker", email: "alice@demo.skillbridge" });
    seekerUserId = seeker.id;
    seekerToken = signToken({ id: seeker.id, role: "SEEKER" });

    // Create org
    const org = makeUser({
      role: "ORGANISATION",
      name: "Test Org",
      email: "org@demo.skillbridge",
      orgType: "NGO",
      verified: false,
    });
    orgUserId = org.id;
    orgToken = signToken({ id: org.id, role: "ORGANISATION" });

    // --- Mock User static methods ---
    vi.spyOn(User, "findById").mockImplementation((id: unknown) => {
      const user = memoryDb.get(String(id)) ?? null;
      return {
        then: (resolve: (u: StoredUser | null) => unknown) => Promise.resolve(user).then(resolve),
        lean: () => Promise.resolve(user ? { ...user } : null),
      } as any;
    });

    vi.spyOn(User, "findOne").mockImplementation(() => {
      return { select: () => Promise.resolve(null) } as any;
    });

    // --- Mock SkillEvidence ---
    const { SkillEvidence } = await import("../src/modules/evidence/evidence.model");
    vi.spyOn(SkillEvidence, "find").mockImplementation(() => ({
      lean: () => Promise.resolve([]),
    } as any));

    // --- Mock skill normalisation ---
    const skillsUtil = await import("../src/utils/skills");
    vi.spyOn(skillsUtil, "normaliseSkill").mockImplementation(async (s: string) => {
      const known: Record<string, string> = {
        "javascript": "javascript",
        "react": "react",
        "python": "python",
        "nodejs": "nodejs",
        "node.js": "nodejs",
        "communication": "communication",
      };
      return known[s.toLowerCase()] ?? null;
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  // ─── Seeker GET /api/users/me ─────────────────────────────────────────────

  describe("GET /api/users/me (SEEKER)", () => {
    it("1. returns seeker profile with stats when authenticated", async () => {
      const res = await fetch(`${baseUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${seekerToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(seekerUserId);
      expect(data.role).toBe("SEEKER");
      expect(data.stats).toBeDefined();
      expect(data.passwordHash).toBeUndefined();
    });

    it("2. returns 401 without token", async () => {
      const res = await fetch(`${baseUrl}/api/users/me`);
      expect(res.status).toBe(401);
    });
  });

  // ─── Seeker PATCH /api/users/me ───────────────────────────────────────────

  describe("PATCH /api/users/me (SEEKER)", () => {
    it("3. updates seeker profile fields", async () => {
      const res = await fetch(`${baseUrl}/api/users/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${seekerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Alice Updated",
          bio: "Frontend developer",
          education: "B.Tech",
          college: "ITER Bhubaneswar",
          locationName: "Bhubaneswar, Odisha",
          portfolioUrl: "https://alice.dev",
          githubUrl: "https://github.com/alice",
          linkedinUrl: "https://linkedin.com/in/alice",
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.bio).toBe("Frontend developer");
      expect(data.education).toBe("B.Tech");
      expect(data.college).toBe("ITER Bhubaneswar");
      expect(data.locationName).toBe("Bhubaneswar, Odisha");
      expect(data.portfolioUrl).toBe("https://alice.dev");
    });

    it("4. rejects ORGANISATION user from PATCH /api/users/me", async () => {
      const res = await fetch(`${baseUrl}/api/users/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${orgToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Hacker Org" }),
      });
      expect(res.status).toBe(403);
    });

    it("5. rejects unknown skill in skills array", async () => {
      const res = await fetch(`${baseUrl}/api/users/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${seekerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skills: [{ skill: "completely-unknown-xyz", level: 3 }],
        }),
      });
      expect(res.status).toBe(400);
    });

    it("6. rejects attempts to set verified via PATCH /api/users/me (strict schema)", async () => {
      const res = await fetch(`${baseUrl}/api/users/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${seekerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ verified: true }),
      });
      expect(res.status).toBe(400); // strict() rejects unknown keys
    });
  });

  // ─── Organisation GET /api/organisations/me ───────────────────────────────

  describe("GET /api/organisations/me (ORGANISATION)", () => {
    it("7. returns org profile when authenticated as ORGANISATION", async () => {
      const res = await fetch(`${baseUrl}/api/organisations/me`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(orgUserId);
      expect(data.role).toBe("ORGANISATION");
      expect(data.stats).toBeNull();
      expect(data.passwordHash).toBeUndefined();
    });

    it("8. rejects SEEKER from GET /api/organisations/me", async () => {
      const res = await fetch(`${baseUrl}/api/organisations/me`, {
        headers: { Authorization: `Bearer ${seekerToken}` },
      });
      expect(res.status).toBe(403);
    });

    it("9. returns 401 without token", async () => {
      const res = await fetch(`${baseUrl}/api/organisations/me`);
      expect(res.status).toBe(401);
    });
  });

  // ─── Organisation PATCH /api/organisations/me ────────────────────────────

  describe("PATCH /api/organisations/me (ORGANISATION)", () => {
    it("10. updates org profile fields", async () => {
      const res = await fetch(`${baseUrl}/api/organisations/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${orgToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: "We empower local youth",
          website: "https://testngo.org",
          contactEmail: "contact@testngo.org",
          locationName: "Cuttack, Odisha",
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.description).toBe("We empower local youth");
      expect(data.website).toBe("https://testngo.org");
      expect(data.locationName).toBe("Cuttack, Odisha");
    });

    it("11. verified cannot be set via PATCH /api/organisations/me", async () => {
      const res = await fetch(`${baseUrl}/api/organisations/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${orgToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ verified: true }),
      });
      // strict() rejects unknown key
      expect(res.status).toBe(400);
    });

    it("12. rejects SEEKER from PATCH /api/organisations/me", async () => {
      const res = await fetch(`${baseUrl}/api/organisations/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${seekerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: "hacker" }),
      });
      expect(res.status).toBe(403);
    });
  });

  // ─── Skill management POST /api/users/me/skills ───────────────────────────

  describe("POST /api/users/me/skills (SEEKER)", () => {
    it("13. adds a known skill to the seeker profile", async () => {
      const res = await fetch(`${baseUrl}/api/users/me/skills`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${seekerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skill: "javascript", level: 4 }),
      });
      expect(res.status).toBe(201);
      const data = await res.json();
      const added = (data.skills as Array<{ skill: string; level: number }>).find(
        (s) => s.skill === "javascript"
      );
      expect(added).toBeDefined();
      expect(added?.level).toBe(4);
    });

    it("14. rejects duplicate skill (409)", async () => {
      const res = await fetch(`${baseUrl}/api/users/me/skills`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${seekerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skill: "javascript", level: 3 }),
      });
      expect(res.status).toBe(409);
    });

    it("15. rejects unknown skill (400)", async () => {
      const res = await fetch(`${baseUrl}/api/users/me/skills`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${seekerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skill: "quantum-teleportation", level: 2 }),
      });
      expect(res.status).toBe(400);
    });

    it("16. rejects ORGANISATION from adding skills", async () => {
      const res = await fetch(`${baseUrl}/api/users/me/skills`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${orgToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skill: "javascript", level: 2 }),
      });
      expect(res.status).toBe(403);
    });

    it("17. rejects level out of range (400)", async () => {
      const res = await fetch(`${baseUrl}/api/users/me/skills`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${seekerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skill: "python", level: 99 }),
      });
      expect(res.status).toBe(400);
    });
  });

  // ─── Skill management PATCH /api/users/me/skills/:slug ───────────────────

  describe("PATCH /api/users/me/skills/:slug (SEEKER)", () => {
    it("18. edits an existing skill level", async () => {
      // First add react
      await fetch(`${baseUrl}/api/users/me/skills`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${seekerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skill: "react", level: 2 }),
      });

      const res = await fetch(`${baseUrl}/api/users/me/skills/react`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${seekerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ level: 5 }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      const skill = (data.skills as Array<{ skill: string; level: number }>).find(
        (s) => s.skill === "react"
      );
      expect(skill?.level).toBe(5);
    });

    it("19. returns 404 for skill not in profile", async () => {
      const res = await fetch(`${baseUrl}/api/users/me/skills/nonexistent-skill`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${seekerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ level: 3 }),
      });
      expect(res.status).toBe(404);
    });
  });

  // ─── Skill management DELETE /api/users/me/skills/:slug ──────────────────

  describe("DELETE /api/users/me/skills/:slug (SEEKER)", () => {
    it("20. removes an existing skill", async () => {
      // Add communication first
      await fetch(`${baseUrl}/api/users/me/skills`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${seekerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skill: "communication", level: 3 }),
      });

      const res = await fetch(`${baseUrl}/api/users/me/skills/communication`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${seekerToken}` },
      });
      expect(res.status).toBe(204);
    });

    it("21. returns 404 when removing non-existent skill", async () => {
      const res = await fetch(`${baseUrl}/api/users/me/skills/communication`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${seekerToken}` },
      });
      expect(res.status).toBe(404);
    });
  });

  // ─── Skill catalogue GET /api/skills ─────────────────────────────────────

  describe("GET /api/skills", () => {
    it("22. returns skill list (public)", async () => {
      const { Skill } = await import("../src/modules/skills/skill.model");
      vi.spyOn(Skill, "find").mockReturnValue({
        sort: () => ({ limit: () => ({ lean: () => Promise.resolve([
          { slug: "javascript", name: "JavaScript", category: "FRONTEND" },
          { slug: "react", name: "React", category: "FRONTEND" },
        ]) }) }),
      } as any);

      const res = await fetch(`${baseUrl}/api/skills`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });
  });
});


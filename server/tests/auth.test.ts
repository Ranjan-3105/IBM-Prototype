import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import bcrypt from "bcryptjs";
import { app } from "../src/app";
import { User } from "../src/modules/users/user.model";
import { signToken } from "../src/middleware/auth";
import type { Role } from "../src/modules/common/constants";

describe("Milestone 2: Authentication & Authorisation", () => {
  let server: Server;
  let baseUrl: string;

  // In-memory store simulating database persistence
  interface StoredUser {
    _id: string;
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
    orgType?: string;
    toObject: () => Record<string, unknown>;
    toJSON: () => Record<string, unknown>;
  }

  const memoryDb = new Map<string, StoredUser>();
  let idCounter = 1;

  beforeAll(async () => {
    // Mock User database calls with in-memory persistence
    vi.spyOn(User, "exists").mockImplementation(async (filter: unknown) => {
      const email = (filter as { email?: string })?.email?.toLowerCase();
      for (const u of memoryDb.values()) {
        if (u.email === email) return { _id: u._id } as any;
      }
      return null;
    });

    vi.spyOn(User, "create").mockImplementation(async (doc: any) => {
      const id = `user_${idCounter++}`;
      const record: StoredUser = {
        _id: id,
        id,
        name: doc.name,
        email: doc.email.toLowerCase(),
        passwordHash: doc.passwordHash,
        role: doc.role,
        orgType: doc.orgType,
        toObject() {
          const { passwordHash: _p, ...rest } = this;
          return rest;
        },
        toJSON() {
          const { passwordHash: _p, ...rest } = this;
          return rest;
        },
      };
      memoryDb.set(id, record);
      return record as any;
    });

    vi.spyOn(User, "findOne").mockImplementation((filter: unknown) => {
      const email = (filter as { email?: string })?.email?.toLowerCase();
      let found: StoredUser | null = null;
      for (const u of memoryDb.values()) {
        if (u.email === email) {
          found = u;
          break;
        }
      }
      const query = {
        select: (_fields: string) => Promise.resolve(found),
        then: (resolve: any) => Promise.resolve(found).then(resolve),
      };
      return query as any;
    });

    vi.spyOn(User, "findById").mockImplementation((id: unknown) => {
      const found = memoryDb.get(String(id)) ?? null;
      const query = {
        then: (resolve: any) => Promise.resolve(found ? found.toJSON() : null).then(resolve),
      };
      return query as any;
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

  describe("Registration (POST /api/auth/register)", () => {
    it("1. registers a seeker successfully with canonical SEEKER role", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Soumya Seeker",
          email: "soumya@demo.skillbridge",
          password: "Password@123",
          role: "SEEKER",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(typeof data.token).toBe("string");
      expect(data.user).toMatchObject({
        name: "Soumya Seeker",
        email: "soumya@demo.skillbridge",
        role: "SEEKER",
      });
      // passwordHash must NEVER be returned
      expect(data.passwordHash).toBeUndefined();
      expect(data.user.passwordHash).toBeUndefined();

      // Verify that stored password in DB is hashed with bcrypt
      const stored = Array.from(memoryDb.values()).find((u) => u.email === "soumya@demo.skillbridge");
      expect(stored).toBeDefined();
      expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/);
      expect(await bcrypt.compare("Password@123", stored!.passwordHash)).toBe(true);
    });

    it("2. registers an organisation with valid orgType", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Bhubaneswar NGO",
          email: "ngo@demo.skillbridge",
          password: "Password@123",
          role: "ORGANISATION",
          orgType: "NGO",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.user.role).toBe("ORGANISATION");
      expect(data.passwordHash).toBeUndefined();
    });

    it("3. rejects organisation registration when orgType is missing", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Missing Type Org",
          email: "missing@demo.skillbridge",
          password: "Password@123",
          role: "ORGANISATION",
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.message).toBe("Validation failed");
      expect(data.issues[0]?.message).toMatch(/orgType is required/i);
    });

    it("4. rejects duplicate email registration with 409 Conflict", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Duplicate Seeker",
          email: "soumya@demo.skillbridge", // already registered in test 1
          password: "Password@123",
          role: "SEEKER",
        }),
      });

      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.message).toBe("Email already registered");
    });

    it("5. rejects public ADMIN registration attempt with 400 Bad Request", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Attempted Admin",
          email: "hacker@demo.skillbridge",
          password: "Password@123",
          role: "ADMIN",
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.message).toBe("Validation failed");
    });

    it("6. rejects passwords shorter than 8 characters", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Short Pwd",
          email: "short@demo.skillbridge",
          password: "short",
          role: "SEEKER",
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.message).toBe("Validation failed");
    });
  });

  describe("Login (POST /api/auth/login)", () => {
    it("7. logs in successfully with valid credentials", async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "soumya@demo.skillbridge",
          password: "Password@123",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(typeof data.token).toBe("string");
      expect(data.user.email).toBe("soumya@demo.skillbridge");
      expect(data.user.role).toBe("SEEKER");
      expect(data.passwordHash).toBeUndefined();
      expect(data.user.passwordHash).toBeUndefined();
    });

    it("8. rejects login with incorrect password", async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "soumya@demo.skillbridge",
          password: "WrongPassword@999",
        }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.message).toBe("Invalid email or password");
    });

    it("9. rejects login with non-existent email", async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nobody@demo.skillbridge",
          password: "Password@123",
        }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.message).toBe("Invalid email or password");
    });
  });

  describe("Protected Endpoint (GET /api/auth/me)", () => {
    it("10. returns current user profile when valid token is supplied", async () => {
      // Login first to get token
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "soumya@demo.skillbridge",
          password: "Password@123",
        }),
      });
      const { token } = await loginRes.json();

      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(meRes.status).toBe(200);
      const profile = await meRes.json();
      expect(profile.email).toBe("soumya@demo.skillbridge");
      expect(profile.role).toBe("SEEKER");
      expect(profile.passwordHash).toBeUndefined();
    });

    it("11. rejects request with missing Authorization header (401)", async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.message).toBe("Unauthorised");
    });

    it("12. rejects request with forged/invalid token (401)", async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: "Bearer forged.token.signature" },
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.message).toBe("Invalid or expired token");
    });

    it("13. rejects request with expired JWT token (401)", async () => {
      const expiredToken = signToken({ id: "user_1", role: "SEEKER" }, { expiresIn: "-1s" });

      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${expiredToken}` },
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.message).toBe("Token has expired");
    });
  });

  describe("Role-Based Authorisation & Access Restrictions", () => {
    it("14. forbids SEEKER from accessing ORGANISATION-only endpoint (403)", async () => {
      const seekerToken = signToken({ id: "user_1", role: "SEEKER" });

      // POST /api/opportunities is restricted to ORGANISATION
      const res = await fetch(`${baseUrl}/api/opportunities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${seekerToken}`,
        },
        body: JSON.stringify({ title: "Test Opp" }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.message).toBe("Forbidden");
    });

    it("15. allows ORGANISATION to access ORGANISATION-only endpoint", async () => {
      const orgToken = signToken({ id: "user_2", role: "ORGANISATION" });

      const res = await fetch(`${baseUrl}/api/opportunities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${orgToken}`,
        },
        body: JSON.stringify({}),
      });

      // Role check passed: should NOT return 403 (it reaches schema validation -> 400 because body is empty)
      expect(res.status).not.toBe(403);
      expect(res.status).toBe(400); // 400 from Zod validation
    });
  });

  describe("Logout (POST /api/auth/logout)", () => {
    it("16. returns success and stateless logout semantics", async () => {
      const res = await fetch(`${baseUrl}/api/auth/logout`, {
        method: "POST",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.stateless).toBe(true);
      expect(typeof data.message).toBe("string");
    });
  });
});


import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import mongoose from "mongoose";
import { app } from "../src/app";
import { disconnectDB } from "../src/config/db";
import { EnvSchema } from "../src/config/env";



describe("backend foundation", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await disconnectDB();
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  describe("liveness and readiness", () => {
    it("GET /api/health returns 200 and liveness payload", async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(typeof data.ai).toBe("string");
      expect(typeof data.uptime).toBe("number");
      expect(typeof data.timestamp).toBe("string");
    });

    it("GET /api/ready returns 503 when DB is disconnected", async () => {
      await disconnectDB();
      const res = await fetch(`${baseUrl}/api/ready`);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.db).toBe("disconnected");
    });

    it("GET /api/ready returns 200 when connected", async () => {
      const readyStateSpy = vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(1);
      try {
        const res = await fetch(`${baseUrl}/api/ready`);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.ok).toBe(true);
        expect(data.db).toBe("connected");
      } finally {
        readyStateSpy.mockRestore();
      }
    });

  });

  describe("routing & error handling", () => {
    it("returns consistent 404 JSON for unknown API routes", async () => {
      const res = await fetch(`${baseUrl}/api/unknown-endpoint`);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toEqual({ message: "Route not found" });
    });

    it("returns consistent 404 JSON for non-API routes", async () => {
      const res = await fetch(`${baseUrl}/some-random-route`);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toEqual({ message: "Route not found" });
    });

    it("handles malformed JSON body gracefully", async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ broken json",
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toEqual({ message: "Malformed JSON body" });
    });
  });

  describe("environment variable validation", () => {
    const validBase = {
      NODE_ENV: "development",
      PORT: "5000",
      MONGODB_URI: "mongodb://127.0.0.1:27017/skillbridge",
      JWT_SECRET: "a-secret-string-that-is-at-least-32-chars-long",
    };

    it("accepts valid environment settings", () => {
      const parsed = EnvSchema.safeParse(validBase);
      expect(parsed.success).toBe(true);
    });

    it("rejects JWT_SECRET under 32 characters", () => {
      const parsed = EnvSchema.safeParse({ ...validBase, JWT_SECRET: "short-secret" });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toMatch(/at least 32 characters/);
      }
    });

    it("rejects MONGODB_URI=memory in production", () => {
      const parsed = EnvSchema.safeParse({
        ...validBase,
        NODE_ENV: "production",
        MONGODB_URI: "memory",
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toMatch(/forbidden in production/);
      }
    });

    it("rejects invalid non-mongodb URIs in production", () => {
      const parsed = EnvSchema.safeParse({
        ...validBase,
        NODE_ENV: "production",
        MONGODB_URI: "http://invalid-db-url.com",
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toMatch(/valid MongoDB Atlas connection string/);
      }
    });

    it("rejects out-of-range port numbers", () => {
      const parsed = EnvSchema.safeParse({ ...validBase, PORT: "999999" });
      expect(parsed.success).toBe(false);
    });
  });
});



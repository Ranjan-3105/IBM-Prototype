import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Unit tests never touch the DB or Gemini; these just satisfy env validation.
    env: {
      MONGODB_URI: "mongodb://127.0.0.1:27017/skillbridge-test",
      JWT_SECRET: "test-secret-test-secret-test-secret-123",
      GEMINI_API_KEY: "",
    },
  },
});

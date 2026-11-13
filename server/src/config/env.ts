import "dotenv/config";
import { z } from "zod";

export const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_EXPIRES_IN: z.string().default("2h"),
    // Optional: without an API key, all AI capabilities use deterministic fallbacks
    GEMINI_API_KEY: z.string().default(""),
    GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
    CLIENT_URL: z.string().default("http://localhost:5173"),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production") {
      if (data.MONGODB_URI === "memory") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["MONGODB_URI"],
          message: "MONGODB_URI=memory is forbidden in production. Use MongoDB Atlas (mongodb+srv://...).",
        });
      } else if (!data.MONGODB_URI.startsWith("mongodb://") && !data.MONGODB_URI.startsWith("mongodb+srv://")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["MONGODB_URI"],
          message: "Production MONGODB_URI must be a valid MongoDB Atlas connection string (mongodb+srv://... or mongodb://...).",
        });
      }
    }
  });

function loadEnv() {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    for (const issue of result.error.issues) {
      console.error(`   - ${issue.path.join(".") || "env"}: ${issue.message}`);
    }
    throw new Error("Invalid environment configuration. Fix the variables above and restart.");
  }
  return result.data;
}

export const env = loadEnv();

/** Allowed CORS origins: CLIENT_URL may be a comma-separated list (e.g. Vercel prod + preview). */
export const clientOrigins = env.CLIENT_URL.split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);


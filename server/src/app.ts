import express from "express";
import cors from "cors";
import { clientOrigins } from "./config/env";
import { getDbState } from "./config/db";
import { errorHandler, notFound } from "./middleware/errorHandler";
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/user.routes";
import orgRoutes from "./modules/organisations/org.routes";
import skillRoutes from "./modules/skills/skill.routes";
import evidenceRoutes from "./modules/evidence/evidence.routes";
import opportunityRoutes from "./modules/opportunities/opportunity.routes";
import matchingRoutes from "./modules/matching/matching.routes";
import applicationRoutes from "./modules/applications/application.routes";
import reviewRoutes from "./modules/reviews/review.routes";
import assistantRoutes from "./modules/assistant/assistant.routes";
import adminRoutes from "./modules/admin/admin.routes";
import { aiEnabled } from "./services/ai.service";

export const app = express();

app.disable("x-powered-by");
app.use(cors({ origin: clientOrigins }));
app.use(express.json({ limit: "1mb" }));

/**
 * Liveness endpoint: returns 200 if the process is alive and responding.
 * Preserves ok and ai fields for compatibility.
 */
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    ai: aiEnabled() ? "gemini" : "fallback",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness endpoint: returns 200 when MongoDB is connected, 503 otherwise.
 */
app.get("/api/ready", (_req, res) => {
  const dbState = getDbState();
  const ready = dbState.readyState === 1;
  const status = ready ? 200 : 503;

  res.status(status).json({
    ok: ready,
    db: dbState.status,
    ai: aiEnabled() ? "gemini" : "fallback",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/organisations", orgRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/evidence", evidenceRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/matches", matchingRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/admin", adminRoutes);

// Catch-all 404 handler for all unmatched routes
app.use(notFound);
app.use(errorHandler);


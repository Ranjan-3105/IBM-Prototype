import { app } from "./app";
import { env } from "./config/env";
import { connectDB, disconnectDB } from "./config/db";
import { ensureCatalogue } from "./modules/skills/skill.service";
import { seedDatabase } from "./scripts/seed";
import { aiEnabled } from "./services/ai.service";

connectDB(env.MONGODB_URI)
  // A fresh test in-memory DB is seeded with demo data; a real DB ensures canonical skill catalogue exists.
  .then(({ memory }) => (memory ? seedDatabase({ quiet: true }) : ensureCatalogue()))
  .then(() => {
    const server = app.listen(env.PORT, () => {
      console.log(`🚀 SkillBridge API running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
      console.log(aiEnabled() ? `🤖 Gemini enabled (${env.GEMINI_MODEL})` : "🤖 GEMINI_API_KEY not set — using deterministic fallbacks");
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.closeIdleConnections?.();
      server.close(async () => {
        await disconnectDB();
        console.log("SkillBridge API shutdown complete.");
        process.exit(0);
      });
      // Safety timeout: force exit if open sockets fail to close in 5 seconds
      setTimeout(() => {
        server.closeAllConnections?.();
        process.exit(0);
      }, 5000).unref();
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  })
  .catch((err) => {
    console.error("❌ Failed to start SkillBridge server:", err);
    process.exit(1);
  });


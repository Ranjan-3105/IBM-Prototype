import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as c from "./user.controller";

const router = Router();

// ─── Seeker profile ───────────────────────────────────────────────────────────
router.get("/me", requireAuth, c.getMe);
router.put("/me", requireAuth, c.updateMe); // legacy — still supported
router.patch("/me", requireAuth, requireRole("SEEKER"), c.updateMe);

// ─── Seeker skill management ──────────────────────────────────────────────────
router.post("/me/skills", requireAuth, requireRole("SEEKER"), c.addSkill);
router.patch("/me/skills/:slug", requireAuth, requireRole("SEEKER"), c.editSkill);
router.delete("/me/skills/:slug", requireAuth, requireRole("SEEKER"), c.removeSkill);

// ─── AI skill extraction ──────────────────────────────────────────────────────
router.post("/me/extract-skills", requireAuth, requireRole("SEEKER"), c.extractSkills);

export default router;

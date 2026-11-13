import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as c from "./matching.controller";

const router = Router();

router.get("/me", requireAuth, requireRole("SEEKER"), c.myMatches);
router.get("/gap/:opportunityId", requireAuth, requireRole("SEEKER"), c.gap);

export default router;

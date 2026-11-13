import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as c from "./assistant.controller";

const router = Router();

router.post("/next-opportunity", requireAuth, requireRole("SEEKER"), c.nextOpportunity);

export default router;

import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as c from "./admin.controller";

const router = Router();

router.get("/stats", requireAuth, requireRole("ADMIN"), c.stats);

export default router;

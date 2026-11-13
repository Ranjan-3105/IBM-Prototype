import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as c from "./skill.controller";

const router = Router();

// The catalogue is public so the landing page / registration can use it too.
router.get("/", c.list);
router.post("/", requireAuth, requireRole("ADMIN"), c.create);

export default router;

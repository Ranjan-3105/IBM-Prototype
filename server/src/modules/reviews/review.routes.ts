import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as c from "./review.controller";

const router = Router();

router.post("/", requireAuth, requireRole("ORGANISATION"), c.create);
router.get("/me", requireAuth, requireRole("SEEKER"), c.aboutMe);

export default router;

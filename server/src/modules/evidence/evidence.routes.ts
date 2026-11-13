import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as c from "./evidence.controller";

const router = Router();

router.post("/", requireAuth, requireRole("SEEKER"), c.create);
router.get("/me", requireAuth, requireRole("SEEKER"), c.mine);
router.delete("/:id", requireAuth, requireRole("SEEKER"), c.remove);
router.post("/:id/endorse", requireAuth, requireRole("ORGANISATION"), c.endorse);

export default router;

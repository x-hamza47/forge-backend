import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { z } from "zod";
import { overview } from "../controllers/overview.controller.js";

const querySchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).optional(),
});

const router = Router();

router.get("/", authenticate, validate(querySchema, "query"), overview);

export default router;
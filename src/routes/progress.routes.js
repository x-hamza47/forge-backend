import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  overview,
  createBody,
  updateBody,
  removeBody,
  createPerf,
  updatePerf,
  removePerf,
} from "../controllers/progress.controller.js";
import {
  createBodySchema,
  updateBodySchema,
  createPerformanceSchema,
  updatePerformanceSchema,
  progressQuerySchema,
} from "../validators/progress.validator.js";
import { idParamSchema } from "../validators/workout.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(progressQuerySchema, "query"), overview);

router.post("/body", validate(createBodySchema), createBody);
router.patch("/body/:id", validate(idParamSchema, "params"), validate(updateBodySchema), updateBody);
router.delete("/body/:id", validate(idParamSchema, "params"), removeBody);

router.post("/performance", validate(createPerformanceSchema), createPerf);
router.patch(
  "/performance/:id",
  validate(idParamSchema, "params"),
  validate(updatePerformanceSchema),
  updatePerf,
);
router.delete("/performance/:id", validate(idParamSchema, "params"), removePerf);

export default router;
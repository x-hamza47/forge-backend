import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { day, analytics, create, update, remove, plan } from "../controllers/meal.controller.js";
import {
  createMealSchema,
  updateMealSchema,
  dayParamSchema,
  analyticsQuerySchema,
} from "../validators/meal.validator.js";
import { idParamSchema } from "../validators/workout.validator.js";

const router = Router();

router.use(authenticate);

router.get("/plan", plan);
router.get("/analytics", validate(analyticsQuerySchema, "query"), analytics);
router.get("/days/:date", validate(dayParamSchema, "params"), day);

router.post("/meals", validate(createMealSchema), create);
router.patch(
  "/meals/:id",
  validate(idParamSchema, "params"),
  validate(updateMealSchema),
  update,
);
router.delete("/meals/:id", validate(idParamSchema, "params"), remove);

export default router;
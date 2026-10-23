import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  list,
  getOne,
  create,
  update,
  remove,
  duplicate,
} from "../controllers/workout.controller.js";
import {
  createWorkoutSchema,
  updateWorkoutSchema,
  listWorkoutsQuerySchema,
  idParamSchema,
} from "../validators/workout.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(listWorkoutsQuerySchema, "query"), list);
router.post("/", validate(createWorkoutSchema), create);
router.get("/:id", validate(idParamSchema, "params"), getOne);
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateWorkoutSchema),
  update,
);
router.delete("/:id", validate(idParamSchema, "params"), remove);
router.post("/:id/duplicate", validate(idParamSchema, "params"), duplicate);

export default router;
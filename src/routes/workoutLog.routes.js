import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  create,
  list,
  getOne,
  remove,
  exerciseNames,
  exerciseProgress,
} from "../controllers/workoutLog.controller.js";
import {
  createLogSchema,
  listLogsQuerySchema,
  exerciseNameParamSchema,
  exerciseProgressQuerySchema,
} from "../validators/workoutLog.validator.js";
import { idParamSchema } from "../validators/workout.validator.js";

const router = Router();

router.use(authenticate);

router.get("/exercises", exerciseNames);
router.get(
  "/exercises/:name/progress",
  validate(exerciseNameParamSchema, "params"),
  validate(exerciseProgressQuerySchema, "query"),
  exerciseProgress,
);

router.post("/", validate(createLogSchema), create);
router.get("/", validate(listLogsQuerySchema, "query"), list);
router.get("/:id", validate(idParamSchema, "params"), getOne);
router.delete("/:id", validate(idParamSchema, "params"), remove);

export default router;
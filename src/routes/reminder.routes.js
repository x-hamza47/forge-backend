import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { list, create, update, remove } from "../controllers/reminder.controller.js";
import {
  createReminderSchema,
  updateReminderSchema,
  reminderIdParamSchema,
} from "../validators/reminder.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", list);
router.post("/", validate(createReminderSchema), create);
router.patch(
  "/:id",
  validate(reminderIdParamSchema, "params"),
  validate(updateReminderSchema),
  update,
);
router.delete("/:id", validate(reminderIdParamSchema, "params"), remove);

export default router;

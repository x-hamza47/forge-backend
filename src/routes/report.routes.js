import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { downloadReport } from "../controllers/report.controller.js";
import {
  reportParamSchema,
  reportQuerySchema,
} from "../validators/report.validator.js";

const router = Router();

router.use(authenticate);

router.get(
  "/:type",
  validate(reportParamSchema, "params"),
  validate(reportQuerySchema, "query"),
  downloadReport,
);

export default router;

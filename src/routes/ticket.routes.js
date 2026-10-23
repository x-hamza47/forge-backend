import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { list, create } from "../controllers/ticket.controller.js";
import { createTicketSchema } from "../validators/ticket.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", list);
router.post("/", validate(createTicketSchema), create);

export default router;

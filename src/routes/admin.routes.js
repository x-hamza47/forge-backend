import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  stats,
  users,
  createUser,
  updateUser,
  userDetails,
  toggleStatus,
  deleteUser,
  tickets,
  updateTicket,
  deleteTicket,
} from "../controllers/admin.controller.js";
import {
  adminUsersQuerySchema,
  createAdminUserSchema,
  updateAdminUserSchema,
  adminTicketsQuerySchema,
  adminTicketUpdateSchema,
} from "../validators/admin.validator.js";

const router = Router();

router.use(authenticate, authorize("admin"));

router.get("/stats", stats);
router.get("/users", validate(adminUsersQuerySchema, "query"), users);
router.post("/users", validate(createAdminUserSchema), createUser);
router.get("/users/:id", userDetails);
router.patch("/users/:id", validate(updateAdminUserSchema), updateUser);
router.patch("/users/:id/status", toggleStatus);
router.delete("/users/:id", deleteUser);

router.get("/tickets", validate(adminTicketsQuerySchema, "query"), tickets);
router.patch("/tickets/:id", validate(adminTicketUpdateSchema), updateTicket);
router.delete("/tickets/:id", deleteTicket);

export default router;

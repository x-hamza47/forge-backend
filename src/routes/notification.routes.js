import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import {
  listNotifications,
  unreadCount,
  readAll,
  readOne,
} from "../controllers/notification.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", listNotifications);
router.get("/unread-count", unreadCount);
router.patch("/read-all", readAll);
router.patch("/:id/read", readOne);

export default router;
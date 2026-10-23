import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import {
  follow,
  unfollow,
  removeMyFollower,
  listFollowers,
  listFollowing,
  listRequests,
  approve,
  reject,
  search,
} from "../controllers/follow.controller.js";

const router = Router();

router.use(authenticate);

router.get("/search", search);
router.get("/requests", listRequests);
router.patch("/requests/:requestId/approve", approve);
router.delete("/requests/:requestId", reject);

router.post("/:id/follow", follow);
router.delete("/:id/follow", unfollow);
router.delete("/:id/followers", removeMyFollower);
router.get("/:id/followers", listFollowers);
router.get("/:id/following", listFollowing);

export default router;
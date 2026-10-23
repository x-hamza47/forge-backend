import { Router } from "express";
import {
  getMyProfile,
  updateMyProfile,
  getPublicByUsername,
} from "../controllers/profile.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { uploadAvatar, processAvatar } from "../middlewares/upload.middleware.js";
import { getMySettings, updateMySettings } from "../controllers/settings.controller.js";

const router = Router();

router.use(authenticate);

router.get("/me", getMyProfile);
router.patch("/me", uploadAvatar, processAvatar, updateMyProfile);
router.get("/me/settings", getMySettings);
router.patch("/me/settings", updateMySettings);
router.get("/u/:username", getPublicByUsername);


export default router;
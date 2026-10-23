import { Router } from "express";
import authRoutes from "./auth.routes.js";
import profileRoutes from "./profile.routes.js";
import followRoutes from "./follow.routes.js";
import notificationRoutes from "./notification.routes.js";
import workoutRoutes from "./workout.routes.js";
import workoutLogRoutes from "./workoutLog.routes.js";
import nutritionRoutes from "./nutrition.routes.js";
import progressRoutes from "./progress.routes.js";
import overviewRoutes from "./overview.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", profileRoutes);
router.use("/users", followRoutes);
router.use("/notifications", notificationRoutes);
router.use("/workouts", workoutRoutes);
router.use("/workout-logs", workoutLogRoutes);
router.use("/nutrition", nutritionRoutes);
router.use("/progress", progressRoutes);
router.use("/overview", overviewRoutes);

export default router;
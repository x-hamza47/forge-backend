import fs from "fs/promises";
import path from "path";
import User from "../models/user.model.js";
import Workout from "../models/workout.model.js";
import WorkoutLog from "../models/workoutLog.model.js";
import Meal from "../models/meal.model.js";
import BodyEntry from "../models/bodyEntry.model.js";
import PerformanceEntry from "../models/performanceEntry.model.js";
import Follow from "../models/follow.model.js";
import Notification from "../models/notification.model.js";
import Reminder from "../models/reminder.model.js";
import Ticket from "../models/ticket.model.js";
import { AVATAR_DIR } from "../middlewares/upload.middleware.js";

export const deleteUserData = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return false;

  // 1. Delete avatar file if present
  if (user.profilePicture) {
    const filename = path.basename(user.profilePicture);
    const filePath = path.join(AVATAR_DIR, filename);
    await fs.unlink(filePath).catch(() => {});
  }

  // 2. Cascade delete all user documents
  await Promise.all([
    Workout.deleteMany({ user: userId }),
    WorkoutLog.deleteMany({ user: userId }),
    Meal.deleteMany({ user: userId }),
    BodyEntry.deleteMany({ user: userId }),
    PerformanceEntry.deleteMany({ user: userId }),
    Follow.deleteMany({ $or: [{ follower: userId }, { following: userId }] }),
    Notification.deleteMany({ $or: [{ user: userId }, { actor: userId }] }),
    Reminder.deleteMany({ user: userId }),
    Ticket.deleteMany({ user: userId }),
  ]);

  // 3. Delete the user
  await User.deleteOne({ _id: userId });

  return true;
};

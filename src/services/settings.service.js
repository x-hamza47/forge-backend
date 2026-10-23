import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

const UNITS = ["metric", "imperial"];
const NOTIFICATION_KEYS = ["workout", "meal", "goal"];
const PRIVACY_KEYS = ["isPrivate", "searchable", "showStats"];

export function toSettings(user) {
  const prefs = user.preferences ?? {};
  return {
    units: prefs.units ?? "metric",
    notifications: {
      workout: prefs.notifications?.workout ?? true,
      meal: prefs.notifications?.meal ?? true,
      goal: prefs.notifications?.goal ?? true,
    },
    privacy: {
      isPrivate: prefs.privacy?.isPrivate ?? false,
      searchable: prefs.privacy?.searchable ?? true,
      showStats: prefs.privacy?.showStats ?? true,
    },
  };
}

function assertBoolean(value, label) {
  if (typeof value !== "boolean") throw new ApiError(400, `${label} must be true or false.`);
}

export async function getSettings(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found.");
  return toSettings(user);
}

export async function updateSettings(userId, body = {}) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found.");

  if (body.units !== undefined) {
    if (!UNITS.includes(body.units)) throw new ApiError(400, "Invalid unit system.");
    user.set("preferences.units", body.units);
  }

  for (const key of NOTIFICATION_KEYS) {
    const value = body.notifications?.[key];
    if (value === undefined) continue;
    assertBoolean(value, `Notification setting "${key}"`);
    user.set(`preferences.notifications.${key}`, value);
  }

  if (user.role !== "admin") {
    for (const key of PRIVACY_KEYS) {
      const value = body.privacy?.[key];
      if (value === undefined) continue;
      assertBoolean(value, `Privacy setting "${key}"`);
      user.set(`preferences.privacy.${key}`, value);
    }
  }

  await user.save();
  return toSettings(user);
}
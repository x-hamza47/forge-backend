import mongoose from "mongoose";
import Reminder from "../models/reminder.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import ApiError from "../utils/ApiError.js";

const findOwned = async (userId, id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, "Reminder not found");
  const reminder = await Reminder.findOne({ _id: id, user: userId });
  if (!reminder) throw new ApiError(404, "Reminder not found");
  return reminder;
};

export const listReminders = async (userId) => {
  return Reminder.find({ user: userId }).sort({ time: 1, createdAt: -1 });
};

export const createReminder = async (userId, payload) => {
  return Reminder.create({
    user: userId,
    title: payload.title,
    kind: payload.kind,
    time: payload.time,
    days: payload.days ?? [0, 1, 2, 3, 4, 5, 6],
    active: payload.active ?? true,
  });
};

export const updateReminder = async (userId, id, payload) => {
  const reminder = await findOwned(userId, id);

  if (payload.title !== undefined) reminder.title = payload.title;
  if (payload.kind !== undefined) reminder.kind = payload.kind;
  if (payload.time !== undefined) reminder.time = payload.time;
  if (payload.days !== undefined) reminder.days = payload.days;
  if (payload.active !== undefined) reminder.active = payload.active;

  await reminder.save();
  return reminder;
};

export const deleteReminder = async (userId, id) => {
  const reminder = await findOwned(userId, id);
  await reminder.deleteOne();
};

export const getNextOccurrence = (reminder) => {
  const now = new Date();
  const currentDay = now.getDay();
  const [hours, minutes] = reminder.time.split(":").map(Number);

  for (let offset = 0; offset <= 7; offset++) {
    const checkDay = (currentDay + offset) % 7;
    if (reminder.days.includes(checkDay)) {
      const scheduled = new Date(now);
      scheduled.setDate(now.getDate() + offset);
      scheduled.setHours(hours, minutes, 0, 0);

      if (offset === 0 && now >= scheduled) {
        continue;
      }
      return scheduled;
    }
  }
  return null;
};

export const getUpcomingReminders = async (userId, limit = 5) => {
  const reminders = await Reminder.find({ user: userId, active: true });
  const upcoming = [];

  for (const reminder of reminders) {
    const nextDate = getNextOccurrence(reminder);
    if (nextDate) {
      upcoming.push({
        id: reminder.id,
        title: reminder.title,
        at: nextDate.toISOString(),
        kind: reminder.kind,
      });
    }
  }

  upcoming.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return upcoming.slice(0, limit);
};

export const checkDueReminders = async (userId) => {
  try {
    const user = await User.findById(userId).select("preferences.notifications");
    if (!user) return;

    const reminders = await Reminder.find({ user: userId, active: true });
    if (!reminders.length) return;

    const now = new Date();
    const currentDay = now.getDay();

    for (const reminder of reminders) {
      if (!reminder.days.includes(currentDay)) continue;

      const [hours, minutes] = reminder.time.split(":").map(Number);
      const scheduledToday = new Date(now);
      scheduledToday.setHours(hours, minutes, 0, 0);

      if (now >= scheduledToday) {
        const triggeredToday =
          reminder.lastTriggeredAt &&
          new Date(reminder.lastTriggeredAt).toDateString() === now.toDateString();

        if (!triggeredToday) {
          const prefAllowed = user.preferences?.notifications?.[reminder.kind] !== false;
          if (prefAllowed) {
            await Notification.create({
              user: userId,
              type: "reminder",
              message: `Reminder: ${reminder.title}`,
            });
          }
          reminder.lastTriggeredAt = now;
          await reminder.save();
        }
      }
    }
  } catch {
    // Fail silently so notifications polling never errors
  }
};

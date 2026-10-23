import asyncHandler from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import {
  listReminders,
  createReminder,
  updateReminder,
  deleteReminder,
} from "../services/reminder.service.js";

export const list = asyncHandler(async (req, res) => {
  const data = await listReminders(req.user._id);
  return ok(res, data, "Reminders fetched.");
});

export const create = asyncHandler(async (req, res) => {
  const data = await createReminder(req.user._id, req.body);
  return ok(res, data, "Reminder created.", 201);
});

export const update = asyncHandler(async (req, res) => {
  const data = await updateReminder(req.user._id, req.params.id, req.body);
  return ok(res, data, "Reminder updated.");
});

export const remove = asyncHandler(async (req, res) => {
  await deleteReminder(req.user._id, req.params.id);
  return ok(res, null, "Reminder deleted.");
});

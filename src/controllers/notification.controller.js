import asyncHandler from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
} from "../services/notification.service.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const data = await getNotifications(req.user._id, req.query);
  return ok(res, data, "Notifications fetched.");
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await getUnreadCount(req.user._id);
  return ok(res, { count }, "Unread count fetched.");
});

export const readAll = asyncHandler(async (req, res) => {
  await markAllRead(req.user._id);
  return ok(res, null, "All notifications marked as read.");
});

export const readOne = asyncHandler(async (req, res) => {
  await markRead(req.user._id, req.params.id);
  return ok(res, null, "Notification marked as read.");
});
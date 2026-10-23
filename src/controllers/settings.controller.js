import asyncHandler from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import { getSettings, updateSettings } from "../services/settings.service.js";

export const getMySettings = asyncHandler(async (req, res) => {
  const settings = await getSettings(req.user._id);
  return ok(res, settings, "Settings fetched.");
});

export const updateMySettings = asyncHandler(async (req, res) => {
  const settings = await updateSettings(req.user._id, req.body);
  return ok(res, settings, "Settings updated.");
});
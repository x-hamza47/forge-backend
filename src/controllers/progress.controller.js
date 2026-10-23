import asyncHandler from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import {
  getProgress,
  createBodyEntry,
  updateBodyEntry,
  deleteBodyEntry,
  createPerformance,
  updatePerformance,
  deletePerformance,
} from "../services/progress.service.js";

export const overview = asyncHandler(async (req, res) => {
  const data = await getProgress(req.user._id, req.query.range);
  return ok(res, data, "Progress fetched.");
});

export const createBody = asyncHandler(async (req, res) => {
  const data = await createBodyEntry(req.user._id, req.body);
  return ok(res, data, "Check-in logged.", 201);
});

export const updateBody = asyncHandler(async (req, res) => {
  const data = await updateBodyEntry(req.user._id, req.params.id, req.body);
  return ok(res, data, "Check-in updated.");
});

export const removeBody = asyncHandler(async (req, res) => {
  await deleteBodyEntry(req.user._id, req.params.id);
  return ok(res, null, "Check-in deleted.");
});

export const createPerf = asyncHandler(async (req, res) => {
  const data = await createPerformance(req.user._id, req.body);
  return ok(res, data, "Record logged.", 201);
});

export const updatePerf = asyncHandler(async (req, res) => {
  const data = await updatePerformance(req.user._id, req.params.id, req.body);
  return ok(res, data, "Record updated.");
});

export const removePerf = asyncHandler(async (req, res) => {
  await deletePerformance(req.user._id, req.params.id);
  return ok(res, null, "Record deleted.");
});
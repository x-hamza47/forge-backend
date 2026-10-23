import asyncHandler from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import {
  logWorkout,
  listLogs,
  getLog,
  deleteLog,
  listExerciseNames,
  getExerciseProgress,
} from "../services/workoutLog.service.js";

export const create = asyncHandler(async (req, res) => {
  const data = await logWorkout(req.user._id, req.body);
  return ok(res, data, "Workout logged.", 201);
});

export const list = asyncHandler(async (req, res) => {
  const data = await listLogs(req.user._id, req.query);
  return ok(res, data, "Workout history fetched.");
});

export const getOne = asyncHandler(async (req, res) => {
  const data = await getLog(req.user._id, req.params.id);
  return ok(res, data, "Workout log fetched.");
});

export const remove = asyncHandler(async (req, res) => {
  await deleteLog(req.user._id, req.params.id);
  return ok(res, null, "Workout log deleted.");
});

export const exerciseNames = asyncHandler(async (req, res) => {
  const data = await listExerciseNames(req.user._id);
  return ok(res, data, "Exercises fetched.");
});

export const exerciseProgress = asyncHandler(async (req, res) => {
  const data = await getExerciseProgress(req.user._id, req.params.name, req.query);
  return ok(res, data, "Exercise progress fetched.");
});
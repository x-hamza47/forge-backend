import asyncHandler from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import {
  listWorkouts,
  getWorkout,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  duplicateWorkout,
} from "../services/workout.service.js";

export const list = asyncHandler(async (req, res) => {
  const data = await listWorkouts(req.user._id, req.query);
  return ok(res, data, "Workouts fetched.");
});

export const getOne = asyncHandler(async (req, res) => {
  const data = await getWorkout(req.user._id, req.params.id);
  return ok(res, data, "Workout fetched.");
});

export const create = asyncHandler(async (req, res) => {
  const data = await createWorkout(req.user._id, req.body);
  return ok(res, data, "Workout created.", 201);
});

export const update = asyncHandler(async (req, res) => {
  const data = await updateWorkout(req.user._id, req.params.id, req.body);
  return ok(res, data, "Workout updated.");
});

export const remove = asyncHandler(async (req, res) => {
  await deleteWorkout(req.user._id, req.params.id);
  return ok(res, null, "Workout deleted.");
});

export const duplicate = asyncHandler(async (req, res) => {
  const data = await duplicateWorkout(req.user._id, req.params.id);
  return ok(res, data, "Workout duplicated.", 201);
});
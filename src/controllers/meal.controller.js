import asyncHandler from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import {
  getDay,
  getAnalytics,
  createMeal,
  updateMeal,
  deleteMeal,
} from "../services/meal.service.js";

export const day = asyncHandler(async (req, res) => {
  const data = await getDay(req.user._id, req.params.date);
  return ok(res, data, "Nutrition day fetched.");
});

export const analytics = asyncHandler(async (req, res) => {
  const data = await getAnalytics(req.user._id, req.query.range);
  return ok(res, data, "Nutrition analytics fetched.");
});

export const create = asyncHandler(async (req, res) => {
  const data = await createMeal(req.user._id, req.body);
  return ok(res, data, "Meal logged.", 201);
});

export const update = asyncHandler(async (req, res) => {
  const data = await updateMeal(req.user._id, req.params.id, req.body);
  return ok(res, data, "Meal updated.");
});

export const remove = asyncHandler(async (req, res) => {
  await deleteMeal(req.user._id, req.params.id);
  return ok(res, null, "Meal deleted.");
});
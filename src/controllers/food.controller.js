import asyncHandler from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import { searchFoods } from "../services/food.service.js";

export const search = asyncHandler(async (req, res) => {
  const data = await searchFoods(req.query.q);
  return ok(res, data, "Foods fetched.");
});
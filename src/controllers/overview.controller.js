import asyncHandler from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import { getOverview } from "../services/overview.service.js";

export const overview = asyncHandler(async (req, res) => {
  const data = await getOverview(req.user._id, req.query.range);
  return ok(res, data, "Overview fetched.");
});
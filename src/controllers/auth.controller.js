import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { ok } from "../utils/response.js";
import { registerUser, loginUser } from "../services/auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    throw new ApiError(400, "Name, username, email and password are required.");
  }

  const result = await registerUser({ name, username, email, password });

  return ok(res, result, "Account created successfully.", 201);
});

export const login = asyncHandler(async (req, res) => {
  const identifier = req.body.identifier || req.body.email;
  const { password } = req.body;

  if (!identifier || !password) {
    throw new ApiError(400, "Email (or username) and password are required.");
  }

  const result = await loginUser({ identifier, password });

  return ok(res, result, "Logged in successfully.");
});

export const getMe = asyncHandler(async (req, res) => {
  // req.user is set by the authenticate middleware (next file)
  return ok(res, { user: req.user }, "Current user fetched.");
});
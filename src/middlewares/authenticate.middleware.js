import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { env } from "../config/env.js";

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(401, "Not authenticated. Please log in.");
  }

  const token = header.split(" ")[1];

  const decoded = jwt.verify(token, env.jwtSecret);

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiError(401, "User no longer exists.");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated.");
  }

  req.user = user;
  next();
});
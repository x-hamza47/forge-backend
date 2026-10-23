import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { env } from "../config/env.js";

function generateToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export async function registerUser({ name, username, email, password }) {
  const existing = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { username: username.toLowerCase() },
    ],
  });

  if (existing) {
    const field = existing.email === email.toLowerCase() ? "Email" : "Username";
    throw new ApiError(409, `${field} is already in use.`);
  }

  const user = await User.create({ name, username, email, password });

  return { user, token: generateToken(user) };
}

export async function loginUser({ identifier, password }) {
  const value = identifier.trim().toLowerCase();

  // password has select: false, so we ask for it explicitly here
  const user = await User.findOne({
    $or: [{ email: value }, { username: value }],
  }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated. Contact support.");
  }

  return { user, token: generateToken(user) };
}
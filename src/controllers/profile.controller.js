import asyncHandler from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import { getProfile, updateProfile, getPublicProfile } from "../services/profile.service.js";

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await getProfile(req.user._id);
  return ok(res, profile, "Profile fetched.");
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await updateProfile(req.user._id, req.body, req.avatarPath);
  return ok(res, profile, "Profile updated.");
});

export const getPublicByUsername = asyncHandler(async (req, res) => {
  const profile = await getPublicProfile(req.user, req.params.username);
  return ok(res, profile, "Public profile fetched.");
});